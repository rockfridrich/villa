import { createAvatar } from "@dicebear/core";
import { lorelei, adventurer, avataaars, pixelArt } from "@dicebear/collection";
import type { AvatarStyle } from "@/types";

export function generateAvatarSvgFromSeed(
  style: AvatarStyle,
  seed: string,
): string {
  let avatar;

  switch (style) {
    case "lorelei":
      avatar = createAvatar(lorelei, { seed, size: 128 });
      break;
    case "adventurer":
      avatar = createAvatar(adventurer, { seed, size: 128 });
      break;
    case "avataaars":
      avatar = createAvatar(avataaars, { seed, size: 128 });
      break;
    case "web3":
      avatar = createAvatar(pixelArt, { seed, size: 128 });
      break;
    default:
      throw new Error(`Unsupported avatar style: ${style}`);
  }

  return avatar.toString();
}

export function generateAvatarDataUrlFromSeed(
  style: AvatarStyle,
  seed: string,
): string {
  const svg = generateAvatarSvgFromSeed(style, seed);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateRandomSeed(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function isValidAvatarStyle(style: string): style is AvatarStyle {
  return ["lorelei", "adventurer", "avataaars", "web3"].includes(style);
}
