'use client'

import { useState, useCallback } from 'react'
import { X, Lock, Camera, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui'
import { AvatarPreview } from './AvatarPreview'
import { AvatarSelection } from './AvatarSelection'
import { AvatarUpload } from './AvatarUpload'
import { ProfileSection, EditableField } from './profile'
import { displayNameSchema, nicknameSchema } from '@/lib/validation'
import { avatarStorage, type CustomAvatar } from '@/lib/storage/tinycloud'
import type { AvatarConfig } from '@/types'

/** Profile data structure */
export interface ProfileData {
  address: string
  nickname: string | null
  displayName: string
  avatar: AvatarConfig | CustomAvatar
  /** Whether user can change their nickname (limited changes allowed) */
  canChangeNickname?: boolean
  /** Number of times nickname has been changed */
  nicknameChangeCount?: number
}

/** Profile update payload */
export interface ProfileUpdate {
  displayName?: string
  avatar?: AvatarConfig | CustomAvatar
  nickname?: string
}

export interface ProfileSettingsProps {
  /** User's current profile */
  profile: ProfileData
  /** Callback when profile is updated */
  onUpdate: (updates: ProfileUpdate) => Promise<void>
  /** Optional: close handler */
  onClose?: () => void
  /** Feature flag: enable avatar upload */
  allowAvatarUpload?: boolean
  /** Feature flag: show as modal or inline */
  asModal?: boolean
}

type SettingsView = 'overview' | 'edit-avatar' | 'upload-avatar'

/**
 * Profile settings component
 * Allows users to edit their display name and avatar after onboarding
 */
export function ProfileSettings({
  profile,
  onUpdate,
  onClose,
  allowAvatarUpload = true,
  asModal = true,
}: ProfileSettingsProps) {
  const [view, setView] = useState<SettingsView>('overview')

  // Check if avatar is custom uploaded
  const isCustomAvatar = profile.avatar && 'type' in profile.avatar && profile.avatar.type === 'custom'
  const customAvatar = isCustomAvatar ? (profile.avatar as CustomAvatar) : null
  const generatedAvatar = !isCustomAvatar ? (profile.avatar as AvatarConfig) : null

  const handleDisplayNameSave = async (newName: string) => {
    await onUpdate({ displayName: newName })
  }

  const handleNicknameSave = async (newNickname: string) => {
    await onUpdate({ nickname: newNickname })
  }

  const handleAvatarSelect = async (config: AvatarConfig) => {
    // Clear custom avatar if switching to generated
    await avatarStorage.delete()
    await onUpdate({ avatar: config })
    setView('overview')
  }

  const handleAvatarUpload = async (avatar: CustomAvatar) => {
    // Save to storage
    await avatarStorage.save(avatar)
    await onUpdate({ avatar })
    setView('overview')
  }

  const handleBack = useCallback(() => {
    setView('overview')
  }, [])

  // Content based on view
  const renderContent = () => {
    // Avatar selection view
    if (view === 'edit-avatar') {
      return (
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <AvatarSelection
            walletAddress={profile.address}
            onSelect={handleAvatarSelect}
            timerDuration={0} // No timer in settings
          />

          {allowAvatarUpload && (
            <>
              <div className="relative flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-cream-200" />
                <span className="text-xs text-ink-muted">or</span>
                <div className="flex-1 h-px bg-cream-200" />
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setView('upload-avatar')}
              >
                <Camera className="w-4 h-4 mr-2" />
                Upload Your Own Photo
              </Button>
            </>
          )}
        </div>
      )
    }

    // Avatar upload view
    if (view === 'upload-avatar') {
      return (
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <AvatarUpload
            onUpload={handleAvatarUpload}
            onCancel={handleBack}
          />
        </div>
      )
    }

    // Overview view (default)
    return (
      <div className="space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {customAvatar ? (
              <img
                src={customAvatar.dataUrl}
                alt="Your avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-cream-200"
              />
            ) : generatedAvatar ? (
              <AvatarPreview
                walletAddress={profile.address}
                selection={generatedAvatar.selection}
                variant={generatedAvatar.variant}
                size={128}
                className="border-4 border-cream-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-cream-200 flex items-center justify-center">
                <Camera className="w-8 h-8 text-ink-muted" />
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setView('edit-avatar')}
          >
            <Camera className="w-4 h-4 mr-2" />
            Change Avatar
          </Button>
        </div>

        <div className="h-px bg-cream-200" />

        {/* Nickname section - editable if allowed */}
        <ProfileSection
          label="Nickname"
          helperText={
            profile.canChangeNickname
              ? `You can change your nickname ${1 - (profile.nicknameChangeCount ?? 0)} more time(s)`
              : "Your nickname is permanent. You've used your one-time change."
          }
          disabled={!profile.canChangeNickname}
        >
          {profile.canChangeNickname ? (
            <EditableField
              value={profile.nickname || ''}
              onSave={handleNicknameSave}
              schema={nicknameSchema}
              placeholder="Enter your nickname"
              maxLength={30}
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-ink font-medium">
                {profile.nickname || <span className="text-ink-muted italic">Not set</span>}
              </span>
              <Lock className="w-4 h-4 text-ink-muted" />
            </div>
          )}
        </ProfileSection>

        {/* Display name section (editable) */}
        <ProfileSection label="Display Name">
          <EditableField
            value={profile.displayName}
            onSave={handleDisplayNameSave}
            schema={displayNameSchema}
            placeholder="Enter your name"
            maxLength={50}
          />
        </ProfileSection>

        <div className="h-px bg-cream-200" />

        {/* Wallet address (read-only info) */}
        <ProfileSection
          label="Wallet Address"
          helperText="Your unique identifier on the blockchain"
          disabled
        >
          <div className="flex items-center justify-between">
            <code className="text-xs text-ink-muted font-mono truncate max-w-[200px]">
              {profile.address}
            </code>
            <Lock className="w-4 h-4 text-ink-muted" />
          </div>
        </ProfileSection>
      </div>
    )
  }

  // Modal wrapper
  if (asModal) {
    return (
      <Dialog.Root open onOpenChange={(open) => !open && onClose?.()}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
            />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed inset-x-4 top-[10%] bottom-auto md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full bg-cream rounded-2xl shadow-xl z-50 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-cream border-b border-cream-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <Dialog.Title className="text-lg font-serif text-ink">
                  {view === 'overview'
                    ? 'Profile Settings'
                    : view === 'edit-avatar'
                      ? 'Change Avatar'
                      : 'Upload Photo'}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-cream-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, x: view === 'overview' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: view === 'overview' ? 20 : -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  // Inline mode (no modal wrapper)
  return (
    <div className="bg-cream rounded-2xl border border-cream-200 overflow-hidden">
      <div className="border-b border-cream-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-serif text-ink">
          {view === 'overview'
            ? 'Profile Settings'
            : view === 'edit-avatar'
              ? 'Change Avatar'
              : 'Upload Photo'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-cream-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === 'overview' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === 'overview' ? 20 : -20 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
