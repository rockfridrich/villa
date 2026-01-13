'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'

interface NicknameSelectionProps {
  /** Callback when nickname is claimed */
  onClaim: (nickname: string) => Promise<void>
  /** Optional availability checker (defaults to mock that returns available) */
  checkAvailability?: (nickname: string) => Promise<{ available: boolean; suggestions?: string[] }>
}

type ValidationState = 'empty' | 'typing' | 'available' | 'taken' | 'invalid' | 'claiming' | 'error'

interface ValidationResult {
  state: ValidationState
  message: string
  suggestions?: string[]
}

// Generate smart suggestions when nickname is taken
function generateSuggestions(nickname: string, count: number = 3): string[] {
  const suggestions: string[] = []

  // Add numbered suffixes
  suggestions.push(`${nickname}${Math.floor(Math.random() * 900 + 100)}`)

  // Add underscore variants
  suggestions.push(`${nickname}_v`)
  suggestions.push(`${nickname}_cash`)

  return suggestions.slice(0, count)
}

/**
 * Nickname selection component with real-time availability checking
 * Per spec: 300ms debounce, auto-lowercase, alphanumeric only, 3-30 chars
 *
 * Improvements:
 * - Shake animation on invalid input
 * - Success checkmark animation
 * - Character counter with color coding
 * - Smart suggestions when taken
 * - Keyboard shortcuts (Enter to claim, Escape to clear)
 * - Auto-retry on network errors
 * - Accessibility enhancements
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
  const [retryCount, setRetryCount] = useState(0)
  const [showShakeAnimation, setShowShakeAnimation] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    async (nickname: string, isRetry: boolean = false) => {
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
          setRetryCount(0)
        } else {
          const suggestions = 'suggestions' in result ? result.suggestions : undefined
          setValidation({
            state: 'taken',
            message: `@${nickname} is already taken`,
            suggestions: suggestions || generateSuggestions(nickname),
          })
          setRetryCount(0)
        }
      } catch (error) {
        if (!isMounted.current) return

        // Auto-retry on network errors (max 2 attempts)
        if (!isRetry && retryCount < 2) {
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            checkNicknameAvailability(nickname, true)
          }, 1000)
          setValidation({
            state: 'typing',
            message: 'Retrying...',
          })
        } else {
          setValidation({
            state: 'error',
            message: 'Could not check availability. Try again.',
          })
          setRetryCount(0)
        }
      }
    },
    [checkAvailability, retryCount]
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
      // Trigger shake animation on invalid input
      if (formatError.state === 'invalid' && !prefersReducedMotion) {
        setShowShakeAnimation(true)
        setTimeout(() => setShowShakeAnimation(false), 500)
      }
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
        state: 'error',
        message: 'Something went wrong. Try again.',
      })
    }
  }, [input, validation.state, isClaiming, onClaim])

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validation.state === 'available' && !isClaiming) {
      e.preventDefault()
      handleClaim()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInput('')
      setValidation({
        state: 'empty',
        message: 'This is how others will find you',
      })
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } else if (e.key === 'Tab' && validation.state === 'available') {
      // Let default Tab behavior focus button
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Show "typing" state immediately
    setValidation({
      state: 'typing',
      message: 'Checking...',
    })

    // Check availability
    debounceTimer.current = setTimeout(() => {
      checkNicknameAvailability(suggestion)
    }, 300)
  }

  // Handle retry on error
  const handleRetry = () => {
    if (input.length >= 3) {
      setValidation({
        state: 'typing',
        message: 'Checking...',
      })
      checkNicknameAvailability(input)
    }
  }

  // Render icon based on validation state with animations
  const renderIcon = () => {
    const iconVariants = prefersReducedMotion
      ? {}
      : {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 },
        }

    switch (validation.state) {
      case 'typing':
        return (
          <motion.div key="typing" {...iconVariants}>
            <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
          </motion.div>
        )
      case 'available':
        return (
          <motion.div
            key="available"
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={prefersReducedMotion ? {} : { scale: [0, 1.2, 1] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Check className="w-5 h-5 text-green-500" />
          </motion.div>
        )
      case 'taken':
      case 'invalid':
      case 'error':
        return (
          <motion.div key="error" {...iconVariants}>
            <X className="w-5 h-5 text-red-500" />
          </motion.div>
        )
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
      case 'error':
        return 'text-red-600'
      default:
        return 'text-ink-muted'
    }
  })()

  // Character counter color based on length
  const getCharCountColor = () => {
    if (input.length === 0) return 'text-ink-muted'
    if (input.length < 3) return 'text-red-500'
    if (input.length <= 30) return 'text-green-600'
    return 'text-red-500'
  }

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
          animate={
            showShakeAnimation && !prefersReducedMotion
              ? {
                  opacity: 1,
                  y: 0,
                  x: [-10, 10, -10, 10, -5, 5, 0],
                }
              : { opacity: 1, y: 0, x: 0 }
          }
          transition={
            showShakeAnimation
              ? { duration: 0.5 }
              : { duration: 0.3 }
          }
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
              onKeyDown={handleKeyDown}
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
              aria-label="Nickname input"
              aria-invalid={validation.state === 'invalid' || validation.state === 'error'}
              aria-describedby="nickname-helper"
            />

            {/* Status icon */}
            <div className="absolute right-4 flex items-center">
              <AnimatePresence mode="wait">
                {renderIcon()}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Character counter */}
        {input.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {/* Helper text */}
              <motion.p
                id="nickname-helper"
                className={`text-sm ${helperColor} min-h-[20px]`}
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                key={validation.message}
                role="status"
                aria-live="polite"
              >
                {validation.message}
              </motion.p>
            </div>
            <div className={`text-xs ${getCharCountColor()} ml-2`}>
              {input.length}/30
            </div>
          </div>
        )}

        {/* Empty state helper */}
        {input.length === 0 && (
          <motion.p
            id="nickname-helper"
            className={`text-sm ${helperColor} min-h-[20px]`}
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
          >
            {validation.message}
          </motion.p>
        )}

        {/* Smart suggestions when taken */}
        {validation.state === 'taken' && validation.suggestions && validation.suggestions.length > 0 && (
          <motion.div
            className="bg-cream-100 rounded-lg p-3 border border-cream-200"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-ink-muted mb-2">Try these instead:</p>
            <div className="flex flex-wrap gap-2">
              {validation.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="
                    px-3 py-1 text-sm bg-cream-50 text-ink
                    border border-cream-200 rounded-md
                    hover:bg-accent-yellow hover:border-accent-yellow
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-accent-yellow
                  "
                  type="button"
                >
                  @{suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error recovery */}
        {validation.state === 'error' && (
          <motion.div
            className="bg-red-50 rounded-lg p-3 border border-red-200"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-red-700 mb-2">{validation.message}</p>
            <button
              onClick={handleRetry}
              className="
                text-sm text-red-700 font-medium underline
                hover:text-red-800
                focus:outline-none focus:ring-2 focus:ring-red-500 rounded
              "
              type="button"
            >
              Try again
            </button>
          </motion.div>
        )}
      </div>

      {/* Claim button */}
      <Button
        ref={buttonRef}
        size="lg"
        className="w-full"
        onClick={handleClaim}
        disabled={!isButtonEnabled}
        aria-label={
          isClaiming
            ? 'Claiming nickname'
            : validation.state === 'available'
            ? `Claim @${input}`
            : 'Continue'
        }
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

      {/* Keyboard hints */}
      <p className="text-xs text-ink-muted text-center">
        Press <kbd className="px-1.5 py-0.5 bg-cream-100 rounded border border-cream-200 font-mono">Enter</kbd> to claim
        {' • '}
        <kbd className="px-1.5 py-0.5 bg-cream-100 rounded border border-cream-200 font-mono">Esc</kbd> to clear
      </p>
    </div>
  )
}
