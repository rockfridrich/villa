'use client'

/**
 * TinyCloud storage utilities for Villa
 * Handles decentralized storage of user avatars and profile data
 */

// Avatar storage constants
export const AVATAR_LIMITS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB raw input
  maxDimension: 2048, // Max source dimension
  outputSize: 512, // Saved at 512x512
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
} as const

export type AllowedImageType = (typeof AVATAR_LIMITS.allowedTypes)[number]

/** Custom avatar stored in TinyCloud */
export interface CustomAvatar {
  type: 'custom'
  /** Base64 data URL or TinyCloud reference */
  dataUrl: string
  /** SHA-256 hash for integrity */
  hash: string
  /** Upload timestamp */
  uploadedAt: number
}

/** Avatar validation result */
export interface AvatarValidationResult {
  valid: boolean
  error?: string
  dimensions?: { width: number; height: number }
}

/**
 * Validate an image file for avatar upload
 */
export async function validateAvatarFile(file: File): Promise<AvatarValidationResult> {
  // Check file size
  if (file.size > AVATAR_LIMITS.maxSizeBytes) {
    return {
      valid: false,
      error: `Image too large (max ${AVATAR_LIMITS.maxSizeBytes / 1024 / 1024}MB)`,
    }
  }

  // Check file type
  if (!AVATAR_LIMITS.allowedTypes.includes(file.type as AllowedImageType)) {
    return {
      valid: false,
      error: 'Unsupported image format. Use JPEG, PNG, WebP, or GIF.',
    }
  }

  // Check dimensions
  try {
    const dimensions = await getImageDimensions(file)
    if (dimensions.width > AVATAR_LIMITS.maxDimension || dimensions.height > AVATAR_LIMITS.maxDimension) {
      return {
        valid: false,
        error: `Image too large (max ${AVATAR_LIMITS.maxDimension}x${AVATAR_LIMITS.maxDimension}px)`,
        dimensions,
      }
    }
    return { valid: true, dimensions }
  } catch {
    return { valid: false, error: 'Could not read image dimensions' }
  }
}

/**
 * Get image dimensions from a File
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Crop and resize image to square
 */
export async function cropAndResizeImage(
  file: File,
  crop: { x: number; y: number; width: number; height: number },
  outputSize: number = AVATAR_LIMITS.outputSize
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw cropped region scaled to output size
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputSize,
        outputSize
      )

      // Convert to WebP for smaller size (fallback to PNG)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) {
            resolve(blob)
          } else {
            // Fallback to PNG
            canvas.toBlob(
              (pngBlob) => {
                if (pngBlob) {
                  resolve(pngBlob)
                } else {
                  reject(new Error('Failed to create image blob'))
                }
              },
              'image/png',
              0.9
            )
          }
        },
        'image/webp',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image for cropping'))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Convert blob to base64 data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Calculate SHA-256 hash of data
 */
export async function hashData(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a CustomAvatar from a cropped image blob
 */
export async function createCustomAvatar(blob: Blob): Promise<CustomAvatar> {
  const [dataUrl, arrayBuffer] = await Promise.all([
    blobToDataUrl(blob),
    blob.arrayBuffer(),
  ])

  const hash = await hashData(arrayBuffer)

  return {
    type: 'custom',
    dataUrl,
    hash,
    uploadedAt: Date.now(),
  }
}

/**
 * TinyCloud-backed avatar storage with localStorage fallback
 * Provides cross-device sync when TinyCloud is available
 */
export class AvatarStorage {
  private localKey = 'villa-custom-avatar'
  private tinyCloudKey = 'villa/avatar'

  /**
   * Save custom avatar to storage
   * Saves to both localStorage (instant) and TinyCloud (cross-device)
   */
  async save(avatar: CustomAvatar): Promise<void> {
    // Always save to localStorage first (instant, works offline)
    try {
      localStorage.setItem(this.localKey, JSON.stringify(avatar))
    } catch {
      throw new Error('Failed to save avatar. Storage may be full.')
    }

    // Try TinyCloud for cross-device sync (non-blocking)
    this.syncToTinyCloud(avatar).catch(() => {
      // TinyCloud unavailable - localStorage is still saved
    })
  }

  /**
   * Sync avatar to TinyCloud (background operation)
   */
  private async syncToTinyCloud(avatar: CustomAvatar): Promise<void> {
    try {
      const { getTinyCloud, isTinyCloudConnected } = await import('./tinycloud-client')
      if (!isTinyCloudConnected()) return

      const tc = await getTinyCloud()
      await tc.storage.put(this.tinyCloudKey, avatar)
    } catch {
      // TinyCloud unavailable
    }
  }

  /**
   * Load custom avatar from storage
   * Prefers TinyCloud (cross-device) over localStorage
   */
  async load(): Promise<CustomAvatar | null> {
    // Try TinyCloud first for most recent cross-device data
    try {
      const { getTinyCloud, isTinyCloudConnected } = await import('./tinycloud-client')
      if (isTinyCloudConnected()) {
        const tc = await getTinyCloud()
        const result = await tc.storage.get(this.tinyCloudKey)
        if (result?.data) {
          // Update localStorage with TinyCloud data
          try {
            localStorage.setItem(this.localKey, JSON.stringify(result.data))
          } catch {
            // Ignore localStorage errors
          }
          return result.data as CustomAvatar
        }
      }
    } catch {
      // TinyCloud unavailable, fall through to localStorage
    }

    // Fallback to localStorage
    try {
      const data = localStorage.getItem(this.localKey)
      if (!data) return null
      return JSON.parse(data) as CustomAvatar
    } catch {
      return null
    }
  }

  /**
   * Load from localStorage only (sync, fast)
   */
  loadLocal(): CustomAvatar | null {
    try {
      const data = localStorage.getItem(this.localKey)
      if (!data) return null
      return JSON.parse(data) as CustomAvatar
    } catch {
      return null
    }
  }

  /**
   * Delete custom avatar from storage
   */
  async delete(): Promise<void> {
    localStorage.removeItem(this.localKey)

    // Try TinyCloud
    try {
      const { getTinyCloud, isTinyCloudConnected } = await import('./tinycloud-client')
      if (isTinyCloudConnected()) {
        const tc = await getTinyCloud()
        await tc.storage.delete(this.tinyCloudKey)
      }
    } catch {
      // TinyCloud unavailable
    }
  }
}

// Singleton instance
export const avatarStorage = new AvatarStorage()
