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

**Last updated:** 2026-01-18
**Status:** Hour 0-4 of 72-hour demo sprint complete

### Completed
- Project scaffolding (Vite + React + Tailwind)
- FastAPI backend with placeholder endpoints
- Voice Commander UI with simulated flow
- Project outline documentation
- Gemini context tracking

### Next Steps (Hour 4-8)
1. Implement MediaRecorder API for real audio capture
2. Convert audio blob to optimized MP3 (16kbps/12kHz/mono)
3. Wire frontend to POST audio to `/api/transcribe`
4. Handle microphone permissions and error states

### Blocked
- None

### Key Files
- `frontend/src/App.jsx` - Main UI component
- `backend/main.py` - API server
- `VOICE_TO_DEAL_PROJECT_OUTLINE.md` - Full spec
- `gemini_context.md` - AI collaboration log

### Nia Context ID
`1fd301f0-0df9-4a65-b909-85713ff15819`
