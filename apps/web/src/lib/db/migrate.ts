/**
 * Database migration script
 * Run with: npx tsx src/lib/db/migrate.ts
 */
import { getDb, closeDb } from './index'
import { SCHEMA } from './schema'

async function migrate() {
  console.log('Running database migrations...')

  try {
    const sql = getDb()

    // Run schema creation
    await sql.unsafe(SCHEMA)

    console.log('Migrations completed successfully!')

    // Verify tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `

    if (tables.length > 0) {
      console.log('Verified: profiles table exists')
    } else {
      console.error('Warning: profiles table not found after migration')
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await closeDb()
  }
}

migrate()
