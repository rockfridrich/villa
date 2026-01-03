import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Identity, identitySchema, displayNameSchema } from './validation'

interface IdentityStore {
  identity: Identity | null
  setIdentity: (identity: Identity) => void
  updateProfile: (displayName: string, avatar?: string) => void
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
        } else {
          console.error('Invalid identity:', result.error)
        }
      },

      updateProfile: (displayName: string, avatar?: string) => {
        const current = get().identity
        if (!current) return

        // Validate display name
        const nameResult = displayNameSchema.safeParse(displayName)
        if (!nameResult.success) {
          console.error('Invalid display name:', nameResult.error)
          return
        }

        set({
          identity: {
            ...current,
            displayName: nameResult.data,
            avatar: avatar ?? current.avatar,
          },
        })
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
