'use client'

import { VillaProvider } from '@rockfridrich/villa-sdk-react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VillaProvider
      config={{
        appId: 'nextjs-example',
        network: 'base-sepolia',
      }}
    >
      {children}
    </VillaProvider>
  )
}
