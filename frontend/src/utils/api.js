// Use relative URL so requests go through Vite proxy (fixes Safari CORS issues)
const API_URL = ''

/**
 * Send audio blob to backend for transcription
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<{transcript: string, duration_seconds: number, filename: string, status: string}>}
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData()

  // Determine file extension from MIME type
  let ext = 'webm'
  if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) {
    ext = 'm4a'
  } else if (audioBlob.type.includes('ogg')) {
    ext = 'ogg'
  }

  formData.append('file', audioBlob, `recording.${ext}`)

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  return response.json()
}

/**
 * Parse transcript text into structured deal data
 * @param {string} transcript - The transcribed text
 * @returns {Promise<{deal: object, status: string}>}
 */
export async function parseDeal(transcript) {
  const response = await fetch(`${API_URL}/api/parse?transcript=${encodeURIComponent(transcript)}`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  return response.json()
}

/**
 * Analyze an image (e.g., For Lease sign) to extract information
 * @param {string} base64Image - Base64 encoded image (without data URL prefix)
 * @param {string} transcript - Optional transcript for context
 * @returns {Promise<{extracted: object, status: string}>}
 */
export async function analyzeImage(base64Image, transcript = '') {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, transcript })
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  return response.json()
}

/**
 * Generate a business document (LOI, Follow-up Email) from deal data
 * @param {object} deal - The structured deal data
 * @param {string} draftType - Type of draft: "loi" | "follow_up_email" | "property_summary"
 * @returns {Promise<{draft: string, draft_type: string, status: string}>}
 */
export async function generateDraft(deal, draftType) {
  const response = await fetch(`${API_URL}/api/generate-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal, draft_type: draftType })
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get market intelligence for a deal using Gemini + Google Search
 * @param {object} dealData - The structured deal data
 * @returns {Promise<{comparison: string, percentage: number|null, market_range: string|null, explanation: string, sources: string[], status: string}>}
 */
export async function getMarketIntel(dealData) {
  const response = await fetch(`${API_URL}/api/market-intel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: dealData.property?.address,
      city: dealData.property?.city,
      unit_type: dealData.space?.unit_type,
      square_feet: dealData.space?.square_feet,
      asking_rent: dealData.financials?.asking_rent,
    })
  })

  if (!response.ok) {
    throw new Error(`Market intel request failed: ${response.status}`)
  }

  return response.json()
}
