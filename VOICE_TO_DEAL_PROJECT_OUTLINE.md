# Voice-to-Deal: Field Commander PWA
## 72-Hour Demo Project Outline for Renlo

---

## Executive Summary

**The Pitch:** "Brokers spend half their day in cars, but CRM data entry requires a keyboard. I'll build a 'Voice Button' PWA where a broker taps, speaks, and a new Deal record appears instantly—zero typing."

**The Demo Moment:** Broker says *"Just toured the Smith Building on 450 Main Street, 5,000 square feet, asking $32 gross, NNN lease, owner seems motivated"* → System displays structured deal card with all fields populated → One tap to save.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React PWA)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Voice Button │→│ Audio Blob  │→│ Review/Edit Card    │  │
│  │ (hold-to-talk)│  │ (MP3/WebM) │  │ (parsed JSON)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI / Node.js)                  │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ /api/transcribe  │    │ /api/parse                   │   │
│  │                  │    │                              │   │
│  │ Audio → Whisper  │ →  │ Transcript → GPT-4 → JSON    │   │
│  │ API → Text       │    │ (Structured Output Mode)     │   │
│  └──────────────────┘    └──────────────────────────────┘   │
│                                                              │
│                              │                               │
│                              ▼                               │
│                    ┌─────────────────┐                      │
│                    │ Renlo API       │                      │
│                    │ POST /deals     │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Vite | Fast dev cycle, easy PWA setup |
| **PWA** | Workbox | Offline capability, installable |
| **Audio Recording** | MediaRecorder API | Native browser support, no dependencies |
| **Audio Format** | MP3 @ 16kbps / 12kHz / Mono | Optimal for Whisper: 50%+ latency reduction vs high-quality audio |
| **Backend** | FastAPI (Python) | Quick to build, great async support, Python ecosystem for AI |
| **Transcription** | OpenAI Whisper API | Best accuracy, handles accents, CRE terminology |
| **Parsing** | GPT-4o + Structured Outputs | Reliable JSON schema enforcement |
| **Hosting** | Netlify (FE) + Cloud Run (BE) | Per user's deployment preferences |

---

## CRE Deal Schema (JSON Output Target)

```json
{
  "property": {
    "name": "Smith Building",
    "address": "450 Main Street",
    "city": null,
    "state": null
  },
  "space": {
    "square_feet": 5000,
    "unit_type": "office" | "retail" | "industrial" | "flex" | null
  },
  "financials": {
    "asking_rent": 32.00,
    "rent_type": "gross" | "nnn" | "modified_gross" | null,
    "rent_period": "per_sf_year" | "per_sf_month" | "total_month"
  },
  "deal_context": {
    "owner_sentiment": "motivated" | "neutral" | "firm" | null,
    "notes": "Owner seems motivated",
    "tour_date": "2026-01-18"
  },
  "confidence": {
    "overall": 0.85,
    "fields_needing_review": ["city", "state"]
  }
}
```

---

## Implementation Timeline (72 Hours)

### Day 1: The Voice Capture (Hours 0-24)

**Goal:** Working audio recording → transcription pipeline

| Hour | Task |
|------|------|
| 0-4 | Project scaffolding: Vite + React + PWA manifest, FastAPI backend skeleton |
| 4-8 | MediaRecorder component: hold-to-talk button, audio blob capture |
| 8-12 | Audio optimization: convert to MP3 @ 16kbps/12kHz using Web Audio API or ffmpeg.wasm |
| 12-16 | Backend `/api/transcribe`: receive audio, call Whisper API, return text |
| 16-20 | Integration: Frontend sends audio → Backend returns transcript → Display raw text |
| 20-24 | Error handling: microphone permissions, network failures, Whisper errors |

**Day 1 Deliverable:** Tap button → speak → see transcript on screen

---

### Day 2: The Intelligence Layer (Hours 24-48)

**Goal:** Transcript → Structured CRE deal data

| Hour | Task |
|------|------|
| 24-28 | GPT-4 prompt engineering: CRE-specific extraction prompt with examples |
| 28-32 | Implement Structured Outputs mode with JSON schema enforcement |
| 32-36 | Backend `/api/parse`: transcript → GPT-4 → validated JSON |
| 36-40 | Post-processing: normalize rent formats ($/SF vs total), parse addresses |
| 40-44 | Confidence scoring: flag low-confidence fields for user review |
| 44-48 | Integration: full pipeline audio → transcript → JSON → display card |

