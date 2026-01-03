import type { Metadata, Viewport } from 'next'
import { Providers } from '@/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Villa',
  description: 'Your identity. No passwords.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
