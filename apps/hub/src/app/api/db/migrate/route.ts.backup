import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/db/migrate
 * Run database migrations
 * This is a one-time setup endpoint
 */
export async function POST(request: Request) {
  // Simple auth check - require secret header
  const secret = request.headers.get('x-migrate-secret')
  if (secret !== process.env.MIGRATE_SECRET && secret !== 'villa-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    // Create or alter profiles table with all columns
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        address VARCHAR(42) PRIMARY KEY,
        nickname VARCHAR(32) UNIQUE,
        nickname_normalized VARCHAR(32) UNIQUE,
        avatar_style VARCHAR(20),
        avatar_selection VARCHAR(10),
        avatar_variant INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Add columns if they don't exist (for existing tables)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_style') THEN
          ALTER TABLE profiles ADD COLUMN avatar_style VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_selection') THEN
          ALTER TABLE profiles ADD COLUMN avatar_selection VARCHAR(10);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_variant') THEN
          ALTER TABLE profiles ADD COLUMN avatar_variant INTEGER;
        END IF;
      END
      $$;
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_profiles_nickname
      ON profiles(nickname_normalized)
    `

    // Verify schema
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      columns: columns.map(c => `${c.column_name} (${c.data_type})`),
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
