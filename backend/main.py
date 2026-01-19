from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI, APIError, RateLimitError, AuthenticationError
import google.generativeai as genai


# Pydantic models for GPT-4 Structured Output
class Property(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class Space(BaseModel):
    square_feet: Optional[int] = None
    unit_type: Optional[str] = None  # office, warehouse, retail, industrial


class Financials(BaseModel):
    asking_rent: Optional[float] = None
    rent_type: Optional[str] = None  # nnn, gross, modified_gross
    rent_period: Optional[str] = None  # per_sf_year, per_sf_month, total_month


class DealContext(BaseModel):
    owner_sentiment: Optional[str] = None  # motivated, neutral, firm
    notes: Optional[str] = None
    tour_date: Optional[str] = None


class ContactInfo(BaseModel):
    phone: Optional[str] = None
    broker_name: Optional[str] = None
    company_name: Optional[str] = None


class Confidence(BaseModel):
    overall: float = 0.5
    fields_needing_review: List[str] = []


class KeyHighlight(BaseModel):
    category: str  # e.g., "Location Context", "Competition", "Building Class", "Urgency"
    detail: str    # e.g., "High rise in Ikoi", "High buyer interest, act fast"


class Deal(BaseModel):
    property: Property = Property()
    space: Space = Space()
    financials: Financials = Financials()
    contact: ContactInfo = ContactInfo()
    deal_context: DealContext = DealContext()
    confidence: Confidence = Confidence()
    highlights: List[KeyHighlight] = []
    headline: Optional[str] = None    # "Urgent Waterfront High-Rise in Ikoi"
    summary: Optional[str] = None     # 1-2 sentence broker pitch


# Image Analysis Models
class ImageAnalysisRequest(BaseModel):
    image: str  # base64 encoded
    transcript: str = ""


class SignData(BaseModel):
    phone_numbers: List[str] = []
    broker_name: Optional[str] = None
    company_name: Optional[str] = None
    address_from_sign: Optional[str] = None
    building_type: Optional[str] = None
    additional_info: Optional[str] = None


class ImageAnalysisResponse(BaseModel):
    extracted: SignData = SignData()
    raw_text: Optional[str] = None
    status: str = "success"
    confidence: Confidence = Confidence()


# Draft Generation Models
class GenerateDraftRequest(BaseModel):
    deal: Deal
    draft_type: str  # "loi" | "follow_up_email" | "property_summary"
    additional_context: Optional[str] = None


class GenerateDraftResponse(BaseModel):
    draft: str
    draft_type: str
    status: str = "success"


# Market Intelligence Models (Gemini)
class MarketIntelRequest(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    unit_type: Optional[str] = None  # office, retail, industrial
    square_feet: Optional[int] = None
    asking_rent: Optional[float] = None


class MarketIntelResponse(BaseModel):
    comparison: str  # "below_market" | "at_market" | "above_market" | "unknown"
    percentage: Optional[int] = None  # e.g., 15 for "15% below"
    market_range: Optional[str] = None  # "$80-$120/SF"
    explanation: str  # 1-2 sentence context
    sources: List[str] = []  # URLs from search
    status: str = "success"


load_dotenv()

# Initialize OpenAI client lazily (only when API key is available)
_client = None


def get_openai_client():
    """Get or create OpenAI client. Raises if API key not configured."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY not configured. Create backend/.env with your API key."
            )
        _client = OpenAI(api_key=api_key)
    return _client


# Initialize Gemini client lazily
_gemini_model = None


def get_gemini_model():
    """Get or create Gemini model. Raises if API key not configured."""
    global _gemini_model
    if _gemini_model is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY not configured. Add it to backend/.env"
            )
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel(
            'gemini-2.0-flash',
            tools='google_search_retrieval'
        )
    return _gemini_model

app = FastAPI(
    title="Renlo Voice Commander",
    description="Voice-to-Deal API for commercial real estate brokers",
    version="0.1.0"
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "online", "service": "Renlo Voice Commander"}


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts audio file, transcribes using OpenAI Whisper API.
    Returns transcript text and duration.
    """
    # Validate audio content type
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    # Save uploaded file
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'webm'
    save_path = f"{uploads_dir}/{timestamp}.{ext}"

    contents = await file.read()

    # Check file size (Whisper limit is 25MB)
    file_size_mb = len(contents) / (1024 * 1024)
    if file_size_mb > 25:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file too large ({file_size_mb:.1f}MB). Maximum is 25MB."
        )

    with open(save_path, "wb") as f:
        f.write(contents)

    print(f"[DEBUG] Saved: {save_path} | Type: {file.content_type} | Size: {len(contents)} bytes")

    # Call OpenAI Whisper API
    try:
        client = get_openai_client()
        with open(save_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"  # Gets duration and segments
            )

        return {
            "transcript": transcription.text,
            "duration_seconds": getattr(transcription, 'duration', None),
            "filename": save_path,
            "status": "success"
        }

    except AuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Invalid OpenAI API key. Check your OPENAI_API_KEY in .env"
        )
    except RateLimitError as e:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again in a moment."},
            headers={"Retry-After": "60"}
        )
    except APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )


