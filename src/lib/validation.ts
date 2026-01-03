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

export const identitySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
  displayName: displayNameSchema,
  avatar: z.string().optional(),
  createdAt: z.number(),
})

export type Identity = z.infer<typeof identitySchema>
