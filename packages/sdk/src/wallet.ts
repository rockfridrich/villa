/**
 * Wallet Generation & Management
 *
 * Secure key generation, encryption, and backup for Villa accounts.
 * Uses industry-standard cryptography for key derivation and storage.
 *
 * Security Features:
 * - PBKDF2 for passphrase key derivation
 * - AES-256-GCM for encryption
 * - Cryptographically secure random generation
 * - No plaintext key storage
 * - Zod validation for all localStorage data
 */

import { z } from 'zod'
import { generatePrivateKey, privateKeyToAccount, type Account } from 'viem/accounts'
import { type Hex, hexToBytes, bytesToHex } from 'viem'

/**
 * Encrypted wallet backup format
 */
export interface EncryptedWallet {
  /** Version for future compatibility */
  version: 1
  /** Encrypted private key (AES-256-GCM) */
  ciphertext: string
  /** Initialization vector (base64) */
  iv: string
  /** Salt for PBKDF2 (base64) */
  salt: string
  /** Authentication tag (base64) */
  authTag: string
  /** PBKDF2 iterations (min 100,000) */
  iterations: number
  /** Address for identification (not sensitive) */
  address: string
  /** Creation timestamp */
  createdAt: number
}

/**
 * Wallet generation result
 */
export interface WalletResult {
  /** The generated account */
  account: Account
  /** Private key (handle with extreme care!) */
  privateKey: Hex
}

/**
 * Options for wallet encryption
 */
export interface EncryptionOptions {
  /** PBKDF2 iterations (default: 100,000) */
  iterations?: number
}

// Crypto constants
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 32
const DEFAULT_ITERATIONS = 100_000

/**
 * Zod schema for EncryptedWallet validation
 * SECURITY: Always validate localStorage data before use
 */
const EncryptedWalletSchema = z.object({
  version: z.literal(1),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  salt: z.string().min(1),
  authTag: z.string().min(1),
  iterations: z.number().min(10000),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  createdAt: z.number(),
})

/**
 * Generate a new wallet with cryptographically secure randomness
 *
 * @returns Wallet with account and private key
 *
 * @example
 * const { account, privateKey } = generateWallet()
 * console.log('Address:', account.address)
 * // IMPORTANT: Immediately encrypt and backup privateKey
 */
export function generateWallet(): WalletResult {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  return {
    account,
    privateKey,
  }
}

/**
 * Import wallet from existing private key
 *
 * @param privateKey - Hex-encoded private key
 * @returns Wallet account
 *
 * @example
 * const account = importWallet('0x...')
 */
export function importWallet(privateKey: Hex): Account {
  return privateKeyToAccount(privateKey)
}

/**
 * Encrypt a private key with a passphrase
 *
 * Uses:
 * - PBKDF2 with SHA-256 for key derivation
 * - AES-256-GCM for authenticated encryption
 * - Cryptographically secure random IV and salt
 *
 * @param privateKey - The private key to encrypt
 * @param passphrase - User's passphrase (min 8 characters recommended)
 * @param options - Encryption options
 * @returns Encrypted wallet backup
 *
 * @example
 * const encrypted = await encryptPrivateKey(privateKey, 'my-secure-passphrase')
 * localStorage.setItem('wallet_backup', JSON.stringify(encrypted))
 */
export async function encryptPrivateKey(
  privateKey: Hex,
  passphrase: string,
  options: EncryptionOptions = {}
): Promise<EncryptedWallet> {
  const iterations = options.iterations ?? DEFAULT_ITERATIONS

  if (passphrase.length < 8) {
    console.warn('Passphrase should be at least 8 characters for security')
  }

  // Get account for address identification
  const account = privateKeyToAccount(privateKey)

  // Generate cryptographically secure random values
  const iv = new Uint8Array(IV_LENGTH)
  const salt = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(iv)
  crypto.getRandomValues(salt)

  // Derive encryption key from passphrase using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt']
  )

  // Encrypt the private key
  const privateKeyBytes = hexToBytes(privateKey)
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    derivedKey,
    privateKeyBytes.buffer as ArrayBuffer
  )

  // Extract ciphertext and auth tag
  const encryptedArray = new Uint8Array(encrypted)
  const authTag = encryptedArray.slice(-16)
  const ciphertext = encryptedArray.slice(0, -16)

  return {
    version: 1,
    ciphertext: arrayToBase64(ciphertext),
    iv: arrayToBase64(iv),
    salt: arrayToBase64(salt),
    authTag: arrayToBase64(authTag),
    iterations,
    address: account.address,
    createdAt: Date.now(),
  }
}

/**
 * Decrypt an encrypted wallet backup
 *
 * @param encrypted - Encrypted wallet data
 * @param passphrase - User's passphrase
 * @returns Decrypted private key
 * @throws Error if passphrase is incorrect or data is corrupted
 *
 * @example
 * const backup = JSON.parse(localStorage.getItem('wallet_backup')!)
 * const privateKey = await decryptPrivateKey(backup, 'my-secure-passphrase')
 */
