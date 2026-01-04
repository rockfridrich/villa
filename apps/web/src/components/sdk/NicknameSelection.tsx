'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

interface NicknameSelectionProps {
  /** Callback when nickname is claimed */
  onClaim: (nickname: string) => Promise<void>
  /** Optional availability checker (defaults to mock that returns available) */
  checkAvailability?: (nickname: string) => Promise<{ available: boolean; suggestion?: string }>
}

type ValidationState = 'empty' | 'typing' | 'available' | 'taken' | 'invalid' | 'claiming'

interface ValidationResult {
  state: ValidationState
  message: string
}

/**
 * Nickname selection component with real-time availability checking
 * Per spec: 300ms debounce, auto-lowercase, alphanumeric only, 3-30 chars
 */
export function NicknameSelection({
  onClaim,
  checkAvailability,
}: NicknameSelectionProps) {
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState<ValidationResult>({
    state: 'empty',
    message: 'This is how others will find you',
  })
  const [isClaiming, setIsClaiming] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Normalize input: lowercase, alphanumeric only
  const normalizeInput = (value: string): string => {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  // Validate nickname format (client-side)
  const validateFormat = (nickname: string): ValidationResult | null => {
    if (nickname.length === 0) {
      return {
        state: 'empty',
        message: 'This is how others will find you',
      }
    }

    if (nickname.length < 3) {
      return {
        state: 'invalid',
        message: 'Handle must be at least 3 characters',
      }
    }

    if (nickname.length > 30) {
      return {
        state: 'invalid',
        message: 'Handle must be 30 characters or less',
      }
    }

    // Only alphanumeric check (normalization handles this, but double-check)
    if (!/^[a-z0-9]+$/.test(nickname)) {
      return {
        state: 'invalid',
        message: 'Only letters and numbers allowed',
      }
    }

    return null // Valid format
  }

  // Check availability with API or mock
  const checkNicknameAvailability = useCallback(
    async (nickname: string) => {
      if (!isMounted.current) return

      // Use provided checker or default mock
      const checker = checkAvailability || (async () => ({ available: true }))

      try {
        const result = await checker(nickname)

        if (!isMounted.current) return

        if (result.available) {
          setValidation({
            state: 'available',
            message: `@${nickname} is available!`,
          })
        } else {
          setValidation({
            state: 'taken',
            message: `@${nickname} is already taken`,
          })
        }
      } catch (error) {
        if (!isMounted.current) return

        setValidation({
          state: 'invalid',
          message: 'Could not check availability. Try again.',
        })
      }
    },
    [checkAvailability]
  )

  // Handle input change with debounced availability check
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const normalized = normalizeInput(raw)

    setInput(normalized)

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Validate format first
    const formatError = validateFormat(normalized)
    if (formatError) {
      setValidation(formatError)
      return
    }

    // Show "typing" state immediately
    setValidation({
      state: 'typing',
      message: 'Checking...',
    })

    // Debounce availability check (300ms)
    debounceTimer.current = setTimeout(() => {
      checkNicknameAvailability(normalized)
    }, 300)
  }

  // Handle claim button click
  const handleClaim = useCallback(async () => {
    if (validation.state !== 'available' || isClaiming) return

    setIsClaiming(true)
    setValidation({
      state: 'claiming',
      message: 'Claiming...',
    })

    try {
      await onClaim(input)
    } catch (error) {
      if (!isMounted.current) return

      setIsClaiming(false)
      setValidation({
        state: 'invalid',
        message: 'Something went wrong. Try again.',
      })
    }
  }, [input, validation.state, isClaiming, onClaim])

  // Render icon based on validation state
  const renderIcon = () => {
    switch (validation.state) {
      case 'typing':
        return <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
      case 'available':
        return <Check className="w-5 h-5 text-green-500" />
      case 'taken':
      case 'invalid':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  // Helper text color based on state
  const helperColor = (() => {
    switch (validation.state) {
      case 'available':
        return 'text-green-600'
      case 'taken':
      case 'invalid':
        return 'text-red-600'
      default:
        return 'text-ink-muted'
    }
  })()

  // Button enabled only when available and not claiming
  const isButtonEnabled = validation.state === 'available' && !isClaiming

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Choose your @handle</h2>
        <p className="text-ink-muted text-sm">
          This is how others will find you
        </p>
      </div>

      {/* Input field with @ prefix and status icon */}
      <div className="space-y-2">
        <motion.div
          className="relative"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex items-center">
            {/* @ prefix */}
            <span className="absolute left-4 text-ink text-base pointer-events-none">
              @
            </span>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isClaiming}
              placeholder="yourname"
              className="
                w-full min-h-11 pl-9 pr-12 py-2 text-base
                bg-cream-50 border-2 border-cream-200
                rounded-lg text-ink placeholder:text-ink-muted
                focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
              "
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              maxLength={30}
            />

            {/* Status icon */}
            <div className="absolute right-4 flex items-center">
              {renderIcon()}
            </div>
          </div>
        </motion.div>

        {/* Helper text */}
        <motion.p
          className={`text-sm ${helperColor} min-h-[20px]`}
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          key={validation.message}
        >
          {validation.message}
        </motion.p>
      </div>

      {/* Claim button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleClaim}
        disabled={!isButtonEnabled}
      >
        {isClaiming ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Claiming...
          </span>
        ) : validation.state === 'available' ? (
          `Claim @${input}`
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  )
}
