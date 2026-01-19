import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for audio recording using MediaRecorder API
 * Handles MIME type detection, permissions, and cleanup
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('prompt') // 'prompt' | 'granted' | 'denied'

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // Check permission status on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((result) => {
          setPermissionStatus(result.state)
          result.onchange = () => setPermissionStatus(result.state)
        })
        .catch(() => {
          // Permission API not supported, will check on first recording attempt
        })
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  /**
   * Detect best supported MIME type for recording
   * WebM is preferred (Chrome/Firefox), falls back to MP4 for Safari
   */
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      ''  // empty string = browser default
    ]

    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ''
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)

    // Check for MediaRecorder support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError("Browser doesn't support recording.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      streamRef.current = stream
      setPermissionStatus('granted')

      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        setAudioBlob(blob)

        // Release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        setError('Recording error occurred.')
        setIsRecording(false)
      }

      // Start recording with 1 second timeslice for progressive chunks
      mediaRecorder.start(1000)
      setIsRecording(true)

    } catch (err) {
      console.error('Error accessing microphone:', err)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied')
        setError('Microphone access denied. Please enable in Settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found.')
      } else {
        setError(`Microphone error: ${err.message}`)
      }
    }
  }, [getSupportedMimeType])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    error,
    permissionStatus,
  }
}
