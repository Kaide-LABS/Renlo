# Gemini Context Log

This file stores context and suggestions from Gemini conversations.

---

## 2026-01-18 - Initial Strategy Session

**Topic:** High-impact demo suggestions for Renlo pitch

**User's Question:** Based on the strategic analysis, what high-level demo can I pitch to this company? I build high-impact AI demos for pre-seed startups in 72 hours—risk-free.

**Gemini's Response:**

### Initial Pitch: "The Zero-Click Ingestion Engine"

**The Hook:** "You are building the 'System of Intelligence.' I want to build the 'Eyes' that feed it. Right now, your users are still manually typing data from PDF flyers and messy emails, which makes Excel faster than Renlo. In 72 hours, I will build a drag-and-drop 'Sidecar Service' that turns unstructured chaos into structured deal data."

**The Demo Experience:**
- **Input:** A simple React drop-zone overlay
- **Action:** Drag a raw, messy commercial real estate PDF (LoopNet flyer, rent roll scan, lease comp) onto the window
- **Processing:** OCR (AWS Textract) + LLM (GPT-4o) to identify document type and extract key fields (Address, Cap Rate, NOI, Tenant Name, Lease Expiry)
- **Output:** Perfectly formatted JSON object ready to inject into Renlo database with "Review & Save" button

**Strategic Rationale:**
1. Kills the "Excel Competitor" - makes Renlo faster than Excel
2. Solves "Apto Fatigue" - proves Renlo is anti-Apto (fewer clicks)
3. Respects their architecture - standalone microservice, zero refactoring risk
4. Hits the "Innovation Gap" - AI-native ingestion without third-party integrations

---

### Four Alternative Demo Options:

#### Option 1: The "Owner Detective" Agent
**Concept:** Background enrichment service solving the "Holy Grail" problem - finding human owner behind opaque LLCs.

**Pitch:** "Renlo promises 'Deal Intelligence,' but users still have to leave the app to Google '123 Main St LLC'. I will build an agent that automatically takes an LLC name, scrapes the state business registry for the registered agent, cross-references it with LinkedIn, and probabilistically guesses the human owner—displaying it directly on the Deal card."

**Build (72h):**
- Stack: Python (FastAPI) + Puppeteer (Scraping) + OpenAI (Name Parsing)
- Input: "River North Holdings LLC"
- Output: JSON { "Owner": "John Doe", "Confidence": "High", "Source": "Link" }

**Why Renlo Buys:** Fills the "Innovation Gap" - competitors require expensive third-party plugins.

#### Option 2: The "Smart Follow-Up" Sentinel
**Concept:** Automated retention engine that turns "Unified Relationships" from slogan into revenue driver.

**Pitch:** "Your 'Unified Relationships' feature is passive. I'll make it active. I'll build a background worker that scans for high-value prospects untouched in 30 days, retrieves the last meeting notes, and drafts a hyper-personalized 'Thinking of you' email for the broker to review."

**Build (72h):**
- Stack: Node.js (Worker) + OpenAI API
- Query DB for last_contact > 30 days, fetch meeting_notes, prompt LLM for casual catch-up email

**Why Renlo Buys:** Solves the "Relationship Engine" gap, demonstrates immediate ROI.

#### Option 3: The "Voice-to-Deal" Field Commander
**Concept:** Mobile-first PWA solving the "Mobile Void" left by Buildout and Apto.

**Pitch:** "Brokers spend half their day in cars, but Apto's mobile experience is non-existent. I will build a simple 'Voice Button' PWA. A broker taps it, says 'Just toured the Smith Building, 5k square feet, $30 gross rent,' and the system transcribes it, parses it into JSON, and injects a new Deal record instantly."

**Build (72h):**
- Stack: React (Frontend) + OpenAI Whisper (Audio-to-Text) + GPT-4 (Text-to-JSON)

**Why Renlo Buys:** Attacks the "Excel and Inertia" competitor - if you don't type at all, Renlo wins.

#### Option 4: The "Instant Deal Room" Generator
**Concept:** Marketing bridge eliminating need for external tools like Buildout for flyers/websites.

**Pitch:** "Right now, your users have to export data to create a property website. I'll build a 'Publish' button. One click takes the property photos and data, injects them into a slick Next.js template, and deploys a live 'deal-name.renlo.site' URL in under 10 seconds."

**Build (72h):**
- Stack: Next.js (SSG) + Vercel API

