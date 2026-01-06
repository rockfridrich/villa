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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname_normalized);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at);

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
 * Profile row type (matches database schema)
 */
export interface ProfileRow {
  address: string
  nickname: string | null
  nickname_normalized: string | null
  avatar_style: string | null
  avatar_selection: string | null
  avatar_variant: number | null
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
  createdAt: string
  updatedAt: string
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
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
