/**
 * Database Seed Script
 *
 * Seeds the database with test data for development.
 * Run with: pnpm --filter @villa/api db:seed
 */

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

// Load environment
config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

async function seed() {
  console.log('Connecting to database...')

  const sql = postgres(DATABASE_URL!, {
    ssl: DATABASE_URL.includes('sslmode=require') ? 'require' : false,
  })

  const db = drizzle(sql, { schema })

  console.log('Seeding database...')

  // Sample test profiles
  const testProfiles = [
    {
      address: '0x1111111111111111111111111111111111111111',
      nickname: 'alice',
      nicknameNormalized: 'alice',
      avatarStyle: 'adventurer' as const,
      avatarSeed: 'alice',
      avatarGender: 'female',
    },
    {
      address: '0x2222222222222222222222222222222222222222',
      nickname: 'bob',
      nicknameNormalized: 'bob',
      avatarStyle: 'bottts' as const,
      avatarSeed: 'bob',
      avatarGender: 'male',
    },
    {
      address: '0x3333333333333333333333333333333333333333',
      nickname: 'charlie',
      nicknameNormalized: 'charlie',
      avatarStyle: 'thumbs' as const,
      avatarSeed: 'charlie',
      avatarGender: 'other',
    },
  ]

  for (const profile of testProfiles) {
    try {
      const existing = await db
        .select()
        .from(schema.profiles)
        .where(sql`${schema.profiles.address} = ${profile.address}`)
        .limit(1)

      if (existing.length === 0) {
        await db.insert(schema.profiles).values(profile)
        console.log(`Created profile: ${profile.nickname}`)
      } else {
        console.log(`Profile exists: ${profile.nickname}`)
      }
    } catch (error) {
      console.error(`Failed to create ${profile.nickname}:`, error)
    }
  }

  // Add some audit log entries
  await db.insert(schema.auditLog).values([
    {
      address: '0x1111111111111111111111111111111111111111',
      action: 'seed_data',
      details: { source: 'seed.ts', environment: process.env.NODE_ENV },
    },
  ])

  console.log('Seed complete!')

  await sql.end()
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
