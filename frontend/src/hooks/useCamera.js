import { useState, useRef, useCallback } from 'react'

/**
 * Hook for capturing photos from device camera
 * Uses file input with capture attribute for mobile compatibility
 */
export function useCamera() {
  const [capturedImage, setCapturedImage] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  /**
   * Convert file to base64 string (without data URL prefix)
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Compress image if it's too large (target < 1MB)
   */
  const compressImage = (file, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        let { width, height } = img
        const maxDimension = 1920

        // Scale down if too large
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Start with high quality, reduce if needed
        let quality = 0.8
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                quality -= 0.1
                tryCompress()
              } else {
                resolve(blob)
              }
            },
            'image/jpeg',
            quality
          )
        }
        tryCompress()
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Trigger the file input to capture a photo
   */
  const capturePhoto = useCallback(() => {
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  /**
   * Handle file selection from camera
   */
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Compress if needed
      let processedFile = file
      if (file.size > 1024 * 1024) {
        processedFile = await compressImage(file)
      }

      // Convert to base64
      const base64 = await fileToBase64(processedFile)

      // Create preview URL
      const previewUrl = URL.createObjectURL(processedFile)

      setCapturedImage({
        base64,
        previewUrl,
        originalSize: file.size,
        compressedSize: processedFile.size
      })

    } catch (err) {
      console.error('Failed to process image:', err)
      setError('Failed to process image')
    }

    // Reset input so same file can be selected again
    event.target.value = ''
  }, [])

  /**
   * Clear the captured image
   */
  const clearPhoto = useCallback(() => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl)
    }
    setCapturedImage(null)
    setError(null)
  }, [capturedImage])

  /**
   * Create the hidden file input element props
   */
  const fileInputProps = {
    ref: fileInputRef,
    type: 'file',
    accept: 'image/*',
    capture: 'environment', // Use rear camera on mobile
    onChange: handleFileChange,
    style: { display: 'none' }
  }

  return {
    capturedImage,
    capturePhoto,
    clearPhoto,
    error,
    fileInputProps
  }
}
