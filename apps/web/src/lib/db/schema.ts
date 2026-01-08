/**
 * Database schema definitions
 * Run migrate.ts to apply these to the database
 */

export const SCHEMA = `
-- User profiles (primary store for identity data)
CREATE TABLE IF NOT EXISTS profiles (
  address VARCHAR(42) PRIMARY KEY,
  nickname VARCHAR(32) UNIQUE,
  nickname_normalized VARCHAR(32) UNIQUE,
  avatar_style VARCHAR(20),
  avatar_selection VARCHAR(10),
  avatar_variant INTEGER,
  nickname_change_count INTEGER DEFAULT 0,
  last_nickname_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebAuthn credentials (passkey storage)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  address VARCHAR(42) NOT NULL,
  nickname VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname_normalized);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_address ON webauthn_credentials(address);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`

/**
 * Migration to add nickname change tracking columns to existing profiles table
 * Safe to run multiple times - uses DO blocks with IF NOT EXISTS pattern
 */
export const MIGRATION_NICKNAME_CHANGE = `
DO $$
BEGIN
  -- Add nickname_change_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'nickname_change_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nickname_change_count INTEGER DEFAULT 0;
  END IF;

  -- Add last_nickname_change column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_nickname_change'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_nickname_change TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
`

/**
 * Profile row type (matches database schema)
 */
export interface ProfileRow {
  address: string
  nickname: string | null
  nickname_normalized: string | null
  avatar_style: string | null
  avatar_selection: string | null
  avatar_variant: number | null
  nickname_change_count: number
  last_nickname_change: Date | null
  created_at: Date
  updated_at: Date
}

/**
 * Profile API response type
 */
export interface Profile {
  address: string
  nickname: string | null
  avatar: {
    style: string
    selection: string
    variant: number
  } | null
  nicknameChangeCount: number
  lastNicknameChange: string | null
  canChangeNickname: boolean
  createdAt: string
  updatedAt: string
}

// Maximum nickname changes allowed (first change is always allowed)
export const MAX_NICKNAME_CHANGES = 1

// Cooldown period between nickname changes (30 days in milliseconds)
export const NICKNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Check if user can change their nickname based on change count and cooldown
 */
export function canChangeNickname(row: ProfileRow): boolean {
  // First nickname (no changes yet) - can always change
  if (row.nickname_change_count === 0) {
    return true
  }

  // Exceeded max changes
  if (row.nickname_change_count >= MAX_NICKNAME_CHANGES) {
    return false
  }

  // Check cooldown period
  if (row.last_nickname_change) {
    const lastChange = new Date(row.last_nickname_change).getTime()
    const now = Date.now()
    if (now - lastChange < NICKNAME_CHANGE_COOLDOWN_MS) {
      return false
    }
  }

  return true
}

/**
 * Convert database row to API response
 */
export function rowToProfile(row: ProfileRow): Profile {
  return {
    address: row.address,
    nickname: row.nickname,
    avatar: row.avatar_style && row.avatar_selection && row.avatar_variant !== null
      ? {
          style: row.avatar_style,
          selection: row.avatar_selection,
          variant: row.avatar_variant,
        }
      : null,
    nicknameChangeCount: row.nickname_change_count ?? 0,
    lastNicknameChange: row.last_nickname_change?.toISOString() ?? null,
    canChangeNickname: canChangeNickname(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
