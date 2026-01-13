/**
 * Random Name Generator
 *
 * Generates deterministic fun names from wallet addresses.
 * Format: AdjectiveCreature (e.g., "FunnyPanda", "SwiftFox")
 */

const ADJECTIVES = [
  'Happy', 'Swift', 'Brave', 'Clever', 'Gentle',
  'Wise', 'Calm', 'Bold', 'Bright', 'Quick',
  'Lucky', 'Merry', 'Noble', 'Proud', 'Keen',
  'Jolly', 'Witty', 'Zesty', 'Lively', 'Agile',
  'Cosmic', 'Mystic', 'Solar', 'Lunar', 'Stellar',
  'Golden', 'Silver', 'Crystal', 'Velvet', 'Amber',
  'Fuzzy', 'Sparkly', 'Dreamy', 'Cozy', 'Snappy',
]

const CREATURES = [
  'Panda', 'Fox', 'Owl', 'Wolf', 'Bear',
  'Tiger', 'Eagle', 'Dolphin', 'Falcon', 'Otter',
  'Lynx', 'Raven', 'Phoenix', 'Dragon', 'Unicorn',
  'Koala', 'Penguin', 'Bunny', 'Squirrel', 'Hedgehog',
  'Sloth', 'Lemur', 'Gecko', 'Seal', 'Deer',
  'Hawk', 'Crane', 'Swan', 'Parrot', 'Toucan',
  'Jaguar', 'Panther', 'Cheetah', 'Lion', 'Gazelle',
]

/**
 * Generate a deterministic random name from a wallet address
 * Same address always produces the same name
 *
 * @param address - Ethereum address (0x...)
 * @returns Name like "FunnyPanda"
 */
export function generateRandomName(address: string): string {
  // Use last 8 chars of address for randomness
  const seed = address.toLowerCase().slice(-8)

  // Convert hex to numbers for indexing
  const adjIndex = parseInt(seed.slice(0, 4), 16) % ADJECTIVES.length
  const creatureIndex = parseInt(seed.slice(4, 8), 16) % CREATURES.length

  return `${ADJECTIVES[adjIndex]}${CREATURES[creatureIndex]}`
}

/**
 * Generate a unique nickname with number suffix if needed
 *
 * @param address - Ethereum address (0x...)
 * @returns Name like "FunnyPanda" or "FunnyPanda42"
 */
export function generateUniqueNickname(address: string): string {
  const baseName = generateRandomName(address)
  // Add last 2 digits of address for uniqueness
  const suffix = parseInt(address.slice(-2), 16) % 100

  // Only add suffix 50% of the time for variety
  if (suffix > 50) {
    return baseName
  }
  return `${baseName}${suffix}`
}
