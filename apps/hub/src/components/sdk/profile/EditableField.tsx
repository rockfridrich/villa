'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'

interface EditableFieldProps {
  /** Current value */
  value: string
  /** Called when save is triggered */
  onSave: (value: string) => Promise<void>
  /** Zod schema for validation */
  schema: z.ZodSchema<string>
  /** Placeholder text */
  placeholder?: string
  /** Maximum characters allowed */
  maxLength?: number
  /** Whether editing is disabled */
  disabled?: boolean
}

type EditState = 'viewing' | 'editing' | 'saving' | 'error'

/**
 * Inline editable field with validation
 */
export function EditableField({
  value,
  onSave,
  schema,
  placeholder = 'Enter value',
  maxLength = 50,
  disabled = false,
}: EditableFieldProps) {
  const [state, setState] = useState<EditState>('viewing')
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering edit mode
  useEffect(() => {
    if (state === 'editing' && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [state])

  // Reset edit value when external value changes
  useEffect(() => {
    if (state === 'viewing') {
      setEditValue(value)
    }
  }, [value, state])

  const handleEdit = () => {
    if (disabled) return
    setEditValue(value)
    setError(null)
    setState('editing')
  }

  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    setState('viewing')
  }

  const handleSave = async () => {
    // Validate
    const result = schema.safeParse(editValue)
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid value')
      return
    }

    // Skip if unchanged
    if (result.data === value) {
      setState('viewing')
      return
    }

    setState('saving')
    setError(null)

    try {
      await onSave(result.data)
      setState('viewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setState('error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (state === 'viewing') {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink font-medium truncate">
          {value || <span className="text-ink-muted italic">{placeholder}</span>}
        </span>
        {!disabled && (
          <motion.button
            onClick={handleEdit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-cream-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={state === 'saving'}
          className={`
            flex-1 px-3 py-2 rounded-lg border bg-white text-ink
            focus:outline-none focus:ring-2 focus:ring-villa-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-cream-300'}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? 'edit-field-error' : undefined}
        />

        <AnimatePresence mode="wait">
          {state === 'saving' ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="p-2"
            >
              <Loader2 className="w-5 h-5 text-villa-500 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
            >
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Save"
              >
                <Check className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character count */}
      <div className="flex justify-between items-center px-1">
        <AnimatePresence>
          {error && (
            <motion.span
              id="edit-field-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-500"
              role="alert"
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
        <span
          className={`text-xs ml-auto ${
            editValue.length >= maxLength ? 'text-red-500' : 'text-ink-muted'
          }`}
        >
          {editValue.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
