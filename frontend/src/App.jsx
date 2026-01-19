import { useState, useEffect } from 'react'
import { Mic, Square, Save, Loader2, AlertTriangle, Camera, X, FileText, Mail, Copy, Check, History, ChevronDown, Trash2 } from 'lucide-react'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { useCamera } from './hooks/useCamera'
import { useDealHistory } from './hooks/useDealHistory'
import { transcribeAudio, parseDeal, analyzeImage, generateDraft, getMarketIntel } from './utils/api'

// Smart badge configuration for dynamic deal attributes
const SMART_BADGES = {
  urgency: { keywords: ['urgent', 'fast', 'quick', 'deadline', 'asap'], color: 'bg-red-500', icon: '⚡', label: 'Urgent' },
  competition: { keywords: ['competition', 'offers', 'multiple', 'hot', 'demand'], color: 'bg-orange-500', icon: '🔥', label: 'Hot Deal' },
  waterfront: { keywords: ['waterfront', 'water', 'ocean', 'lake', 'river', 'beach'], color: 'bg-blue-500', icon: '🌊', label: 'Waterfront' },
  motivated: { keywords: ['motivated', 'eager', 'flexible', 'negotiable'], color: 'bg-green-500', icon: '💰', label: 'Motivated Seller' },
  premium: { keywords: ['class a', 'premium', 'luxury', 'high-end', 'prime'], color: 'bg-purple-500', icon: '⭐', label: 'Premium' },
}

// Extract smart badges from highlights and summary
const getSmartBadges = (highlights, summary) => {
  const text = [...highlights.map(h => h.detail), summary || ''].join(' ').toLowerCase()
  return Object.entries(SMART_BADGES)
    .filter(([_, config]) => config.keywords.some(kw => text.includes(kw)))
    .map(([key, config]) => ({ key, ...config }))
}

// Missing field detection for critical deal info
const getMissingFields = (deal) => {
  const critical = [
    { field: deal?.space?.square_feet, label: 'Square Footage' },
    { field: deal?.financials?.asking_rent, label: 'Asking Rent' },
    { field: deal?.property?.address, label: 'Address' },
  ]
  return critical.filter(f => !f.field).map(f => f.label)
}

