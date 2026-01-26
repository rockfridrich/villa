import { z } from "zod";

const EndpointSchema = z.object({
  hub: z.string().url(),
  key: z.string().url(),
  api: z.string().url(),
});

const ChainSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const VillaConfigManifestSchema = z.object({
  version: z.number(),
  schemaVersion: z.string(),
  endpoints: z.object({
    production: EndpointSchema,
    staging: EndpointSchema,
  }),
  chains: z.object({
    production: ChainSchema,
    staging: ChainSchema,
  }),
  features: z.object({
    claimNickname: z.boolean(),
    socialLookup: z.boolean(),
    avatarUpload: z.boolean(),
  }),
  contracts: z.object({
    nicknameResolver: z.string(),
    recoverySigner: z.string(),
  }),
  ui: z.object({
    avatarStyles: z.array(z.string()),
    defaultAvatarStyle: z.string(),
  }),
  sdk: z.object({
    minVersion: z.string(),
    deprecatedMethods: z.array(z.string()),
  }),
});

export type VillaConfigManifest = z.infer<typeof VillaConfigManifestSchema>;
export type VillaEndpoints = z.infer<typeof EndpointSchema>;
export type VillaTarget = "production" | "staging";
