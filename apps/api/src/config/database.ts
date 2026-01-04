/**
 * Database Configuration
 *
 * Environment-specific database configuration with fallback support.
 * Supports: local, development, staging, production
 */

export type Environment = 'local' | 'development' | 'staging' | 'production' | 'test'

export interface DatabaseConfig {
  /** PostgreSQL connection URL */
  url: string
  /** SSL mode: false for local, 'require' for cloud */
  ssl: boolean | 'require' | 'prefer'
  /** Maximum number of connections in pool */
  maxConnections: number
  /** Idle connection timeout in seconds */
  idleTimeout: number
  /** Connection timeout in seconds */
  connectTimeout: number
  /** Number of retry attempts on connection failure */
  retryAttempts: number
  /** Delay between retries in milliseconds */
  retryDelay: number
  /** Enable in-memory fallback when DB unavailable */
  enableFallback: boolean
}

/**
 * Default configurations per environment
 */
const configs: Record<Environment, Partial<DatabaseConfig>> = {
  local: {
    url: 'postgresql://villa:villa_dev_password@localhost:5432/villa_dev',
    ssl: false,
    maxConnections: 5,
    idleTimeout: 30,
    connectTimeout: 5,
    retryAttempts: 3,
    retryDelay: 1000,
    enableFallback: true,
  },
  development: {
    ssl: false,
    maxConnections: 10,
    idleTimeout: 20,
    connectTimeout: 10,
    retryAttempts: 3,
    retryDelay: 1000,
    enableFallback: true,
  },
  test: {
    url: 'postgresql://villa:villa_dev_password@localhost:5432/villa_test',
    ssl: false,
    maxConnections: 3,
    idleTimeout: 5,
    connectTimeout: 5,
    retryAttempts: 1,
    retryDelay: 100,
    enableFallback: true,
  },
  staging: {
    ssl: 'require',
    maxConnections: 15,
    idleTimeout: 20,
    connectTimeout: 10,
    retryAttempts: 5,
    retryDelay: 2000,
    enableFallback: false,
  },
  production: {
    ssl: 'require',
    maxConnections: 20,
    idleTimeout: 20,
    connectTimeout: 10,
    retryAttempts: 5,
    retryDelay: 2000,
    enableFallback: false,
  },
}

/**
 * Detect current environment
 */
export function detectEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development'
  const appEnv = process.env.APP_ENV

  // Explicit APP_ENV takes priority
  if (appEnv && appEnv in configs) {
    return appEnv as Environment
  }

  // Map NODE_ENV to our environments
  switch (env) {
    case 'production':
      return 'production'
    case 'test':
      return 'test'
    case 'staging':
      return 'staging'
    default:
      // Check if we're running in Docker
      if (process.env.DATABASE_URL?.includes('@postgres:')) {
        return 'local'
      }
      return 'development'
  }
}

/**
 * Get database configuration for current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const environment = detectEnvironment()
  const envConfig = configs[environment]

  // Environment variable overrides
  const url = process.env.DATABASE_URL || envConfig.url
  if (!url) {
    throw new Error(
      `DATABASE_URL not set and no default for environment: ${environment}`
    )
  }

  return {
    url,
    ssl: parseSsl(process.env.DATABASE_SSL) ?? envConfig.ssl ?? false,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '') || envConfig.maxConnections || 10,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '') || envConfig.idleTimeout || 20,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '') || envConfig.connectTimeout || 10,
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '') || envConfig.retryAttempts || 3,
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '') || envConfig.retryDelay || 1000,
    enableFallback: parseBool(process.env.DB_ENABLE_FALLBACK) ?? envConfig.enableFallback ?? false,
  }
}

/**
 * Parse SSL configuration
 */
function parseSsl(value: string | undefined): boolean | 'require' | 'prefer' | undefined {
  if (!value) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'require' || value === 'prefer') return value
  return undefined
}

/**
 * Parse boolean environment variable
 */
function parseBool(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  return value === 'true' || value === '1'
}

/**
 * Get connection URL for migrations (without pooling params)
 */
export function getMigrationUrl(): string {
  const config = getDatabaseConfig()
  return config.url
}

/**
 * Log configuration (with masked password)
 */
export function logConfig(): void {
  const config = getDatabaseConfig()
  const maskedUrl = config.url.replace(/:([^@]+)@/, ':****@')

  console.log('Database Configuration:')
  console.log(`  Environment: ${detectEnvironment()}`)
  console.log(`  URL: ${maskedUrl}`)
  console.log(`  SSL: ${config.ssl}`)
  console.log(`  Max Connections: ${config.maxConnections}`)
  console.log(`  Retry Attempts: ${config.retryAttempts}`)
  console.log(`  Fallback Enabled: ${config.enableFallback}`)
}
