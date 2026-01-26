const ADJECTIVES = [
  "swift", "gentle", "brave", "calm", "keen",
  "bold", "wise", "free", "wild", "bright",
  "noble", "proud", "quick", "sure", "true",
  "agile", "clever", "fierce", "lucky", "merry",
  "nimble", "silent", "steady", "strong", "vivid",
  "golden", "misty", "sunny", "serene", "radiant",
] as const;

const VIETNAM_ANIMALS = [
  "buffalo", "pangolin", "macaque", "langur", "loris",
  "civet", "deer", "otter", "crane", "pheasant",
  "python", "gecko", "turtle", "egret", "heron",
  "peacock", "gibbon", "muntjac", "serow", "gaur",
  "leopard", "tiger", "elephant", "rhino", "bear",
  "dolphin", "dugong", "hornbill", "kingfisher", "ibis",
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
    const animalIndex = (hash >> 8) % VIETNAM_ANIMALS.length;
    return `${capitalize(ADJECTIVES[adjIndex])}${capitalize(VIETNAM_ANIMALS[animalIndex])}`;
  }

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = VIETNAM_ANIMALS[Math.floor(Math.random() * VIETNAM_ANIMALS.length)];
  return `${capitalize(adjective)}${capitalize(animal)}`;
}

export function suggestNicknames(seed: string, count = 5): string[] {
  const suggestions: string[] = [];
  for (let i = 0; i < count; i++) {
    suggestions.push(generateNickname(`${seed}-${i}`));
  }
  return suggestions;
}

export { VIETNAM_ANIMALS, ADJECTIVES };
