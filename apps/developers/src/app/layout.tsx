import type { Metadata } from 'next'
import './globals.css'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'

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
      <body>
        <Header />
        <div className="max-w-7xl mx-auto flex gap-8 px-6">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  )
}
