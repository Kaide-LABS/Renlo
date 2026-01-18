from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

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
    Accepts audio file, returns transcription.
    Hour 12-16: Will integrate OpenAI Whisper API here.
    """
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    # Placeholder response - will be replaced with Whisper integration
    return {
        "transcript": "Simulated transcript: 5000 sq ft warehouse on Main St, asking $28 NNN.",
        "duration_seconds": 5.2,
        "status": "success"
    }


@app.post("/api/parse")
async def parse_transcript(transcript: str):
    """
    Accepts transcript text, returns structured CRE deal JSON.
    Hour 24-36: Will integrate GPT-4 Structured Outputs here.
    """
    # Placeholder response - will be replaced with GPT-4 integration
    return {
        "deal": {
            "property": {
                "name": None,
                "address": "Main St",
                "city": None,
                "state": None
            },
            "space": {
                "square_feet": 5000,
                "unit_type": "warehouse"
            },
            "financials": {
                "asking_rent": 28.00,
                "rent_type": "nnn",
                "rent_period": "per_sf_year"
            },
            "deal_context": {
                "owner_sentiment": None,
                "notes": None,
                "tour_date": None
            },
            "confidence": {
                "overall": 0.75,
                "fields_needing_review": ["city", "state", "property.name"]
            }
        },
        "status": "success"
    }