**Why Renlo Buys:** Creates "Viral Loop" - every public website carries Renlo branding.

---

### Gemini's Recommendations:
- **Biggest "Technical Flex":** Option 1 (Owner Detective) - shows ability to handle messy real-world data and external scraping
- **Best "Visual Demo":** Option 3 (Voice-to-Deal) - voice command turning into database row is magic in a Zoom demo

---

### What Renlo Does (Layman's Terms):

**One-Sentence:** Renlo is a smart, automated workspace for commercial real estate brokers that replaces clunky old databases and spreadsheets.

**Old Way vs. Renlo Way:**
- **Old Way (Apto/Salesforce):** Dumb filing cabinet - broker manually types everything, creates more work, just sits there
- **Renlo Way:** Smart robot assistant - reads emails for deal details, reminds about follow-ups, organizes automatically

**The 3 Main Jobs:**
1. **Reads for the Broker:** Auto-fills forms from PDF documents
2. **Connects Everything:** Central "brain" connecting email, calendar, property lists
3. **Predicts Needs:** Tells broker who to call and when

**Why It Exists:** Most brokers use Excel because existing software is too slow/complicated. Renlo aims to be faster and easier than a spreadsheet.

---

**User's Decision:** Wants to proceed with Option 1 - "The Owner Detective Agent"

---

## 2026-01-18 - Hour 0-4 Execution Pack

**Topic:** Project scaffolding for Voice-to-Deal PWA

**Gemini said:**

"Yes, the plan is solid. We are good to go. Let's not waste time. Here is your Hour 0-4 Execution Pack."

### Provided Scaffolding:

**Project Structure:**
```
renlo-voice-commander/
├── frontend/          # React + Vite
│   └── src/App.jsx    # Basic UI with mic button
└── backend/           # FastAPI
    └── main.py        # API skeleton with /api/transcribe
```

**Backend Stack:**
- FastAPI + Uvicorn
- python-multipart (file uploads)
- openai SDK
- python-dotenv

**Frontend Stack:**
- React + Vite
- lucide-react (icons)

**Key Code Provided:**
1. `backend/main.py` - FastAPI server with CORS, health check, placeholder `/api/transcribe`
2. `frontend/src/App.jsx` - Basic UI with recording toggle, placeholder transcript display

**Next Milestone:** Hour 4-8 MediaRecorder Logic

---

## 2026-01-19 - Plan Evaluation

**Topic:** Critical review of Hour 4-8 MediaRecorder Integration plan

**Gemini said:**

### Critical Gaps & Risks

**1. Backend Readiness (Major Blocker):**
- The Issue: The plan assumes the backend is ready to receive the WebM file. `backend/main.py` currently returns a hardcoded string ("Simulated transcript...").
- The Risk: Frontend sends real audio, but backend ignores it and returns fake text every time. Cannot verify if audio recording actually worked or if quality is sufficient until Whisper integration (Hour 12-16).
- Suggestion: Add step to save uploaded file to temporary directory in backend. Allows playback to verify codec/quality before Whisper.

**2. MIME Type Mismatch:**
- The Issue: Frontend correctly handles Safari (audio/mp4) vs Chrome (audio/webm), but backend only checks `if not file.content_type.startswith("audio/")`.
- The Risk: Safari sends audio/mp4 or audio/x-m4a which might not be "audio/webm" Whisper prefers.
- Suggestion: Ensure backend logs incoming content_type for debugging what browsers actually send.

**3. Missing "Processing" State UI for Upload Time:**
- The Issue: Plan moves from simulated setTimeout to real network request.
- The Risk: Uploading large audio blob (1MB+) can take seconds on slow networks. Current isProcessing state covers this, but no progress bar. If upload hangs, user just sees spinner.
- Suggestion: Add UI indicator for "Uploading..." vs "Transcribing..." to differentiate network lag from backend processing.

### What is Good
- Architecture: MediaRecorder + WebM is right move - native, fast, avoids "lamejs" complexity
- Hook Pattern: useAudioRecorder hook cleanly separates logic from UI
- Safari Fallback: Explicitly handling MP4 fallback is often missed detail

### Verdict
Do not expect "real" transcription yet. Plan successfully builds infrastructure to record and send audio, but without corresponding backend update to process that audio, feature will still feel "fake".