**Day 2 Deliverable:** Speak → see fully structured deal card with editable fields

**Key Prompt Engineering (CRE-Specific):**
```
You are a commercial real estate data extraction assistant.
Parse the following broker voice note into structured deal data.

CRE terminology guide:
- "NNN" or "triple net" = tenant pays taxes, insurance, maintenance
- "Gross" = landlord pays operating expenses
- "Modified gross" = hybrid structure
- Rent is typically quoted per square foot per year unless stated otherwise
- "Motivated" seller/owner = willing to negotiate

Extract ONLY what is explicitly stated. Mark missing fields as null.
For ambiguous values, include confidence score.
```

---

### Day 3: The Experience Polish (Hours 48-72)

**Goal:** Demo-ready PWA with delightful UX

| Hour | Task |
|------|------|
| 48-52 | UI polish: Renlo-style design system (if available), mobile-first layout |
| 52-56 | Review/Edit flow: inline editing of parsed fields, validation |
| 56-60 | "Save to Renlo" button: POST to Renlo API (or mock endpoint for demo) |
| 60-64 | PWA features: install prompt, offline indicator, app icon |
| 64-68 | Demo scenarios: record 5-10 test phrases, verify accuracy |
| 68-72 | Deploy: Netlify (frontend) + Cloud Run (backend), final testing |

**Day 3 Deliverable:** Installable PWA demo ready for Zoom presentation

---

## Key Features

### Must-Have (MVP)
- [x] Hold-to-talk voice recording
- [x] Real-time transcription display
- [x] Structured deal card output
- [x] Inline field editing before save
- [x] Mobile-responsive design
- [x] PWA installable

### Nice-to-Have (If Time Permits)
- [ ] Voice activity detection (auto-stop on silence)
- [ ] Multiple recordings in a session
- [ ] History of recent voice notes
- [ ] Offline recording with sync-when-online

### Out of Scope (Future)
- Full Renlo authentication
- Deep Renlo database integration
- Multi-language support

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Whisper accuracy on CRE jargon** | Post-processing step to correct common terms (NNN, CAM, etc.) |
| **Mobile browser audio issues** | Test early on iOS Safari + Chrome Android; have fallback formats |
| **Latency feels slow** | Show transcript streaming, optimistic UI updates |
| **GPT-4 returns invalid JSON** | Use Structured Outputs mode (schema enforcement), fallback to retry |
| **User speaks too long** | Segment audio into chunks, process in parallel |

---

## Demo Script (For Zoom Presentation)

1. **Open PWA on phone** (show it's installable, works like native app)

2. **Scenario 1 - Quick property note:**
   > "450 Main Street, 5,000 square feet, $32 gross"

   → Show instant structured card

3. **Scenario 2 - Complex deal context:**
   > "Just toured the Smith Building with John from Cushman. They're asking $28 NNN but the owner mentioned he's motivated to close by Q2. Space is 12,000 square feet, second floor, good natural light."

   → Show all fields extracted including sentiment and notes

4. **Edit a field** (show it's not a black box)

5. **Tap "Save to Renlo"** → Show success

6. **Closing line:** "Your brokers can now update their CRM from the driver's seat. Zero typing. This is why they'll choose Renlo over Excel."

---

## Cost Estimate (Per 1,000 Voice Notes)

| Service | Cost |
|---------|------|
| Whisper API | ~$0.36 (avg 30 sec audio × 1000 × $0.006/min) |
| GPT-4o | ~$1.50 (avg 500 tokens × 1000 × $0.003/1K) |
| Cloud Run | ~$2.00 (minimal compute) |
| **Total** | **~$4/1000 notes** |

Extremely cost-effective for the value delivered.

---

## Success Criteria

The demo is successful if:

1. **Speed:** Voice note → structured card in under 5 seconds
2. **Accuracy:** 90%+ of explicitly stated fields extracted correctly
3. **Delight:** Viewer says "wow" or "that's cool" during demo
4. **Credibility:** Technical founder sees clean architecture, not a hack

---

## Next Steps

1. **Get Renlo's Deal schema** (if different from proposed)
2. **Confirm API access** (or build against mock endpoint)
3. **Start Day 1 sprint**

---

*Document prepared: 2026-01-18*
*Target delivery: 72 hours from kickoff*
