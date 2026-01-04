-- Migration: Add developer apps tables
-- Created: 2026-01-05

-- Create developer_apps table
CREATE TABLE IF NOT EXISTS "developer_apps" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "owner_address" varchar(42) NOT NULL,
  "api_key" text NOT NULL UNIQUE,
  "allowed_origins" text[],
  "rate_limit" integer DEFAULT 100,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Create app_registration_limits table
CREATE TABLE IF NOT EXISTS "app_registration_limits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "address" varchar(42) NOT NULL,
  "registrations_today" integer DEFAULT 0 NOT NULL,
  "window_starts_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "developer_apps_owner_idx" ON "developer_apps" ("owner_address");
CREATE INDEX IF NOT EXISTS "developer_apps_api_key_idx" ON "developer_apps" ("api_key");
CREATE INDEX IF NOT EXISTS "app_registration_limits_address_idx" ON "app_registration_limits" ("address");
