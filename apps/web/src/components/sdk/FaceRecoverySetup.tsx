'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, Check, AlertCircle, RefreshCw, Shield, X } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import {
  type FaceRecoveryStep,
  type LivenessState,
  LivenessProvider,
  CameraProcessor,
  isCameraSupported,
  proofToHex,
  generateFaceKeyHash,
} from '@/lib/biometric'
import {
  enrollFace,
  waitForTransaction,
  isAnvilRunning,
  ANVIL_ACCOUNTS,
} from '@/lib/contracts'

interface FaceRecoverySetupProps {
  /** User's wallet address for enrollment */
  address: string
  /** Callback when enrollment completes successfully */
  onComplete?: (result: {
    faceKeyHash: string
    proofHex: string
    txHash: string
  }) => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Callback for errors */
  onError?: (error: string) => void
}

interface ErrorState {
  message: string
  retry?: () => void
}

export function FaceRecoverySetup({
  address,
  onComplete,
  onCancel,
  onError,
}: FaceRecoverySetupProps) {
  const [step, setStep] = useState<FaceRecoveryStep>('idle')
  const [error, setError] = useState<ErrorState | null>(null)
  const [livenessState, setLivenessState] = useState<LivenessState>({
    status: 'idle',
    progress: 0,
    message: '',
  })
  const [faceDetected, setFaceDetected] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [anvilConnected, setAnvilConnected] = useState<boolean | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<CameraProcessor | null>(null)
  const livenessRef = useRef<LivenessProvider | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cameraRef.current?.stop()
    }
  }, [])

  // Check Anvil connection on mount
  useEffect(() => {
    isAnvilRunning().then((connected) => {
      if (isMountedRef.current) {
        setAnvilConnected(connected)
      }
    })
  }, [])

  // Initialize liveness provider
  useEffect(() => {
    livenessRef.current = new LivenessProvider({
      useMock: true, // Use mock for local development
      onStateChange: (state) => {
        if (isMountedRef.current) {
          setLivenessState(state)
        }
      },
    })

    livenessRef.current.initialize().catch((err) => {
      console.error('Failed to initialize liveness:', err)
    })
  }, [])

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return

    setStep('camera_requesting')

    try {
      cameraRef.current = new CameraProcessor({
        videoElement: videoRef.current,
        canvasElement: canvasRef.current || undefined,
        onFaceDetected: (result) => {
          if (isMountedRef.current) {
            setFaceDetected(result.detected && result.confidence > 0.7)
          }
        },
      })

      await cameraRef.current.start()
      setStep('scanning')
    } catch (err) {
      const message = (err as Error).message
      if (message.includes('denied')) {
        setStep('camera_denied')
        setError({
          message: 'Camera access denied. Please enable camera in your browser settings.',
          retry: startCamera,
        })
      } else {
        setStep('error')
        setError({
          message: message || 'Failed to access camera',
          retry: startCamera,
        })
      }
      onError?.(message)
    }
  }, [onError])

  const captureAndProve = useCallback(async () => {
    if (!cameraRef.current || !livenessRef.current) {
      setError({ message: 'Camera or liveness not initialized' })
      setStep('error')
      return
    }

    setStep('proving_liveness')

    try {
      // Capture frame
      const imageData = cameraRef.current.captureFrame()
      if (!imageData) {
        throw new Error('Failed to capture frame')
      }

      // Generate liveness proof
      const proof = await livenessRef.current.generateProof(imageData)

      if (!proof.isValid) {
        throw new Error('Liveness verification failed')
      }

      // Generate face key hash from address (mock implementation)
      const faceKeyHash = generateFaceKeyHash(address)
      const proofHex = proofToHex(proof.proof)

      // Stop camera
      cameraRef.current.stop()

      // Now register on-chain
      setStep('registering_key')

      // Check if Anvil is running
      const connected = await isAnvilRunning()
      if (!connected) {
        throw new Error('Local blockchain not running. Start Anvil with: npm run anvil')
      }

      // Call enrollFace contract
      // For local testing, use Anvil's test account as the sender
      // In production, this would use the user's Porto account
      const hash = await enrollFace({
        account: ANVIL_ACCOUNTS.user1.address,
        faceKeyHash: faceKeyHash as `0x${string}`,
        livenessProof: proofHex,
        privateKey: ANVIL_ACCOUNTS.user1.privateKey,
      })

      setTxHash(hash)

      // Wait for confirmation
      await waitForTransaction(hash)

      setStep('success')

      // Notify completion with all data
      onComplete?.({ faceKeyHash, proofHex, txHash: hash })
    } catch (err) {
      const message = (err as Error).message
      setStep('error')

      // Provide helpful error messages
      let displayMessage = message
      if (message.includes('not running')) {
        displayMessage = 'Local blockchain not running. Run "npm run anvil" in a terminal.'
      } else if (message.includes('revert')) {
        displayMessage = 'Transaction reverted. The contract may have rejected the enrollment.'
      } else if (message.includes('insufficient funds')) {
        displayMessage = 'Test account has insufficient funds.'
      }

      setError({
        message: displayMessage,
        retry: () => {
          setError(null)
          setTxHash(null)
          setStep('scanning')
          livenessRef.current?.reset()
          // Restart camera
          if (videoRef.current && cameraRef.current) {
            cameraRef.current.start().catch(console.error)
          }
        },
      })
      onError?.(message)
    }
  }, [address, onComplete, onError])

  const handleCancel = useCallback(() => {
    cameraRef.current?.stop()
    onCancel?.()
  }, [onCancel])

  // Check camera support
  if (!isCameraSupported()) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-ink mb-2">Camera Not Supported</h3>
        <p className="text-ink-muted text-sm">
          Your browser does not support camera access. Please use a modern browser.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <h2 className="text-lg font-semibold text-ink">Face Recovery Setup</h2>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-ink-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Idle - Start Setup */}
        {step === 'idle' && (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-accent-brown" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Add Face Recovery</h3>
            <p className="text-ink-muted text-sm mb-6">
              Use your face to recover your Villa ID if you lose access to your device. Your face
              data never leaves your device.
            </p>

            {/* Anvil warning */}
            {anvilConnected === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Run{' '}
                  <code className="bg-amber-100 px-1 rounded">npm run anvil</code> first.
                </p>
              </div>
            )}

            <Button
              onClick={startCamera}
              size="lg"
              className="w-full"
              disabled={anvilConnected === false}
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          </div>
        )}

        {/* Camera Requesting */}
        {step === 'camera_requesting' && (
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-ink-muted">Requesting camera access...</p>
          </div>
        )}

        {/* Camera Denied */}
        {step === 'camera_denied' && error && (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Camera Access Denied</h3>
            <p className="text-ink-muted text-sm mb-6">{error.message}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={error.retry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Scanning - Camera Active */}
        {(step === 'scanning' || step === 'face_detected') && (
          <div className="w-full max-w-sm">
            {/* Camera Preview */}
            <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" width={640} height={480} />

              {/* Face Detection Overlay */}
              {faceDetected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-accent-green rounded-[40%] animate-pulse" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    faceDetected ? 'bg-accent-green text-white' : 'bg-cream-100 text-ink-muted'
                  }`}
                >
                  {faceDetected ? 'Face detected' : 'Position your face'}
                </div>
              </div>
            </div>

            {/* Capture Button */}
            <Button
              onClick={captureAndProve}
              size="lg"
              className="w-full"
              disabled={!faceDetected}
            >
              {faceDetected ? 'Capture & Verify' : 'Looking for face...'}
            </Button>
          </div>
        )}

        {/* Proving Liveness */}
        {step === 'proving_liveness' && (
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <Spinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">Verifying Liveness</h3>
              <p className="text-ink-muted text-sm">{livenessState.message || 'Processing...'}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-cream-200 rounded-full h-2">
              <div
                className="bg-accent-yellow h-2 rounded-full transition-all duration-300"
                style={{ width: `${livenessState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Registering Key On-Chain */}
        {step === 'registering_key' && (
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <Spinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">Registering On-Chain</h3>
              <p className="text-ink-muted text-sm">
                {txHash ? 'Waiting for confirmation...' : 'Submitting transaction...'}
              </p>
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <div className="bg-cream-100 rounded-lg p-3 text-left">
                <p className="text-xs text-ink-muted mb-1">Transaction Hash</p>
                <p className="text-xs font-mono text-ink break-all">{txHash}</p>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-accent-green" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Face Recovery Enabled</h3>
            <p className="text-ink-muted text-sm mb-4">
              Your face backup is now registered on-chain. You can recover your Villa ID using your
              face if you lose access to your device.
            </p>

            {/* Transaction confirmation */}
            {txHash && (
              <div className="bg-cream-100 rounded-lg p-3 text-left">
                <p className="text-xs text-ink-muted mb-1">Confirmed Transaction</p>
                <p className="text-xs font-mono text-ink break-all">{txHash}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {step === 'error' && error && (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Something went wrong</h3>
            <p className="text-ink-muted text-sm mb-6">{error.message}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              {error.retry && (
                <Button onClick={error.retry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