### Actionable Recommendation
Proceed with frontend plan, but add step to modify `backend/main.py` to temporarily save incoming file to disk (e.g., `uploaded_test.webm`). Gives concrete way to verify frontend success immediately.

---

## 2026-01-19 - Whisper Integration Plan Review

**Topic:** Evaluation of Hour 8-16 OpenAI Whisper integration plan

**Gemini said:**

### Evaluation:

1. **Dependencies:** `backend/requirements.txt` correctly includes `openai`. The plan mentions creating it if it doesn't exist, which is good practice.

2. **Environment Variables:** Adding `OPENAI_API_KEY` to `.env` is standard security practice.

3. **Endpoint Logic:**
   - The code correctly initializes the OpenAI client.
   - It re-opens the saved file (from the previous step's logic) to send to Whisper. This is robust because it ensures we are sending the exact bytes that were saved to disk.
   - `response_format="verbose_json"` is a good choice as it provides metadata like duration, which might be useful later.

4. **Error Handling:** The plan explicitly lists common error scenarios (invalid key, rate limit) and suggests handling them, which is crucial for a robust backend.

### One Minor Suggestion (Safety):
The plan says `echo "OPENAI_API_KEY=sk-your-key" > .env`.

- **Safety Check:** You should NOT actually execute a command that hardcodes a dummy key like that if you intend to ask the user for a real one. Instead, you should ask the user to provide their key securely or simply create the `.env.example` file and let the user fill in their `.env` manually.

- **Better Approach:** Create `.env.example` with `OPENAI_API_KEY=` and then ask the user to create `.env` with their actual key. Do not try to write the actual key via the CLI arguments unless necessary, to avoid it ending up in shell history.

### Verdict:
The plan is sound. Proceed, but be careful with how you handle the API key setup to ensure security.

---

## 2026-01-19 - AI Enhancement Brainstorm ("Make It Hit")

**Topic:** How to AI-enhance the current Voice-to-Deal demo to make it irresistible

**User's Question:** The current demo is cool but not hitting hard enough. What can we do with OpenAI and Gemini keys to make it so good they feel stupid saying no?

**Gemini said:**

> This "Renlo Voice Commander" is currently just a fancy dictaphone. It listens, types, and sorts. That's useful, but it's not "magic." To make them feel stupid for saying no, the AI needs to stop being a secretary and start being a partner.

### 5 Aggressive "Power Ups":

#### 1. The "Detective" Mode (Multimodal - High Wow Factor)
- **Upgrade:** Allow user to snap a photo of the building or "For Lease" sign while recording
- **AI Magic:** Vision AI reads phone number/broker name off sign, identifies building type from facade
- **UX:** Snap a pic, talk for 10 seconds, AI pre-fills contact card including info they didn't even speak

#### 2. "Instant Action" Generation (The Time Saver)
- **Upgrade:** Don't just save the deal - immediately generate artifacts
- **AI Magic:** After parsing, generate three buttons:
  - "Draft Offer Email" - writes LOI based on voice notes
  - "Draft Listing Blurb" - writes marketing copy for LoopNet/CoStar
  - "Draft Owner Text" - fast follow-up message
- **UX:** They finish talking, work is already done, just hit "Send"

#### 3. "The Oracle" (Market Intelligence via Gemini)
- **Upgrade:** Real-time feedback on deal parameters
- **AI Magic:** Cross-reference extracted data with market data
  - Broker: "Asking $45 NNN"
  - AI: "Note: 15% above average for [Neighborhood] Office (~$38). Owner might be unrealistic."
- **UX:** App warns if deal is bad or highlights if it's a steal

#### 4. "Interrogation Mode" (Active Learning)
- **Upgrade:** If broker forgets key field, AI talks back
- **AI Magic:** Text-to-Speech follow-up questions
  - Broker: "Nice warehouse on 5th." (stops)
  - AI: "Got it. But you missed asking rent and square footage. What are they?"
- **UX:** Feels like talking to smart assistant, not dumb form

#### 5. "Total Recall" (Vector Database)
- **Upgrade:** Semantic search over previous voice notes
- **AI Magic:** Store transcript embeddings
  - Broker: "What was that warehouse with the leaky roof I saw last month?"
  - AI: Pulls up specific deal from 3 weeks ago
- **UX:** Never forget a property again

### Gemini's Kill Shot Recommendation:
> Combine #1 (Photo) and #2 (Instant Action).
> If you can show a broker snapping a picture of a sign, mumbling a few words, and then immediately showing them a Drafted Offer Email ready to send... that is a "shut up and take my money" demo.

---

## 2026-01-19 - "Kitchen Sink" Integration Plan

**Topic:** How to integrate ALL 5 features without breaking the demo

**Gemini said:**

> Integrating everything at once is a recipe for a broken, half-finished demo that crashes during the presentation. But we can integrate versions of everything to create a seamless "Super Broker" narrative.

### The "Super Broker" Pipeline

#### Phase 1: The Input (Multimodal) - Features #1 & #4
1. **UI Update:** Add "Camera" button next to Mic
2. **Flow:** User snaps pic → User talks → User stops
3. **Backend:** Send Image + Audio to Backend
   - Use GPT-4o (handles image + text natively)
   - Prompt: "Extract deal details. Use the image to find phone numbers, names, or addresses the voice missed. If critical info (price, size) is missing from BOTH, flag it."
   - **Feedback:** If AI flags missing info, UI pops up toast: "Missing Rent/Size - Tap to add" (simpler Interrogation Mode)

#### Phase 2: The Intelligence (Context) - Features #3 & #5
1. **Backend:** After extraction, run parallel "Enrichment" task
   - Use Gemini Pro with Search
   - Prompt: "Given this address and price, search for 'average commercial rent in [neighborhood]'. Is this deal expensive or cheap? 1-sentence market stat."
2. **Database:** Simple SQLite for demo. Store vector embeddings of transcripts
3. **UI:** Display Deal Card with "Market Insight: 15% Above Market Avg" badge

#### Phase 3: The Output (Action) - Feature #2
1. **UI:** Below deal card, add "Actions" carousel: [Draft LOI] [Draft Follow-up] [Listing Copy]
2. **Backend:** Pre-generate drafts using extracted JSON
3. **Interaction:** User taps "Draft LOI" → Modal opens with text ready to copy/share

### Handling Latency (The Bottleneck)
Audio + Image + Market Search + Drafts = ~10-15 seconds

**The Fix: Streaming & Optimistic UI**
1. Show "Transcribing..." (Audio)
2. Show "Analyzing Image..." (Image)
3. **POP:** Deal Card appears (Basic data)
4. Background: Market Search & Drafts continue
5. **POP:** "Market Insight" badge appears
6. **POP:** Action buttons light up

### Execution Priority (Next 24 Hours)
1. **Multimodal Upgrade (HIGH):** Camera + GPT-4o Image+Text
2. **Action Generators (HIGH):** Email/LOI endpoints - easy win
3. **Market Intel (MEDIUM):** Gemini Search for "Insight Badge"
4. **Vector Search (LOW):** Fake it with JSON/SQLite if needed

### Gemini's Verdict:
> Don't try to build "Vector Database" infrastructure from scratch. Use local JSON or SQLite for "history" to fake "Total Recall" if needed.
> **Focus on Multimodal (Camera) + Instant Action (Email Drafts). That is the visual "hook".**

---

## 2026-01-19 - Plan Risk Evaluation & Phasing

**Topic:** Critical review of "Super Broker" integration plan

**Gemini said:**

> This is a massively ambitious plan, bundling almost all the features into a single execution. While exciting, it carries significant risk of breaking the existing stable loop if not handled carefully.

### Critical Issues Identified:

1. **Backend Flow Dependency:**
   - `/api/analyze` takes `transcript` as input, meaning frontend must:
     1. Call `/api/transcribe` → get text
     2. Call `/api/analyze` → send image + transcript
     3. Wait for result
   - This sequential dependency needs careful handling

2. **Frontend Complexity Risk:**
   - `App.jsx` managing too much state (processingStage, capturedImage, dealData, draftContent)
   - If API call chaining is messy, UI will hang
   - **App.jsx is the point of failure**

3. **Missing Pieces:**
   - Icons need importing (Camera, FileText, MessageSquare, Megaphone)
   - Modal needs CSS/Tailwind classes
   - Handle `capturedImage = null` case (voice-only flow)

### Gemini's Recommended Phasing:

#### Phase 1: Vision & Core Data ("Detective" Mode)
- Backend: Add `/api/analyze` (Vision)
- Frontend: Add `useCamera` hook + Camera button
- Frontend: Chain Transcribe → Analyze (if image) → Display Deal
- **Outcome:** Snap pic + talk = see merged data

#### Phase 2: Instant Actions ("Closer" Mode)
- Backend: Add `/api/generate-draft`
- Frontend: Add Action Buttons (Draft LOI, Follow-up)
- Frontend: Add Modal for draft display
- **Outcome:** Click button = get copyable text

#### Phase 3: Intelligence & Polish ("Oracle" Mode)
- Backend: Add `/api/market-intel`
- Frontend: Add MarketBadge component
- Frontend: Add MissingFields toast
- Frontend: Add dealHistory (localStorage)
- **Outcome:** Market knowledge + reliability features

### Gemini's Verdict:
> Start with Phase 1. It's the most complex part (handling binary image data + audio). Once that works, adding the "Generate Email" buttons (Phase 2) is trivial.

---

## 2026-01-19 - Phase 1 Plan Approval

**Topic:** Final review of Phase 1 (Detective Mode) plan

**Gemini said:**

> This plan for Phase 1 is much more focused and manageable. It tackles the core "Multimodal" value proposition without overcomplicating the UI.

### Evaluation:

1. **Architecture:** Good separation of concerns (useCamera hook, App.jsx state flow, backend processing)

2. **Image Handling:** Using `input type="file" capture="environment"` is the correct "low code" way to access camera on mobile - opens native OS camera UI, robust approach

3. **Data Merging Gap Identified:**
   - Plan says "Merge sign data into deal parsing" but doesn't explain HOW
   - Current `parseDeal` only takes transcript

### Gemini's Fix:
> Append the visual analysis result to the transcript string as "Context" before sending to `/api/parse`. This avoids changing the API signature.

Example enriched transcript:
```
"Looking at a warehouse on 5th street..."

Visual Context: Sign shows phone 555-1234, broker John Smith from ABC Realty, address 500 5th Street
```

### Verdict:
> Proceed with Phase 1. I will check the implementation details (especially image compression/base64) as we go.

---

## 2026-01-19 - "Sentient UI" Proposal (Dynamic Deal Card)

**Topic:** User frustrated with rigid form-like UI despite Key Highlights feature

**User's Frustration:**
> "I want it to be very dynamic still. It's still kind of rigid to some extent... We're building a freaking intelligence robot here, man. Come on, why the hell should it be so rigid?"

**Example Transcript:**
> "A high rise office building in Ikoi, Lagos State. It is going for $120,000 monthly. It is a 10,000 square foot lot. The buyer has a lot of offers on their hands and there is a lot to pick from and there is a lot of competition. It is quite urgent and I forgot to mention, it is also a waterfront apartment which our clients like."

**Gemini said:**

The user is pushing for extreme dynamism. He sees the "Key Highlights" as an improvement, but still feels the "Deal Card" (Strict Fields) + "Highlights" (List) is too rigid or "form-like."

He wants the UI to adapt to the content. If the deal is about a "Waterfront High Rise," the UI should scream that, not just bury it in a list.

### The "Thinking Out of the Box" Idea: The "Sentient" UI

Instead of a static form (Address, Size, Price) + a list of bullets, let's make the Headlines dynamic.

**Proposed Features:**

1. **Dynamic Deal Title:** Instead of just "Deal Card", have the AI generate a Punchy Headline for the deal.
   - Example: "Urgent Waterfront High-Rise in Ikoi"

2. **Smart Badges:** Use the "Highlights" to drive visual tags at the top.
   - If "Urgency" is high -> Red "Urgent" badge
   - If "Competition" is high -> Orange "Hot Deal" badge
   - If "Waterfront" is mentioned -> Blue "Waterfront" badge

3. **Narrative Summary:** A 2-sentence "Broker Pitch" generated by AI that sits at the top.

### Is this "Intelligence Robot" level?
> Yes. It stops looking like a database entry and starts looking like a curated listing.

### Plan Adjustment:
We don't need to change the backend schema much (we already have highlights). We need to change the Frontend Rendering to be "smart" about how it uses those highlights.

### Proposed "Dynamic UI" Plan:

1. **Backend:** Ask GPT-4o for two extra fields:
   - `headline` (a 3-5 word punchy title)
   - `summary` (a 2-sentence broker pitch)

2. **Frontend:**
   - **Hero Section:** Large dynamic headline
   - **Smart Tags:** Map specific keywords in highlights to visual icons/colors (e.g., "urgent" -> Red Flame)
   - **Fluid Layout:** If "Financials" are missing, don't show empty fields. If "Highlights" are the main story, put them top-center

---

## 2026-01-19 - Phase 3: The "Oracle" (Market Intelligence)

**Topic:** Post-Phase 2.5 roadmap - adding deep intelligence features

**Gemini said:**

We've completed Phase 1 (Multimodal/Camera) and Phase 2 (Instant Actions/Drafts), and we just injected a "Phase 2.5" (Sentient UI) to make it look amazing.

Phase 3 was originally "Intelligence & Polish" (The Oracle Mode).

Now that the UI is dynamic and we have the "Smart Badges," Phase 3 becomes about Deep Intelligence.

### Phase 3: The "Oracle" (Market Intelligence)

**Goal:** Give the broker a "Second Brain." Don't just tell them what they said; tell them what it means in the market context.

### The Features:

#### 1. Market Comparison (The "Insight" Badge)
- **What:** Is this deal expensive or cheap?
- **How:** Backend endpoint `/api/market-intel`. Use GPT-4o (or Gemini) to estimate: "Typical rent for [Neighborhood] [Asset Class] is $X. This deal is [Above/Below]."
- **UI:** A badge next to the price: "📉 15% Below Market" or "📈 Premium Pricing"

#### 2. Missing Field Detection (The "Coach")
- **What:** Did the broker forget something critical?
- **How:** Frontend logic checks for null fields
- **UI:** A "Toast" notification: "⚠️ Missing Square Footage. Tap to add."

#### 3. Deal History (Local Memory)
- **What:** "Show me that deal from last week."
- **How:** Save deals to localStorage (simple) or a lightweight DB
- **UI:** A "Recent Deals" list on the home screen

### Why This Matters Now:
We have the "Flash" (Sentient UI). Now we need the "Substance" (Market Data). If the app tells a broker "This is 20% overpriced," they will never delete the app.

---

## 2026-01-19 - Multi-Agent Architecture Decision (GPT-4o + Gemini)

**Topic:** Using Gemini API for market intelligence instead of scraping CoStar

**User's Question:** Can we use a multi-agent workflow where GPT-4o talks to Gemini API, and Gemini uses Google Search to get market data?

**Gemini said:**

This is a brilliant architectural idea. You are leveraging the unique strengths of each model:
- **OpenAI (GPT-4o):** Excellent at structured data extraction (JSON) and reasoning
- **Gemini (Pro/Flash with Search):** The only model with real-time, grounded Google Search capabilities

### The "Multi-Agent" Workflow:
1. **Extract (GPT-4o):** Get the address, price, and type
2. **Verify (Gemini + Search):** Send prompt to Gemini: "Search for current office rental rates in Ikoi, Lagos. Is $120,000/month for 10,000sqft high or low? Return JSON."
3. **Display:** Show result as "Market Intel (Powered by Google Search)"

### Why This Is Better Than Just GPT-4o:
- **Recency:** GPT-4o training data is old. Google Search is now.
- **Credibility:** Brokers trust "Google Search" more than "AI Hallucination."

### Feasibility:
- You have the Gemini API key
- The `google-generativeai` Python library is easy to use
- Latency: Adds ~2-3 seconds, but for "Market Intel" (which loads progressively), that is acceptable

### Revised Phase 3 Plan:
1. **Backend:** Install `google-generativeai`
2. **Backend:** Create function `get_market_intel_gemini(address, price, type)` that calls Gemini
3. Use Gemini 1.5 Flash with a prompt like "What is the current market rate for..." - faster and fresher than GPT

### Strategic Decision on CoStar/LoopNet:
- **Skip the Scraper** - too risky and slow, CoStar litigates heavily
- **Use "AI Estimates"** via Gemini
- **Label it clearly:** "AI Market Estimate" so brokers don't get mad at wrong data
- **Focus on Coach and History** - these are features we can build perfectly

### Final Command:
"Okay, let's do the Multi-Agent approach.
1. Use GPT-4o for the Structure/Drafts (what we have)
2. Use Gemini API for the Market Intel. Pass deal details to Gemini and ask it to evaluate the price
3. Proceed with Phase 3: Missing Fields, History, and Gemini-Powered Market Intel."

### User Confirmation (2026-01-19):
- `google_search_retrieval` tool is available in Gemini API
- Gemini Search is available on Tier 1
- Proceed with search-grounded market intelligence

---
