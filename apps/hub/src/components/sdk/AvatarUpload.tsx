'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, RotateCcw, Check, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui'
import {
  validateAvatarFile,
  cropAndResizeImage,
  createCustomAvatar,
  AVATAR_LIMITS,
  type CustomAvatar,
} from '@/lib/storage/tinycloud'

interface AvatarUploadProps {
  /** Called when avatar is cropped and ready */
  onUpload: (avatar: CustomAvatar) => Promise<void>
  /** Called when user cancels */
  onCancel: () => void
}

type UploadState = 'idle' | 'validating' | 'cropping' | 'processing' | 'error'

/**
 * Avatar upload component with image cropping
 */
export function AvatarUpload({ onUpload, onCancel }: AvatarUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget

    // Center a square crop
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // 1:1 aspect ratio
        width,
        height
      ),
      width,
      height
    )

    setCrop(crop)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setState('validating')

    // Validate file
    const validation = await validateAvatarFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setState('error')
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
    setState('cropping')
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Simulate file input change
    const input = inputRef.current
    if (input) {
      const dt = new DataTransfer()
      dt.items.add(file)
      input.files = dt.files
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleCropComplete = (crop: Crop) => {
    if (!imgRef.current || !crop.width || !crop.height) return

    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    setCompletedCrop({
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    })
  }

  const handleSave = async () => {
    if (!selectedFile || !completedCrop) return

    setState('processing')
    setError(null)

    try {
      // Crop and resize
      const croppedBlob = await cropAndResizeImage(
        selectedFile,
        completedCrop,
        AVATAR_LIMITS.outputSize
      )

      // Create custom avatar object
      const customAvatar = await createCustomAvatar(croppedBlob)

      // Call parent handler
      await onUpload(customAvatar)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
      setState('error')
    }
  }

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setCrop(undefined)
    setCompletedCrop(null)
    setError(null)
    setState('idle')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Idle state - show upload UI
  if (state === 'idle' || state === 'validating' || state === 'error') {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-serif text-ink">Upload Photo</h2>
          <p className="text-sm text-ink-muted">Choose a photo from your device</p>
        </div>

        {/* Drop zone */}
        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-4 p-8
            border-2 border-dashed rounded-2xl cursor-pointer
            transition-colors min-h-[200px]
            ${state === 'error' ? 'border-red-300 bg-red-50' : 'border-cream-300 bg-cream-50 hover:border-villa-400 hover:bg-cream-100'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_LIMITS.allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={state === 'validating'}
          />

          {state === 'validating' ? (
            <Loader2 className="w-12 h-12 text-villa-500 animate-spin" />
          ) : state === 'error' ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className="w-12 h-12 text-ink-muted" />
          )}

          <div className="text-center">
            <p className="font-medium text-ink">
              {state === 'validating'
                ? 'Checking image...'
                : state === 'error'
                  ? 'Try another image'
                  : 'Drop image here or tap to browse'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              JPEG, PNG, WebP, or GIF up to 5MB
            </p>
          </div>
        </motion.label>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel button */}
        <Button variant="secondary" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  // Cropping state
  if (state === 'cropping' && previewUrl) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-serif text-ink">Crop Your Photo</h2>
          <p className="text-sm text-ink-muted">Drag to adjust the crop area</p>
        </div>

        {/* Crop area */}
        <div className="relative bg-black rounded-xl overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={1}
            circularCrop
            className="max-h-[400px]"
          >
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Upload preview"
              onLoad={onImageLoad}
              className="max-w-full max-h-[400px] mx-auto"
            />
          </ReactCrop>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Choose Different
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!completedCrop}
          >
            <Check className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    )
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="w-12 h-12 text-villa-500 animate-spin" />
        <p className="text-ink-muted">Processing your photo...</p>
      </div>
    )
  }

  return null
}
