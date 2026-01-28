"use client";

import { useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Dices, Check } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui";
import { AvatarPreview } from "@/components/sdk/AvatarPreview";
import { createAvatarConfig } from "@/lib/avatar";
import type { AvatarStyleSelection, AvatarConfig } from "@/types";

interface AvatarPickerProps {
  walletAddress: string;
  currentAvatar?: AvatarConfig;
  onSelect: (config: AvatarConfig) => void;
  onCancel?: () => void;
}

const STYLE_OPTIONS: {
  value: AvatarStyleSelection;
  label: string;
}[] = [
  { value: "female", label: "Style A" },
  { value: "male", label: "Style B" },
  { value: "other", label: "Robots" },
];

export function AvatarPicker({
  walletAddress,
  currentAvatar,
  onSelect,
  onCancel,
}: AvatarPickerProps) {
  const [selection, setSelection] = useState<AvatarStyleSelection>(
    (currentAvatar && "selection" in currentAvatar
      ? currentAvatar.selection
      : null) || "female",
  );
  const [variant, setVariant] = useState(
    (currentAvatar && "variant" in currentAvatar
      ? currentAvatar.variant
      : null) || 0,
  );
  const [isRolling, setIsRolling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const handleRandomize = useCallback(() => {
    setIsRolling(true);
    setVariant((v) => v + 1);
    setTimeout(() => setIsRolling(false), 500);
  }, []);

  const handleStyleChange = useCallback(
    (newSelection: AvatarStyleSelection) => {
      setSelection(newSelection);
      setVariant(0);
    },
    [],
  );

  const handleSave = useCallback(() => {
    setIsSaving(true);
    const config = createAvatarConfig(selection, variant);
    onSelect(config);
  }, [selection, variant, onSelect]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={
            !shouldReduceMotion
              ? {
                  scale: isRolling ? [1, 1.05, 1] : 1,
                  rotate: isRolling ? [0, -2, 2, -2, 0] : 0,
                }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          <AvatarPreview
            walletAddress={walletAddress}
            selection={selection}
            variant={variant}
            size={140}
            className="shadow-lg rounded-full ring-4 ring-cream-200"
          />
        </motion.div>

        <motion.button
          onClick={handleRandomize}
          disabled={isSaving}
          whileHover={!shouldReduceMotion ? { scale: 1.05 } : {}}
          whileTap={!shouldReduceMotion ? { scale: 0.95 } : {}}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 min-h-11",
            "bg-white border border-cream-200 rounded-full",
            "text-sm font-medium text-ink",
            "hover:shadow-sm transition-shadow duration-150",
            "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <motion.div
            animate={
              isRolling && !shouldReduceMotion ? { rotate: 360 } : { rotate: 0 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Dices className="w-4 h-4" />
          </motion.div>
          Shuffle
        </motion.button>
      </div>

      <div className="flex gap-2 justify-center">
        {STYLE_OPTIONS.map((option) => {
          const isActive = selection === option.value;

          return (
            <button
              key={option.value}
              onClick={() => handleStyleChange(option.value)}
              disabled={isSaving}
              className={clsx(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl min-h-11 min-w-[80px]",
                "transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isActive
                  ? "bg-accent-yellow border-2 border-accent-brown shadow-sm"
                  : "bg-cream-100 border-2 border-transparent hover:border-cream-200",
              )}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-200">
                <AvatarPreview
                  walletAddress={walletAddress}
                  selection={option.value}
                  variant={0}
                  size={40}
                />
              </div>
              <span className="text-xs font-medium text-ink">
                {option.label}
              </span>
              {isActive && (
                <Check className="absolute top-1 right-1 w-4 h-4 text-accent-brown" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Avatar"}
        </Button>
      </div>
    </div>
  );
}