@app.post("/api/parse")
async def parse_transcript(transcript: str):
    """Extract structured CRE deal data from transcript using GPT-4."""
    try:
        client = get_openai_client()

        completion = client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a CRE (Commercial Real Estate) data extraction assistant.
Extract deal information from broker voice notes. Be conservative with strict fields - only extract data explicitly mentioned.

The input may include "Visual Context from photo:" sections with data extracted from sign photos.
IMPORTANT: Extract phone numbers, broker names, and company names into the contact field.

For rent_type: use 'nnn' for triple net, 'gross' for gross lease, 'modified_gross' for modified gross.
For rent_period: determine if the price is per_sf_year, per_sf_month, or total_month based on context.
Set confidence.overall between 0-1 based on how complete/clear the information is.
List any fields that seem uncertain in fields_needing_review.

IMPORTANT - Deal Presentation:
Generate a compelling 'headline' (3-6 words) that captures the deal's most exciting aspects.
Examples: "Urgent Waterfront Office in Ikoi", "Prime Retail Below Market", "Motivated Seller Industrial"

Generate a 'summary' (1-2 sentences) - a broker pitch that sells the deal's key value proposition.
Example: "A rare 10,000 SF waterfront high-rise in Ikoi with motivated seller facing multiple offers. Act fast - this won't last."

Prioritize what makes this deal INTERESTING, not just the raw data.

IMPORTANT - Dynamic Highlights:
If you hear important details that don't fit the strict fields, capture them in the 'highlights' array.
Each highlight has a 'category' and 'detail'. Be generous - if something sounds important to a broker, capture it.

Common highlight categories:
- "Location Context" (neighborhood, area description, nearby landmarks, district)
- "Building Class" (high-rise, mid-rise, Class A/B/C, tower, walk-up)
- "Competition" (other offers, buyer interest, market demand, bidding situation)
- "Urgency" (time pressure, deadlines, seller motivation, need to act fast)
- "Condition" (renovated, needs work, move-in ready, newly built)
- "Amenities" (parking, elevator, loading dock, security, HVAC)
- "Market Intel" (comparable deals, area trends, pricing context)

Example highlights:
- {"category": "Location Context", "detail": "High-rise building in Ikoi neighborhood"}
- {"category": "Competition", "detail": "Multiple offers on the table, high buyer interest"}
- {"category": "Urgency", "detail": "Need to act quickly, seller reviewing offers this week"}"""
                },
                {"role": "user", "content": transcript}
            ],
            response_format=Deal
        )

        deal = completion.choices[0].message.parsed

        return {
            "deal": deal.model_dump(),
            "status": "success"
        }

    except AuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Invalid OpenAI API key. Check your OPENAI_API_KEY in .env"
        )
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again in a moment."
        )
    except APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GPT-4 extraction failed: {str(e)}")


@app.post("/api/analyze")
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze an image (e.g., For Lease sign) using GPT-4o vision.
    Extracts phone numbers, broker names, company info, and addresses.
    """
    try:
        client = get_openai_client()

        # Build the message content with image
        messages = [
            {
                "role": "system",
                "content": """You are a commercial real estate sign analyzer.
Extract information from photos of For Sale/For Lease signs.

Look for and extract:
- Phone numbers (any format)
- Broker or agent names
- Company/brokerage names
- Property addresses visible on the sign
- Building type indicators (office, retail, warehouse, industrial)
- Any other relevant info (price, SF, availability dates)

Be thorough but only extract what's clearly visible. Return empty values if not found."""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{request.image}",
                            "detail": "high"
                        }
                    },
                    {
                        "type": "text",
                        "text": f"Extract all information from this commercial real estate sign.{' Context from voice memo: ' + request.transcript if request.transcript else ''}"
                    }
                ]
            }
        ]

        completion = client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=messages,
            response_format=SignData
        )

        sign_data = completion.choices[0].message.parsed

        return {
            "extracted": sign_data.model_dump(),
            "status": "success"
        }

    except AuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Invalid OpenAI API key. Check your OPENAI_API_KEY in .env"
        )
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again in a moment."
        )
    except APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@app.post("/api/generate-draft")
