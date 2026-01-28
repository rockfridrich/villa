"use client";

import { useState, useCallback } from "react";
import { Dices, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui";
import {
  generateAvatarDataUrlFromSeed,
  generateRandomSeed,
} from "@/lib/avatar/dicebear";
import type { AvatarStyle, NewAvatarConfig } from "@/types";

interface AvatarPickerProps {
  onSelect: (config: NewAvatarConfig) => void;
  initialStyle?: AvatarStyle;
  initialSeed?: string;
}

const AVATAR_STYLES: {
  style: AvatarStyle;
  label: string;
  description: string;
}[] = [
  {
    style: "lorelei",
    label: "Lorelei",
    description: "Hand-drawn style portraits",
  },
  {
    style: "adventurer",
    label: "Adventurer",
    description: "Adventure-themed characters",
  },
  {
    style: "avataaars",
    label: "Avataaars",
    description: "Classic avatar style",
  },
  { style: "web3", label: "Web3", description: "Pixel art crypto style" },
];

export function AvatarPicker({
  onSelect,
  initialStyle = "lorelei",
  initialSeed,
}: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(initialStyle);
  const [seed, setSeed] = useState(initialSeed || generateRandomSeed());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const handleStyleChange = (style: AvatarStyle) => {
    setSelectedStyle(style);
    setSeed(generateRandomSeed());
  };

  const handleRandomize = () => {
    setIsRolling(true);
    setSeed(generateRandomSeed());
    setTimeout(() => setIsRolling(false), 500);
  };

  const handleSelect = useCallback(() => {
    if (isSelecting) return;
    setIsSelecting(true);

    const config: NewAvatarConfig = {
      style: selectedStyle,
      seed: seed,
    };
    onSelect(config);
  }, [selectedStyle, seed, onSelect, isSelecting]);

  const currentAvatarUrl = generateAvatarDataUrlFromSeed(selectedStyle, seed);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Pick your avatar style</h2>
        <p className="text-ink-muted text-sm">
          Choose a style and generate your unique avatar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {AVATAR_STYLES.map((option) => (
          <motion.button
            key={option.style}
            onClick={() => handleStyleChange(option.style)}
            disabled={isSelecting}
            whileHover={
              !isSelecting && !shouldReduceMotion ? { scale: 1.02, y: -1 } : {}
            }
            whileTap={
              !isSelecting && !shouldReduceMotion ? { scale: 0.98 } : {}
            }
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
              relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all min-h-11
              ${
                selectedStyle === option.style
                  ? "bg-accent-yellow border-2 border-accent-brown shadow-md"
                  : "bg-cream-100 border-2 border-transparent hover:border-cream-300"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {selectedStyle === option.style && !shouldReduceMotion && (
              <motion.div
                layoutId="style-glow"
                className="absolute inset-0 rounded-xl bg-accent-yellow opacity-50 blur-md"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-cream-200 shadow-sm mb-2 mx-auto">
                <img
                  src={generateAvatarDataUrlFromSeed(option.style, "preview")}
                  alt={option.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-ink">
                  {option.label}
                </div>
                <div className="text-xs text-ink-muted">
                  {option.description}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
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
            <img
              src={currentAvatarUrl}
              alt="Your avatar preview"
              className="w-40 h-40 rounded-full shadow-lg bg-cream-100"
            />
          </motion.div>
        </div>

        <motion.button
          onClick={handleRandomize}
          disabled={isSelecting}
          aria-label="Generate new avatar"
          whileHover={
            !isSelecting && !shouldReduceMotion ? { scale: 1.05 } : {}
          }
          whileTap={!isSelecting && !shouldReduceMotion ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`
            group flex items-center gap-3 px-6 py-3 min-h-11
            bg-white border border-cream-200
            text-ink font-semibold rounded-full
            shadow-sm hover:shadow-md
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <motion.div
            animate={
              isRolling && !shouldReduceMotion ? { rotate: 360 } : { rotate: 0 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Dices className="w-5 h-5" />
          </motion.div>
          <span>Generate New</span>
          <Sparkles className="w-4 h-4 opacity-60" />
        </motion.button>
      </div>

      <Button
        size="lg"
        className="w-full min-h-11"
        onClick={handleSelect}
        disabled={isSelecting}
      >
        {isSelecting ? "Saving..." : "Save Avatar"}
      </Button>
    </div>
  );
}
