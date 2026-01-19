# Renlo Voice-to-Deal Project

## Project Overview

Building a "Voice-to-Deal" PWA demo for Renlo, a commercial real estate CRM platform. Brokers speak deal details, system transcribes and extracts structured data.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI:** OpenAI Whisper (transcription) + GPT-4o (structured extraction)
- **Deployment:** Netlify (FE) + Google Cloud Run (BE)

## Quick Start

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

Open http://localhost:5173

## Session Handoff Notes

**Last updated:** 2026-01-19
**Status:** Phase 3 (The Oracle) complete - v0.4

### Completed
- Project scaffolding (Vite + React + Tailwind)
- FastAPI backend with real Whisper transcription + GPT-4o extraction
- Voice Commander UI with camera capture + voice recording
- Smart badges, headlines, and narrative summaries
- Draft generation (LOI, Follow-up emails)
- **Phase 3: The Oracle (this session):**
  - Missing Field Detection ("The Coach") - alerts on missing sqft/rent/address
  - Deal History ("Local Memory") - localStorage with useDealHistory hook
  - Gemini Market Intel ("The Oracle") - /api/market-intel with Google Search grounding

### Next Steps
1. Add GEMINI_API_KEY to backend/.env for market intel to work
2. Consider migrating from `google-generativeai` to `google.genai` (deprecation warning)
3. Deploy to Netlify (FE) + Cloud Run (BE)
4. Test full end-to-end flow with real voice recordings

### Blocked
- None

### Key Files
- `frontend/src/App.jsx` - Main UI component (v0.4)
- `frontend/src/hooks/useDealHistory.js` - localStorage persistence
- `frontend/src/utils/api.js` - API client functions
- `backend/main.py` - API server with Whisper, GPT-4o, Gemini
- `backend/requirements.txt` - Python dependencies
- `gemini_context.md` - AI collaboration log

### Environment Variables Needed
```
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```
