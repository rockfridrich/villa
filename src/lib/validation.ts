import { z } from 'zod'

// Sanitize string to prevent XSS
function sanitize(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .trim()
}

export const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be 50 characters or less')
  .transform(sanitize)

export const identitySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
  displayName: displayNameSchema,
  avatar: z.string().optional(),
  createdAt: z.number(),
})

export type Identity = z.infer<typeof identitySchema>
