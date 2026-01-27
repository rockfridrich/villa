const ADJECTIVES = [
  "swift",
  "gentle",
  "brave",
  "calm",
  "keen",
  "bold",
  "wise",
  "free",
  "wild",
  "bright",
  "noble",
  "proud",
  "quick",
  "sure",
  "true",
  "agile",
  "clever",
  "fierce",
  "lucky",
  "merry",
  "nimble",
  "silent",
  "steady",
  "strong",
  "vivid",
  "golden",
  "misty",
  "sunny",
  "serene",
  "radiant",
] as const;

const VIETNAM_ANIMALS = [
  "buffalo",
  "pangolin",
  "macaque",
  "langur",
  "loris",
  "civet",
  "deer",
  "otter",
  "crane",
  "pheasant",
  "python",
  "gecko",
  "turtle",
  "egret",
  "heron",
  "peacock",
  "gibbon",
  "muntjac",
  "serow",
  "gaur",
  "leopard",
  "tiger",
  "elephant",
  "rhino",
  "bear",
  "dolphin",
  "dugong",
  "hornbill",
  "kingfisher",
  "ibis",
] as const;

const RESERVED_NICKNAMES = new Set([
  "admin",
  "villa",
  "system",
  "api",
  "www",
  "root",
  "mod",
  "moderator",
  "support",
  "help",
  "official",
  "staff",
  "team",
  "bot",
  "null",
]);

export const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[A-Z][a-zA-Z0-9]*$/,
  cooldownMs: 30 * 24 * 60 * 60 * 1000,
  maxChanges: 1,
} as const;

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateNickname(seed?: string): string {
  if (seed) {
    const hash = hashString(seed);
    const adjIndex = hash % ADJECTIVES.length;
    const animalIndex = (hash >> 8) % VIETNAM_ANIMALS.length;
    return `${capitalize(ADJECTIVES[adjIndex])}${capitalize(VIETNAM_ANIMALS[animalIndex])}`;
  }

  const adjective = getRandomElement(ADJECTIVES);
  const animal = getRandomElement(VIETNAM_ANIMALS);
  return `${capitalize(adjective)}${capitalize(animal)}`;
}

export function generateUniqueNickname(
  seed?: string,
  existingCheck?: (nickname: string) => boolean,
): string {
  let nickname = generateNickname(seed);
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    if (!existingCheck || !existingCheck(nickname)) {
      return nickname;
    }

    const suffix = Math.floor(Math.random() * 999) + 1;
    nickname = `${generateNickname()}${suffix}`;
    attempts++;
  }

  const timestamp = Date.now().toString(36).slice(-4);
  return `${generateNickname()}${timestamp}`;
}

export type NicknameValidationError =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_FORMAT"
  | "RESERVED";

export interface NicknameValidationResult {
  valid: boolean;
  error?: NicknameValidationError;
  normalized?: string;
}

export function validateNickname(nickname: string): NicknameValidationResult {
  const trimmed = nickname.trim();
  const normalized = trimmed.toLowerCase();

  if (trimmed.length < NICKNAME_RULES.minLength) {
    return { valid: false, error: "TOO_SHORT" };
  }

  if (trimmed.length > NICKNAME_RULES.maxLength) {
    return { valid: false, error: "TOO_LONG" };
  }

  if (!NICKNAME_RULES.pattern.test(trimmed)) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  if (RESERVED_NICKNAMES.has(normalized)) {
    return { valid: false, error: "RESERVED" };
  }

  return { valid: true, normalized };
}

export function normalizeNickname(nickname: string): string {
  return nickname.toLowerCase().trim();
}

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.has(normalizeNickname(nickname));
}

export function getAvailableAdjectives(): readonly string[] {
  return ADJECTIVES;
}

export function getAvailableNouns(): readonly string[] {
  return VIETNAM_ANIMALS;
}
