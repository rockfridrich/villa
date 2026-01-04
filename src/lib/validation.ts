import { z } from 'zod'

// Sanitize string to prevent XSS and injection attacks
function sanitize(str: string): string {
  return str
    // Remove HTML tags and angle brackets
    .replace(/[<>]/g, '')
    // Remove quotes (SQL injection, XSS)
    .replace(/["'`]/g, '')
    // Remove null bytes
    .replace(/\x00/g, '')
    .replace(/\u0000/g, '')
    // Remove backslashes (path traversal)
    .replace(/\\/g, '')
    // Limit ampersands (HTML entities)
    .replace(/&/g, '&amp;')
    // Trim whitespace
    .trim()
    // Enforce max length after sanitization
    .slice(0, 50)
}

export const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be 50 characters or less')
  .transform(sanitize)
  .refine((val) => val.length > 0, 'Name cannot be empty after sanitization')

// Avatar style selection (user-facing gender choice)
export const avatarStyleSelectionSchema = z.enum(['male', 'female'])

// Avatar style (DiceBear style name - always avataaars for nice human avatars)
export const avatarStyleSchema = z.enum(['avataaars'])

// Avatar configuration (new format)
export const avatarConfigSchema = z.object({
  style: avatarStyleSchema,
  selection: avatarStyleSelectionSchema,
  variant: z.number().int().min(0),
})

// Avatar field - accepts either string (legacy) or AvatarConfig (new)
const avatarSchema = z.union([
  z.string(), // Legacy format
  avatarConfigSchema, // New format
]).optional()

export const identitySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
  displayName: displayNameSchema,
  avatar: avatarSchema,
  createdAt: z.number(),
})

export type Identity = z.infer<typeof identitySchema>
export type AvatarConfigValidated = z.infer<typeof avatarConfigSchema>
