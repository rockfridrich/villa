/**
 * Developer Preferences Schema
 *
 * Defines the structure for both shared defaults and local overrides.
 * Shared defaults are checked in; local preferences are gitignored.
 */

export interface DeveloperPreferences {
  /**
   * How Claude should communicate with this developer
   */
  communication: {
    /** How verbose responses should be */
    verbosity: 'concise' | 'detailed' | 'adaptive';
    /** How much to explain code changes */
    explanations: 'brief' | 'thorough' | 'on-request';
    /** Communication tone */
    tone: 'direct' | 'friendly' | 'professional';
    /** Whether to use technical jargon freely */
    technicalLevel: 'beginner' | 'intermediate' | 'expert';
  };

  /**
   * How Claude should work with this developer
   */
  workflow: {
    /** How aggressively to parallelize work */
    parallelism: 'aggressive' | 'conservative' | 'ask';
    /** How much autonomy Claude should take */
    autonomy: 'high' | 'medium' | 'low';
    /** How often to check in with progress */
    checkpoints: 'frequent' | 'milestone' | 'minimal';
    /** Whether to proactively suggest improvements */
    proactiveSuggestions: boolean;
  };

  /**
   * Model preferences for different tasks
   */
  models: {
    /** Default model when not specified */
    default: 'opus' | 'sonnet' | 'haiku';
    /** Per-agent overrides */
    agents: Partial<Record<string, 'opus' | 'sonnet' | 'haiku'>>;
  };

  /**
   * Areas this developer focuses on
   */
  focus: {
    /** Primary areas of expertise/interest */
    areas: string[];
    /** Current sprint or project focus */
    currentFocus?: string;
    /** Files/directories this dev owns */
    ownedPaths?: string[];
  };

  /**
   * Learning and adaptation settings
   */
  learning: {
    /** Allow Claude to learn from interactions */
    enableLearning: boolean;
    /** Share anonymized patterns to improve shared defaults */
    shareAnonymousPatterns: boolean;
    /** Allow Claude to ask clarifying questions about preferences */
    allowPreferenceQuestions: boolean;
  };
}

/**
 * A question Claude wants to ask the developer
 */
export interface PreferenceQuestion {
  id: string;
  question: string;
  context?: string;
  options?: string[];
  category: keyof DeveloperPreferences;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

/**
 * An observation Claude made about developer preferences
 */
export interface PreferenceObservation {
  id: string;
  pattern: string;
  inference: string;
  confidence: number; // 0-1
  observedAt: string;
  confirmedByUser?: boolean;
}

/**
 * Local learning state (gitignored)
 */
export interface LearningState {
  /** Pending questions to ask */
  pendingQuestions: PreferenceQuestion[];
  /** Questions that have been answered */
  answeredQuestions: Array<PreferenceQuestion & { answer: string; answeredAt: string }>;
  /** Observations from interactions */
  observations: PreferenceObservation[];
  /** Preferences confirmed from observations */
  confirmedPreferences: Partial<DeveloperPreferences>;
}
