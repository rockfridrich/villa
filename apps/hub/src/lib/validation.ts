import { z } from "zod";

// Sanitize string to prevent XSS and injection attacks
function sanitize(str: string): string {
  return (
    str
      // Remove HTML tags and angle brackets
      .replace(/[<>]/g, "")
      // Remove quotes (SQL injection, XSS)
      .replace(/["'`]/g, "")
      // Remove null bytes
      .replace(/\x00/g, "")
      .replace(/\u0000/g, "")
      // Remove backslashes (path traversal)
      .replace(/\\/g, "")
      // Limit ampersands (HTML entities)
      .replace(/&/g, "&amp;")
      // Trim whitespace
      .trim()
      // Enforce max length after sanitization
      .slice(0, 50)
  );
}

export const displayNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .transform(sanitize)
  .refine((val) => val.length > 0, "Name cannot be empty after sanitization");

// Nickname validation schema for profile updates
export const nicknameSchema = z
  .string()
  .min(3, "Nickname must be at least 3 characters")
  .max(30, "Nickname must be 30 characters or less")
  .regex(/^[a-zA-Z]/, "Nickname must start with a letter")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed")
  .transform((val) => val.trim());

// Avatar style selection (user-facing choice: male, female, or other)
export const avatarStyleSelectionSchema = z.enum(["male", "female", "other"]);

// Legacy avatar style (DiceBear style names)
export const legacyAvatarStyleSchema = z.enum(["avataaars", "bottts"]);

// New avatar style (DiceBear collection names)
export const avatarStyleSchema = z.enum([
  "lorelei",
  "adventurer",
  "avataaars",
  "web3",
]);

// Legacy avatar configuration
export const legacyAvatarConfigSchema = z.object({
  style: legacyAvatarStyleSchema,
  selection: avatarStyleSelectionSchema,
  variant: z.number().int().min(0),
});

// New avatar configuration with seed
export const newAvatarConfigSchema = z.object({
  style: avatarStyleSchema,
  seed: z.string().min(1),
});

// Avatar configuration (union of legacy and new)
export const avatarConfigSchema = z.union([
  legacyAvatarConfigSchema,
  newAvatarConfigSchema,
]);

// Avatar field - accepts string (legacy) or AvatarConfig (legacy/new)
const avatarSchema = z
  .union([
    z.string(), // Legacy format
    avatarConfigSchema, // Legacy or new format
  ])
  .optional();

export const identitySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
  displayName: displayNameSchema,
  avatar: avatarSchema,
  createdAt: z.number(),
});

export type Identity = z.infer<typeof identitySchema>;
export type AvatarConfigValidated = z.infer<typeof avatarConfigSchema>;
export type LegacyAvatarConfigValidated = z.infer<
  typeof legacyAvatarConfigSchema
>;
export type NewAvatarConfigValidated = z.infer<typeof newAvatarConfigSchema>;
