import { useState } from 'react'
import { Mic, Square, Save, Loader2 } from 'lucide-react'

const API_URL = 'http://localhost:8000'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [dealData, setDealData] = useState(null)
  const [error, setError] = useState(null)

  const toggleRecording = async () => {
    setError(null)

    if (!isRecording) {
      // Start recording
      setIsRecording(true)
      setTranscript('')
      setDealData(null)
      console.log('Started recording...')
      // MediaRecorder logic will go here (Hour 4-8)
    } else {
      // Stop recording and process
      setIsRecording(false)
      setIsProcessing(true)
      console.log('Stopped recording, processing...')

      // Simulate backend response for now
      // This will be replaced with actual API call
      setTimeout(() => {
        setTranscript('450 Main Street, 5,000 sq ft warehouse, asking $28 NNN, owner seems motivated')
        setDealData({
          property: {
            address: '450 Main Street',
          },
          space: {
            square_feet: 5000,
            unit_type: 'warehouse'
          },
          financials: {
            asking_rent: 28.00,
            rent_type: 'nnn',
          },
          deal_context: {
            owner_sentiment: 'motivated'
          }
        })
        setIsProcessing(false)
      }, 1500)
    }
  }

  const handleSave = async () => {
    console.log('Saving deal:', dealData)
    // Will POST to Renlo API
    alert('Deal saved! (Demo)')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Field Commander
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Voice-to-Deal for Renlo
        </p>

        {/* Deal Card Display Area */}
        <div className="bg-gray-50 min-h-64 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-6 p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-gray-500">Processing...</p>
            </div>
          ) : dealData ? (
            <div className="w-full text-left space-y-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Transcript</div>
              <p className="text-gray-600 text-sm italic mb-4">"{transcript}"</p>

              <div className="text-xs text-gray-400 uppercase tracking-wide">Extracted Deal</div>
              <div className="space-y-2">
                {dealData.property?.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="font-medium">{dealData.property.address}</span>
                  </div>
                )}
                {dealData.space?.square_feet && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size</span>
                    <span className="font-medium">{dealData.space.square_feet.toLocaleString()} SF</span>
                  </div>
                )}
                {dealData.space?.unit_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium capitalize">{dealData.space.unit_type}</span>
                  </div>
                )}
                {dealData.financials?.asking_rent && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Asking Rent</span>
                    <span className="font-medium">
                      ${dealData.financials.asking_rent}/SF {dealData.financials.rent_type?.toUpperCase()}
                    </span>
                  </div>
                )}
                {dealData.deal_context?.owner_sentiment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Owner</span>
                    <span className="font-medium capitalize text-green-600">
                      {dealData.deal_context.owner_sentiment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : transcript ? (
            <p className="text-gray-700">{transcript}</p>
          ) : (
            <p className="text-gray-400">Tap microphone to start a deal...</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`p-6 rounded-full transition-all disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
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
              className="p-6 rounded-full bg-green-600 hover:bg-green-700 transition-all"
            >
              <Save size={32} color="white" />
            </button>
          )}
        </div>

        <p className="text-center text-gray-500 mt-4 text-sm">
          {isProcessing
            ? 'Analyzing...'
            : isRecording
              ? 'Listening... tap to stop'
              : 'Tap to record'}
        </p>
      </div>

      {/* Version Badge */}
      <p className="text-gray-400 text-xs mt-4">
        Voice Commander v0.1 | 72-Hour Demo
      </p>
    </div>
  )
}

export default App
