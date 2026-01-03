import { NextResponse } from 'next/server'

/**
 * Health check endpoint for monitoring and debugging
 * Used by ngrok scripts to verify the app is running
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  })
}
