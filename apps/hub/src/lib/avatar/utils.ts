import type {
  AvatarConfig,
  LegacyAvatarConfig,
  NewAvatarConfig,
} from "@/types";
import { generateAvatarSvgFromSeed } from "./dicebear";
import { generateAvatarFromSelection } from "./generator";

export function isLegacyAvatarConfig(
  config: AvatarConfig,
): config is LegacyAvatarConfig {
  return "variant" in config && "selection" in config;
}

export function isNewAvatarConfig(
  config: AvatarConfig,
): config is NewAvatarConfig {
  return "seed" in config && !("variant" in config);
}

export function generateAvatarFromConfig(
  walletAddress: string,
  config: AvatarConfig,
): string {
  if (isLegacyAvatarConfig(config)) {
    return generateAvatarFromSelection(
      walletAddress,
      config.selection,
      config.variant,
    );
  } else if (isNewAvatarConfig(config)) {
    return generateAvatarSvgFromSeed(config.style, config.seed);
  } else {
    throw new Error("Invalid avatar configuration");
  }
}

export function generateAvatarDataUrlFromConfig(
  walletAddress: string,
  config: AvatarConfig,
): string {
  const svg = generateAvatarFromConfig(walletAddress, config);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
