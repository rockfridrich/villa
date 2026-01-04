/**
 * Biometric types for face recovery
 */

/** Steps in the face recovery enrollment flow */
export type FaceRecoveryStep =
  | 'idle'
  | 'camera_requesting'
  | 'camera_denied'
  | 'scanning'
  | 'face_detected'
  | 'proving_liveness'
  | 'registering_key'
  | 'success'
  | 'error'

/** Liveness detection state */
export interface LivenessState {
  status: 'idle' | 'initializing' | 'proving' | 'complete' | 'error'
  progress: number
  message: string
}

/** ZK liveness proof result */
export interface LivenessProof {
  proof: Uint8Array
  publicInputs: string[]
  isValid: boolean
}

/** Face detection result from camera */
export interface FaceDetectionResult {
  detected: boolean
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/** Biometric enrollment result */
export interface BiometricEnrollmentResult {
  success: boolean
  faceKeyHash?: string
  txHash?: string
  error?: string
}
