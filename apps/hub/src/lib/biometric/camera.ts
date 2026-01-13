/**
 * Camera processing for face detection
 *
 * Uses browser MediaDevices API for camera access.
 * Face detection is mocked for local development.
 */

import type { FaceDetectionResult } from './types'

/** Check if camera is supported in this browser */
export function isCameraSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export interface CameraProcessorOptions {
  /** Video element to stream camera to */
  videoElement: HTMLVideoElement
  /** Optional canvas for frame capture */
  canvasElement?: HTMLCanvasElement
  /** Callback when face detection state changes */
  onFaceDetected?: (result: FaceDetectionResult) => void
  /** Detection interval in ms (default: 200) */
  detectionInterval?: number
}

export class CameraProcessor {
  private options: CameraProcessorOptions
  private stream: MediaStream | null = null
  private detectionTimer: ReturnType<typeof setInterval> | null = null
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null

  constructor(options: CameraProcessorOptions) {
    this.options = {
      detectionInterval: 200,
      ...options,
    }

    // Use provided canvas or create one
    this.canvas = options.canvasElement || document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Start the camera stream */
  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      this.options.videoElement.srcObject = this.stream
      await this.options.videoElement.play()

      // Set canvas dimensions to match video
      this.canvas.width = 640
      this.canvas.height = 480

      // Start face detection loop
      this.startDetection()
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied by user')
      }
      throw error
    }
  }

  /** Stop the camera stream */
  stop(): void {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer)
      this.detectionTimer = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.options.videoElement.srcObject = null
  }

  /** Capture current frame as ImageData */
  captureFrame(): ImageData | null {
    if (!this.ctx || !this.stream) return null

    const video = this.options.videoElement
    this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height)
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  private startDetection(): void {
    if (this.detectionTimer) return

    this.detectionTimer = setInterval(() => {
      const frame = this.captureFrame()
      if (!frame) return

      // Mock face detection based on image brightness
      // Real implementation would use TensorFlow.js or similar
      const result = this.mockFaceDetection(frame)
      this.options.onFaceDetected?.(result)
    }, this.options.detectionInterval)
  }

  private mockFaceDetection(imageData: ImageData): FaceDetectionResult {
    // Simple mock: detect "face" based on center region brightness
    // This simulates a face being detected when something is in front of camera
    const { data, width, height } = imageData
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const sampleSize = 50

    let totalBrightness = 0
    let samples = 0

    for (let y = centerY - sampleSize; y < centerY + sampleSize; y += 5) {
      for (let x = centerX - sampleSize; x < centerX + sampleSize; x += 5) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const idx = (y * width + x) * 4
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          totalBrightness += brightness
          samples++
        }
      }
    }

    const avgBrightness = totalBrightness / samples
    // Simulated detection: if center is not too dark or too bright, "detect" face
    const detected = avgBrightness > 30 && avgBrightness < 220
    const confidence = detected ? 0.7 + Math.random() * 0.25 : 0.1 + Math.random() * 0.3

    return {
      detected,
      confidence,
      boundingBox: detected
        ? {
            x: centerX - 100,
            y: centerY - 130,
            width: 200,
            height: 260,
          }
        : undefined,
    }
  }
}
