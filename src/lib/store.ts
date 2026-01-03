import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Identity, identitySchema, displayNameSchema } from './validation'

interface IdentityStore {
  identity: Identity | null
  setIdentity: (identity: Identity) => boolean
  updateProfile: (displayName: string, avatar?: string) => boolean
  clearIdentity: () => void
}

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set, get) => ({
      identity: null,

      setIdentity: (identity: Identity) => {
        // Validate before storing
        const result = identitySchema.safeParse(identity)
        if (result.success) {
          set({ identity: result.data })
          return true
        }
        // Return false on validation failure - no logging to avoid PII leaks
        return false
      },

      updateProfile: (displayName: string, avatar?: string) => {
        const current = get().identity
        if (!current) return false

        // Validate display name
        const nameResult = displayNameSchema.safeParse(displayName)
        if (!nameResult.success) {
          // Return false on validation failure - no logging to avoid PII leaks
          return false
        }

        set({
          identity: {
            ...current,
            displayName: nameResult.data,
            avatar: avatar ?? current.avatar,
          },
        })
        return true
      },

      clearIdentity: () => {
        set({ identity: null })
      },
    }),
    {
      name: 'villa-identity',
    }
  )
)
