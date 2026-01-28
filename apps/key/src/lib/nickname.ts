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
  "elephant",
  "gaur",
  "banteng",
  "kouprey",
  "tiger",
  "leopard",
  "cloudedleopard",
  "asiaticbear",
  "sunbear",
  "serow",
  "saola",
  "macaque",
  "langur",
  "douc",
  "gibbon",
  "loris",
  "snubnosedmonkey",
  "pangolin",
  "civet",
  "binturong",
  "mongoose",
  "ferretbadger",
  "otter",
  "flyingsquirrel",
  "porcupine",
  "moonrat",
  "shrew",
  "deer",
  "muntjac",
  "barkingdeer",
  "sambar",
  "elddeer",
  "crane",
  "stork",
  "heron",
  "egret",
  "ibis",
  "bittern",
  "cormorant",
  "pelican",
  "spoonbill",
  "pheasant",
  "peacock",
  "hornbill",
  "kingfisher",
  "beeeater",
  "roller",
  "pitta",
  "broadbill",
  "babbler",
  "bulbul",
  "drongo",
  "minivest",
  "oriole",
  "sunbird",
  "flowerpecker",
  "whiteeye",
  "laughingthrush",
  "sibia",
  "yuhina",
  "eagle",
  "hawk",
  "falcon",
  "kestrel",
  "buzzard",
  "harrier",
  "goshawk",
  "sparrowhawk",
  "python",
  "cobra",
  "krait",
  "viper",
  "gecko",
  "skink",
  "agama",
  "monitor",
  "turtle",
  "softshell",
  "crocodile",
  "dolphin",
  "dugong",
  "catfish",
  "snakehead",
  "gourami",
  "barb",
  "carp",
  "eel",
  "ray",
  "shark",
  "frog",
  "toad",
  "salamander",
  "caecilian",
  "butterfly",
  "beetle",
  "mantis",
  "spider",
  "scorpion",
  "millipede",
  "centipede",
  "tapir",
  "chevrotain",
  "slowloris",
  "tarsier",
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
  const animal =
    VIETNAM_ANIMALS[Math.floor(Math.random() * VIETNAM_ANIMALS.length)];
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