export async function decryptPrivateKey(
  encrypted: EncryptedWallet,
  passphrase: string
): Promise<Hex> {
  if (encrypted.version !== 1) {
    throw new Error(`Unsupported wallet version: ${encrypted.version}`)
  }

  // Decode base64 values
  const iv = base64ToArray(encrypted.iv)
  const salt = base64ToArray(encrypted.salt)
  const ciphertext = base64ToArray(encrypted.ciphertext)
  const authTag = base64ToArray(encrypted.authTag)

  // Derive key from passphrase
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: encrypted.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['decrypt']
  )

  // Reconstruct the encrypted data with auth tag
  const encryptedWithTag = new Uint8Array(ciphertext.length + authTag.length)
  encryptedWithTag.set(ciphertext)
  encryptedWithTag.set(authTag, ciphertext.length)

  try {
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      derivedKey,
      encryptedWithTag.buffer as ArrayBuffer
    )

    return bytesToHex(new Uint8Array(decrypted)) as Hex
  } catch {
    throw new Error('Invalid passphrase or corrupted data')
  }
}

/**
 * Generate a recovery phrase backup (human-readable)
 *
 * Creates a backup string that can be written down or stored securely.
 * This is the encrypted wallet in a portable format.
 *
 * @param encrypted - Encrypted wallet
 * @returns Base64-encoded backup string
 */
export function exportBackup(encrypted: EncryptedWallet): string {
  const json = JSON.stringify(encrypted)
  return btoa(json)
}

/**
 * Import a backup string
 *
 * @param backup - Base64-encoded backup from exportBackup
 * @returns Encrypted wallet data
 */
export function importBackup(backup: string): EncryptedWallet {
  try {
    const json = atob(backup)
    const data = JSON.parse(json) as EncryptedWallet

    // Validate structure
    if (
      data.version !== 1 ||
      !data.ciphertext ||
      !data.iv ||
      !data.salt ||
      !data.authTag ||
      !data.address
    ) {
      throw new Error('Invalid backup format')
    }

    return data
  } catch {
    throw new Error('Invalid backup data')
  }
}

/**
 * Validate a private key format
 *
 * @param key - Potential private key
 * @returns true if valid hex format
 */
export function isValidPrivateKey(key: string): key is Hex {
  return /^0x[a-fA-F0-9]{64}$/.test(key)
}

/**
 * Securely clear sensitive data from memory
 *
 * Note: JavaScript doesn't guarantee memory clearing, but this helps.
 * For production, consider using secure enclaves or HSMs.
 *
 * @param data - String or Uint8Array to clear
 */
export function secureClear(data: string | Uint8Array): void {
  if (typeof data === 'string') {
    // Can't truly clear strings in JS, but overwrite reference
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data = '0'.repeat(data.length)
  } else {
    crypto.getRandomValues(data)
  }
}

// Helper functions
function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
}

function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return array
}

/**
 * Storage interface for wallet backups
 */
export interface WalletStorage {
  save(wallet: EncryptedWallet): Promise<void>
  load(address: string): Promise<EncryptedWallet | null>
  list(): Promise<string[]>
  delete(address: string): Promise<void>
}

/**
 * LocalStorage-based wallet storage (browser)
 *
 * SECURITY: All localStorage data is validated with Zod before use.
 *
 * For production, consider:
 * - IndexedDB for larger storage
 * - Secure cloud backup (encrypted)
 * - Hardware security modules
 */
export function createLocalStorage(prefix = 'villa_wallet_'): WalletStorage {
  return {
    async save(wallet: EncryptedWallet): Promise<void> {
      // Validate before saving
      const validated = EncryptedWalletSchema.safeParse(wallet)
      if (!validated.success) {
        console.error('[Villa SDK] Invalid wallet data:', validated.error.message)
        return
      }
      const key = `${prefix}${wallet.address.toLowerCase()}`
      localStorage.setItem(key, JSON.stringify(validated.data))
    },

    async load(address: string): Promise<EncryptedWallet | null> {
      const key = `${prefix}${address.toLowerCase()}`
      const data = localStorage.getItem(key)
      if (!data) return null

      // SECURITY: Parse and validate - never trust localStorage
      let parsed: unknown
      try {
        parsed = JSON.parse(data)
      } catch {
        console.error('[Villa SDK] Corrupted wallet data in localStorage')
        return null
      }

      const result = EncryptedWalletSchema.safeParse(parsed)
      if (!result.success) {
        console.error('[Villa SDK] Invalid wallet format:', result.error.message)
        return null
      }

      return result.data as EncryptedWallet
    },

    async list(): Promise<string[]> {
      const addresses: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          addresses.push(key.slice(prefix.length))
        }
      }
      return addresses
    },

    async delete(address: string): Promise<void> {
      const key = `${prefix}${address.toLowerCase()}`
      localStorage.removeItem(key)
    },
  }
}