function App() {
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    error: recorderError,
    permissionStatus
  } = useAudioRecorder()

  const {
    capturedImage,
    capturePhoto,
    clearPhoto,
    error: cameraError,
    fileInputProps
  } = useCamera()

  const { deals, saveDeal, deleteDeal } = useDealHistory()
  const [historyOpen, setHistoryOpen] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(null) // 'transcribing' | 'analyzing_image' | 'extracting'
  const [transcript, setTranscript] = useState('')
  const [dealData, setDealData] = useState(null)
  const [error, setError] = useState(null)

  // Modal state for draft generation
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', text: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Market Intelligence state (The Oracle)
  const [marketIntel, setMarketIntel] = useState(null)
  const [loadingIntel, setLoadingIntel] = useState(false)

  // Process audio when a new blob is available
  useEffect(() => {
    if (audioBlob) {
      processAudio(audioBlob)
    }
  }, [audioBlob])

  // Sync recorder/camera errors to component error state
  useEffect(() => {
    if (recorderError) {
      setError(recorderError)
    }
  }, [recorderError])

  useEffect(() => {
    if (cameraError) {
      setError(cameraError)
    }
  }, [cameraError])

  // Fetch market intel when deal has rent and address (The Oracle)
  useEffect(() => {
    if (dealData?.financials?.asking_rent && dealData?.property?.address) {
      setLoadingIntel(true)
      setMarketIntel(null)
      getMarketIntel(dealData)
        .then(setMarketIntel)
        .catch((err) => {
          console.error('Market intel fetch failed:', err)
          setMarketIntel({ status: 'error', explanation: 'Could not fetch market data' })
        })
        .finally(() => setLoadingIntel(false))
    }
  }, [dealData?.financials?.asking_rent, dealData?.property?.address])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
      setIsProcessing(true)
    } else {
      setTranscript('')
      setDealData(null)
      setError(null)
      startRecording()
    }
  }

  /**
   * Format sign data as text context for the transcript
   */
  const formatVisualContext = (data) => {
    const parts = []
    if (data.phone_numbers?.length) parts.push(`Phone: ${data.phone_numbers.join(', ')}`)
    if (data.broker_name) parts.push(`Broker: ${data.broker_name}`)
    if (data.company_name) parts.push(`Company: ${data.company_name}`)
    if (data.address_from_sign) parts.push(`Address on sign: ${data.address_from_sign}`)
    if (data.building_type) parts.push(`Building type: ${data.building_type}`)
    if (data.additional_info) parts.push(`Additional: ${data.additional_info}`)
    return parts.join('. ')
  }

  const processAudio = async (blob) => {
    try {
      // Step 1: Transcribe
      setProcessingStage('transcribing')
      const transcribeData = await transcribeAudio(blob)
      setTranscript(transcribeData.transcript)

      let enrichedTranscript = transcribeData.transcript

      // Step 2: Analyze image if captured
      if (capturedImage?.base64) {
        setProcessingStage('analyzing_image')
        try {
          const signData = await analyzeImage(capturedImage.base64, transcribeData.transcript)

          // Merge: Append visual context to transcript
          if (signData.extracted) {
            const visualContext = formatVisualContext(signData.extracted)
            if (visualContext) {
              enrichedTranscript = `${transcribeData.transcript}\n\nVisual Context from photo: ${visualContext}`
            }
          }
        } catch (imgErr) {
          console.warn('Image analysis failed, continuing with voice only:', imgErr)
          // Don't fail the whole process, just skip image analysis
        }
      }

      // Step 3: Parse into deal structure
      if (transcribeData.status === 'success') {
        setProcessingStage('extracting')
        const parseData = await parseDeal(enrichedTranscript)
        setDealData(parseData.deal)
      }
    } catch (err) {
      console.error('Processing failed:', err)
      if (err.message.includes('Failed to fetch')) {
        setError('Network error. Is the backend running?')
      } else {
        setError(err.message || 'Failed to process audio.')
      }
    } finally {
      setIsProcessing(false)
      setProcessingStage(null)
    }
  }

  const handleSave = async () => {
    const entry = saveDeal(dealData, transcript)
    console.log('Deal saved to history:', entry)
    // In production, this would also POST to Renlo API
    setHistoryOpen(true) // Show history panel after save
  }

  const loadDealFromHistory = (entry) => {
    setDealData(entry.deal)
    setTranscript(entry.transcript)
    setHistoryOpen(false)
  }

  const handleGenerateDraft = async (draftType) => {
    setIsGenerating(true)
    setCopied(false)
    setError(null)
    try {
      const result = await generateDraft(dealData, draftType)
      setModalContent({
        title: draftType === 'loi' ? 'Letter of Intent' : 'Follow-up Email',
        text: result.draft
      })
      setModalOpen(true)
    } catch (err) {
      console.error('Draft generation failed:', err)
      setError(err.message || 'Failed to generate draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(modalContent.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers without clipboard API
      console.error('Clipboard write failed:', err)
      alert('Could not copy automatically. Please select the text and copy manually.')
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setCopied(false)
  }

  // Calculate confidence score from deal data
  const getConfidenceScore = () => {
    if (!dealData) return 0
    const fields = [
      dealData.property?.address,
      dealData.space?.square_feet,
      dealData.space?.unit_type,
      dealData.financials?.asking_rent,
      dealData.deal_context?.owner_sentiment
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
        {/* Renlo Branding */}
        <div className="flex flex-col items-center mb-6">
          <img src="/renlo-logo.png" alt="Renlo" className="w-12 h-12" />
          <h1 className="font-serif-brand text-3xl text-black mt-3 tracking-tight">
            Voice to Deal
          </h1>
          <p className="text-[#6b6b6b] text-sm mt-1">
            Speak it. Capture it. Close it.
          </p>
        </div>

        {/* Permission Denied Warning */}
        {permissionStatus === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            <span className="text-sm">Microphone blocked. Enable in browser settings.</span>
          </div>
        )}

        {/* Image Thumbnail */}
        {capturedImage && (
          <div className="mb-4 relative inline-block">
            <img
              src={capturedImage.previewUrl}
              alt="Captured"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Deal Card Display Area */}
        <div className="bg-[#fafaf8] min-h-64 rounded-xl border border-gray-200 flex flex-col items-center justify-center mb-6 p-5">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-black" />
              <p className="text-[#6b6b6b]">
                {processingStage === 'transcribing' && 'Transcribing...'}
                {processingStage === 'analyzing_image' && 'Analyzing photo...'}
                {processingStage === 'extracting' && 'Extracting deal...'}
                {!processingStage && 'Processing...'}
              </p>
            </div>
          ) : dealData ? (
            <div className="w-full text-left space-y-4">
              {/* HERO: Dynamic Headline */}
              {dealData.headline && (
                <h2 className="text-xl font-bold text-black leading-tight">
                  {dealData.headline}
                </h2>
              )}

              {/* SMART BADGES */}
              {getSmartBadges(dealData.highlights || [], dealData.summary).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getSmartBadges(dealData.highlights || [], dealData.summary).map(badge => (
                    <span key={badge.key} className={`${badge.color} text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* MISSING FIELD ALERT (The Coach) */}
              {getMissingFields(dealData).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Missing: {getMissingFields(dealData).join(', ')}</span>
                </div>
              )}

              {/* MARKET INTEL BADGE (The Oracle) */}
              {loadingIntel && (
                <div className="flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Checking market...
                  </span>
                </div>
              )}
              {marketIntel && marketIntel.status === 'success' && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                      marketIntel.comparison === 'below_market' ? 'bg-green-100 text-green-700' :
                      marketIntel.comparison === 'above_market' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {marketIntel.comparison === 'below_market' && '📉'}
                      {marketIntel.comparison === 'above_market' && '📈'}
                      {marketIntel.comparison === 'at_market' && '📊'}
                      {marketIntel.percentage ? `${marketIntel.percentage}% ` : ''}
                      {marketIntel.comparison.replace(/_/g, ' ')}
                    </span>
                    {marketIntel.market_range && (
                      <span className="text-xs text-gray-500">
                        Market: {marketIntel.market_range}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{marketIntel.explanation}</p>
                </div>
              )}

              {/* NARRATIVE SUMMARY */}
              {dealData.summary && (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {dealData.summary}
                </p>
              )}

              {/* TRANSCRIPT (collapsed) */}
              <details className="text-xs">
                <summary className="text-[#6b6b6b] cursor-pointer">View transcript</summary>
                <p className="text-gray-500 italic mt-1">"{transcript}"</p>
              </details>

              {/* STRUCTURED DATA - Compact Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                {dealData.property?.address && (
                  <div>
                    <div className="text-[10px] text-[#6b6b6b] uppercase">Address</div>
                    <div className="font-medium text-sm">{dealData.property.address}</div>
                  </div>
                )}
                {dealData.space?.square_feet && (
                  <div>
                    <div className="text-[10px] text-[#6b6b6b] uppercase">Size</div>
                    <div className="font-medium text-sm">{dealData.space.square_feet.toLocaleString()} SF</div>
                  </div>
                )}
                {dealData.space?.unit_type && (
                  <div>
                    <div className="text-[10px] text-[#6b6b6b] uppercase">Type</div>
                    <div className="font-medium text-sm capitalize">{dealData.space.unit_type}</div>
                  </div>
                )}
                {dealData.financials?.asking_rent && (
                  <div>
                    <div className="text-[10px] text-[#6b6b6b] uppercase">Rent</div>
                    <div className="font-medium text-sm">${dealData.financials.asking_rent.toLocaleString()}/mo</div>
                  </div>
                )}
                {dealData.contact?.phone && (
                  <div>
                    <div className="text-[10px] text-[#6b6b6b] uppercase">Contact</div>
                    <a href={`tel:${dealData.contact.phone}`} className="font-medium text-sm text-blue-600">{dealData.contact.phone}</a>
                  </div>
                )}
              </div>

              {/* KEY HIGHLIGHTS - Only if there are extras beyond badges */}
              {dealData.highlights?.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-2">Details</div>
                  <div className="space-y-1">
                    {dealData.highlights.map((h, i) => (
                      <div key={i} className="text-sm text-gray-600">
                        • {h.detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : transcript ? (
            <p className="text-gray-700">{transcript}</p>
          ) : (
            <div className="text-center">
              <p className="text-[#6b6b6b]">Tap microphone to start a deal...</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Draft Generation */}
        {dealData && (
          <div className="mb-6">
            <div className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-3 text-center">
              Quick Actions
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleGenerateDraft('loi')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                Draft LOI
              </button>
              <button
                onClick={() => handleGenerateDraft('follow_up_email')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Follow-up
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {/* Hidden file input for camera */}
          <input {...fileInputProps} />

          {/* Camera Button */}
          <button
            onClick={capturePhoto}
            disabled={isProcessing || isRecording}
            className={`p-6 rounded-full transition-all disabled:opacity-50 shadow-md ${
              capturedImage
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Take photo of sign"
          >
            <Camera size={32} color="white" />
          </button>

          {/* Mic Button */}
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`p-6 rounded-full transition-all disabled:opacity-50 shadow-md ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-black hover:bg-gray-800'
            }`}
          >
            {isRecording ? (
              <Square size={32} color="white" />
            ) : (
              <Mic size={32} color="white" />
            )}
          </button>

          {dealData && (
            <button
              onClick={handleSave}
              className="p-6 rounded-full bg-black hover:bg-gray-800 transition-all shadow-md"
            >
              <Save size={32} color="white" />
            </button>
          )}
        </div>

        <p className="text-center text-[#6b6b6b] mt-4 text-sm">
          {isProcessing
            ? processingStage === 'transcribing' ? 'Transcribing audio...'
              : processingStage === 'analyzing_image' ? 'Reading sign...'
              : processingStage === 'extracting' ? 'Building deal...'
              : 'Analyzing...'
            : isRecording
              ? 'Listening... tap to stop'
              : capturedImage
                ? 'Photo ready. Tap mic to add voice notes.'
                : 'Snap a sign, then speak your notes'}
        </p>

        {/* RECENT DEALS (Local Memory) */}
        {deals.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between text-sm text-[#6b6b6b] hover:text-black transition-colors"
            >
              <span className="flex items-center gap-2">
                <History size={16} />
                Recent Deals ({deals.length})
              </span>
              <ChevronDown
                size={16}
                className={`transform transition-transform ${historyOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {historyOpen && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {deals.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between bg-[#fafaf8] p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors group"
                  >
                    <button
                      onClick={() => loadDealFromHistory(entry)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm truncate">
                        {entry.deal.headline || entry.deal.property?.address || 'Untitled Deal'}
                      </div>
                      <div className="text-xs text-[#6b6b6b]">
                        {new Date(entry.savedAt).toLocaleDateString()} at {new Date(entry.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDeal(entry.id) }}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Delete deal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Draft Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-serif-brand text-xl text-black">{modalContent.title}</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {modalContent.text}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleCopyToClipboard}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Badge */}
      <p className="text-[#6b6b6b] text-xs mt-6 tracking-wide">
        Renlo Field Commander v0.4
      </p>
    </div>
  )
}

export default App
