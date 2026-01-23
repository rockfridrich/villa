/**
 * Avatar Generation
 *
 * Supports two avatar types:
 * 1. Web3 gradient avatars (default) - beautiful gradients from wallet address
 * 2. DiceBear avatars - character-based avatars
 */

import type { AvatarConfig, AvatarStyle } from "./types";

const DICEBEAR_API = "https://api.dicebear.com/7.x";

/**
 * Generate gradient colors from an Ethereum address.
 * Based on web3-avatar by JackHamer09.
 * @see https://github.com/JackHamer09/web3-avatar
 */
export function getWeb3GradientColors(address: string): string[] {
  const seedArr = address.match(/.{1,7}/g)?.splice(0, 5);
  const colors: string[] = [];

  seedArr?.forEach((seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 255;
      rgb[i] = value;
    }
    colors.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  });

  return colors;
}

/**
 * Generate CSS for a web3 gradient avatar.
 * Can be applied as inline styles to any element.
 */
export function getWeb3AvatarStyles(address: string): {
  backgroundColor: string;
  backgroundImage: string;
  borderRadius: string;
  boxShadow: string;
} {
  const colors = getWeb3GradientColors(address);
  return {
    backgroundColor: colors[0] || "#ccc",
    backgroundImage: `
      radial-gradient(at 66% 77%, ${colors[1]} 0px, transparent 50%),
      radial-gradient(at 29% 97%, ${colors[2]} 0px, transparent 50%),
      radial-gradient(at 99% 86%, ${colors[3]} 0px, transparent 50%),
      radial-gradient(at 29% 88%, ${colors[4]} 0px, transparent 50%)
    `.trim(),
    borderRadius: "50%",
    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
  };
}

/**
 * Generate a data URI for a web3 gradient avatar SVG.
 * Useful when you need a URL instead of inline styles.
 */
export function getWeb3AvatarDataUri(address: string, size = 100): string {
  const colors = getWeb3GradientColors(address);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="g1" cx="66%" cy="77%"><stop offset="0%" stop-color="${colors[1]}"/><stop offset="50%" stop-color="transparent"/></radialGradient>
      <radialGradient id="g2" cx="29%" cy="97%"><stop offset="0%" stop-color="${colors[2]}"/><stop offset="50%" stop-color="transparent"/></radialGradient>
      <radialGradient id="g3" cx="99%" cy="86%"><stop offset="0%" stop-color="${colors[3]}"/><stop offset="50%" stop-color="transparent"/></radialGradient>
      <radialGradient id="g4" cx="29%" cy="88%"><stop offset="0%" stop-color="${colors[4]}"/><stop offset="50%" stop-color="transparent"/></radialGradient>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${colors[0]}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g1)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g2)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g3)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g4)"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Get avatar URL - supports both web3 gradients and DiceBear styles.
 * Default is "web3" which generates a gradient from the wallet address.
 */
export function getAvatarUrl(
  seed: string,
  config?: Partial<AvatarConfig>
): string {
  const style = config?.style || "web3";

  // Web3 gradient avatar (default)
  if (style === "web3") {
    return getWeb3AvatarDataUri(seed);
  }

  // DiceBear avatar
  const params = new URLSearchParams({ seed });
  if (config?.gender) {
    params.set("gender", config.gender);
  }

  return `${DICEBEAR_API}/${style}/svg?${params.toString()}`;
}

/**
 * Creates a complete AvatarConfig with defaults.
 * Default style is "web3" (gradient avatar).
 */
export function createAvatarConfig(
  seed: string,
  partial?: Partial<AvatarConfig>
): AvatarConfig {
  return {
    style: partial?.style || "web3",
    seed,
    gender: partial?.gender,
  };
}

/**
 * Get list of all available avatar styles.
 */
export function getAvatarStyles(): readonly AvatarStyle[] {
  return ["web3", "lorelei", "adventurer", "avataaars", "bottts", "thumbs"];
}
