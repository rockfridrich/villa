/**
 * Villa Database Schema
 *
 * PostgreSQL schema for identity storage using Drizzle ORM.
 * Hosted on DigitalOcean Managed PostgreSQL.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  inet,
  integer,
  text,
} from 'drizzle-orm/pg-core'

/**
 * User profiles - main identity store
 *
 * Maps wallet addresses to nicknames and avatar configurations.
 * One profile per address, one nickname per profile.
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  nickname: varchar('nickname', { length: 32 }).unique(),
  nicknameNormalized: varchar('nickname_normalized', { length: 32 }).unique(),
  avatarStyle: varchar('avatar_style', { length: 20 }).default('bottts'),
  avatarSeed: varchar('avatar_seed', { length: 64 }),
  avatarGender: varchar('avatar_gender', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

/**
 * Nickname reservations - temporary holds
 *
 * When a user starts the nickname claim flow, we reserve the nickname
 * for 10 minutes to prevent race conditions during signature verification.
 */
export const nicknameReservations = pgTable('nickname_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  nicknameNormalized: varchar('nickname_normalized', { length: 32 })
    .notNull()
    .unique(),
  address: varchar('address', { length: 42 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

/**
 * ENS registrations - track on-chain names
 *
 * When users upgrade to on-chain ENS registration (Phase 3),
 * we track the registration here for fast lookups.
 */
export const ensRegistrations = pgTable('ens_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  ensName: varchar('ens_name', { length: 255 }).notNull(),
  chainId: integer('chain_id').notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

/**
 * Audit log - debugging and compliance
 *
 * Records significant user actions for troubleshooting and
 * potential compliance requirements.
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }),
  action: varchar('action', { length: 50 }).notNull(),
  details: jsonb('details'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

/**
 * Developer apps - registered applications using Villa SDK
 *
 * Tracks third-party apps that integrate with Villa for identity services.
 * Apps are tied to wallet addresses and authenticated via API keys.
 */
export const developerApps = pgTable('developer_apps', {
  id: text('id').primaryKey(), // app_xxx format
  name: text('name').notNull(),
  description: text('description'),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
  apiKey: text('api_key').notNull().unique(),
  allowedOrigins: text('allowed_origins').array(),
  rateLimit: integer('rate_limit').default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

/**
 * App registration rate limits - prevent spam
 *
 * Tracks app registration attempts per wallet to prevent abuse.
 * Limits are per-wallet, per-day.
 */
export const appRegistrationLimits = pgTable('app_registration_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).notNull(),
  registrationsToday: integer('registrations_today').default(0).notNull(),
  windowStartsAt: timestamp('window_starts_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Type exports for use in routes
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type NicknameReservation = typeof nicknameReservations.$inferSelect
export type NewNicknameReservation = typeof nicknameReservations.$inferInsert
export type EnsRegistration = typeof ensRegistrations.$inferSelect
export type AuditEntry = typeof auditLog.$inferSelect
export type NewAuditEntry = typeof auditLog.$inferInsert
export type DeveloperApp = typeof developerApps.$inferSelect
export type NewDeveloperApp = typeof developerApps.$inferInsert
export type AppRegistrationLimit = typeof appRegistrationLimits.$inferSelect
export type NewAppRegistrationLimit = typeof appRegistrationLimits.$inferInsert