async def generate_draft(request: GenerateDraftRequest):
    """
    Generate business documents (LOI, Follow-up Email) from deal data using GPT-4o.
    """
    try:
        client = get_openai_client()

        # Build prompt based on draft type
        if request.draft_type == "loi":
            system_prompt = """You are a commercial real estate attorney's assistant.
Generate a professional Letter of Intent based on the deal data provided.

Include:
- Property address and description
- Proposed lease terms (rent, square footage, lease type)
- Standard contingencies (due diligence, financing, inspection)
- Professional closing

Keep it formal but concise. Use placeholder brackets [BUYER NAME], [DATE], etc. for unknown fields.
Format as a professional business letter."""

        elif request.draft_type == "follow_up_email":
            system_prompt = """You are a commercial real estate broker.
Write a professional follow-up email after a property tour.

Include:
- Thank the property contact for their time
- Summarize key property details and your client's interest
- Mention next steps (submit LOI, schedule follow-up, request documents)
- Professional sign-off

Keep it warm but professional. 3-4 paragraphs max.
Use placeholder brackets [YOUR NAME], [CLIENT NAME] for unknown fields."""

        elif request.draft_type == "property_summary":
            system_prompt = """You are a commercial real estate analyst.
Create a concise property summary based on the deal data.

Include:
- Property overview (address, type, size)
- Financial terms
- Key observations and broker notes
- Recommended next steps

Keep it professional and scannable. Use bullet points where appropriate."""

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid draft_type: {request.draft_type}. Must be 'loi', 'follow_up_email', or 'property_summary'"
            )

        # Format deal data for the prompt
        deal = request.deal
        deal_context = f"""
Property: {deal.property.address or '[ADDRESS]'}, {deal.property.city or ''} {deal.property.state or ''}
Property Name: {deal.property.name or 'N/A'}
Space: {deal.space.square_feet or '[SQUARE FEET]'} SF {deal.space.unit_type or ''}
Asking Rent: ${deal.financials.asking_rent or '[RENT]'} {deal.financials.rent_type or ''} ({deal.financials.rent_period or 'per SF/year'})
Contact: {deal.contact.broker_name or '[BROKER]'} at {deal.contact.company_name or '[COMPANY]'}
Phone: {deal.contact.phone or '[PHONE]'}
Owner Sentiment: {deal.deal_context.owner_sentiment or 'Unknown'}
Notes: {deal.deal_context.notes or 'None provided'}
Tour Date: {deal.deal_context.tour_date or '[DATE]'}
"""

        if request.additional_context:
            deal_context += f"\nAdditional Context: {request.additional_context}"

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate the document based on this deal:\n{deal_context}"}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        draft_text = completion.choices[0].message.content

        return GenerateDraftResponse(
            draft=draft_text,
            draft_type=request.draft_type,
            status="success"
        )

    except AuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Invalid OpenAI API key. Check your OPENAI_API_KEY in .env"
        )
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again in a moment."
        )
    except APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")


@app.post("/api/market-intel")
async def get_market_intel(request: MarketIntelRequest):
    """
    Use Gemini + Google Search to assess deal pricing against market rates.
    Returns comparison (below/at/above market) with explanation.
    """
    try:
        model = get_gemini_model()

        # Build search-focused prompt
        location = f"{request.address or 'Unknown'}, {request.city or 'Unknown'}"
        property_type = request.unit_type or 'commercial'

        prompt = f"""Search for current commercial real estate rental rates and analyze this deal:

Location: {location}
Property Type: {property_type}
Size: {request.square_feet or 'Unknown'} SF
Asking Rent: ${request.asking_rent or 'Unknown'}/month

Tasks:
1. Search for typical {property_type} rental rates in {request.city or 'this area'}
2. Compare the asking rent to market rates
3. Determine if this is below_market, at_market, or above_market

Respond in JSON format only (no markdown code blocks):
{{
  "comparison": "below_market" | "at_market" | "above_market",
  "percentage": <number or null>,
  "market_range": "<range like $X-$Y/SF or $X-$Y/month>",
  "explanation": "<1-2 sentence market context>"
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Extract JSON from response (handle potential markdown code blocks)
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            result_data = json.loads(json_match.group())
        else:
            # Try to parse the whole response as JSON
            result_data = json.loads(response_text)

        # Extract sources from grounding metadata if available
        sources = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                metadata = candidate.grounding_metadata
                if hasattr(metadata, 'grounding_chunks'):
                    for chunk in metadata.grounding_chunks:
                        if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                            sources.append(chunk.web.uri)

        return MarketIntelResponse(
            comparison=result_data.get('comparison', 'unknown'),
            percentage=result_data.get('percentage'),
            market_range=result_data.get('market_range'),
            explanation=result_data.get('explanation', 'Market comparison completed.'),
            sources=sources[:5],  # Limit to 5 sources
            status="success"
        )

    except json.JSONDecodeError as e:
        print(f"[DEBUG] JSON parse error: {e}, response: {response_text[:500]}")
        return MarketIntelResponse(
            comparison="unknown",
            explanation="Could not parse market data response.",
            status="error"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG] Market intel error: {str(e)}")
        return MarketIntelResponse(
            comparison="unknown",
            explanation=f"Could not retrieve market data: {str(e)}",
            status="error"
        )
