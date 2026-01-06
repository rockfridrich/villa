/**
 * Database migration script
 * Run with: npx tsx src/lib/db/migrate.ts
 */
import { getDb, closeDb } from './index'
import { SCHEMA, MIGRATION_NICKNAME_CHANGE } from './schema'

async function migrate() {
  console.log('Running database migrations...')

  try {
    const sql = getDb()

    // Run schema creation
    await sql.unsafe(SCHEMA)
    console.log('✓ Base schema applied')

    // Run nickname change migration
    await sql.unsafe(MIGRATION_NICKNAME_CHANGE)
    console.log('✓ Nickname change tracking migration applied')

    console.log('Migrations completed successfully!')

    // Verify tables and columns exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `

    if (tables.length > 0) {
      console.log('Verified: profiles table exists')

      // Verify new columns
      const columns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name IN ('nickname_change_count', 'last_nickname_change')
      `
      console.log(`Verified: ${columns.length}/2 nickname change columns exist`)
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
