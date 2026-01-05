import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Villa SDK - Developer Documentation',
  description: 'One-prompt authentication for pop-up villages. Passkeys. No passwords. Privacy-first.',
  openGraph: {
    title: 'Villa SDK',
    description: 'One-prompt authentication for pop-up villages',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
