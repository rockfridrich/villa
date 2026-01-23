const ADJECTIVES = [
  "sunny", "misty", "golden", "crystal", "mossy",
  "dewy", "breezy", "shady", "cozy", "warm",
  "friendly", "gentle", "merry", "jolly", "cheerful",
  "humble", "honest", "kind", "calm", "sweet",
  "clever", "handy", "nimble", "swift", "steady",
  "bright", "keen", "wise", "bold", "true",
] as const;

const NOUNS = [
  "baker", "miller", "potter", "weaver", "smith",
  "farmer", "keeper", "mason", "cooper", "carver",
  "sparrow", "robin", "wren", "finch", "dove",
  "fox", "hare", "deer", "otter", "badger",
  "hearth", "meadow", "brook", "grove", "thicket",
  "cottage", "garden", "orchard", "haven", "hollow",
] as const;

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
    const nounIndex = (hash >> 8) % NOUNS.length;
    return `${capitalize(ADJECTIVES[adjIndex])}${capitalize(NOUNS[nounIndex])}`;
  }

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${capitalize(adjective)}${capitalize(noun)}`;
}

export function suggestNicknames(seed: string, count = 5): string[] {
  const suggestions: string[] = [];
  for (let i = 0; i < count; i++) {
    suggestions.push(generateNickname(`${seed}-${i}`));
  }
  return suggestions;
}
