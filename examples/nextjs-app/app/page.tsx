'use client'

import { useIdentity, useAuth, Avatar, VillaAuth } from '@rockfridrich/villa-sdk-react'
import type { VillaAuthResponse } from '@rockfridrich/villa-sdk-react'

export default function HomePage() {
  const identity = useIdentity()
  const { signOut, isLoading } = useAuth()

  const handleAuthComplete = (result: VillaAuthResponse) => {
    if (result.success) {
      console.log('Successfully authenticated:', result.identity)
    } else {
      console.error('Authentication failed:', result.error)
    }
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="card">
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (!identity) {
    return (
      <main className="container">
        <div className="card">
          <h1>Welcome to Villa</h1>
          <p className="subtitle">
            Privacy-first passkey authentication on Base network
          </p>
          <VillaAuth onComplete={handleAuthComplete} />
          <p className="help-text">
            Click to create your Villa ID using passkeys - no passwords needed!
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="card">
        <div className="profile">
          <Avatar identity={identity} size={80} />
          <div className="profile-info">
            <h1>Welcome back!</h1>
            <p className="nickname">@{identity.nickname}</p>
            <p className="address">{identity.address.slice(0, 6)}...{identity.address.slice(-4)}</p>
          </div>
        </div>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
    </main>
  )
}
