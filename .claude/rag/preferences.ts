/**
 * Preferences Loader
 *
 * Loads and merges developer preferences from:
 * 1. Shared defaults (.claude/shared/defaults.json)
 * 2. Local overrides (.claude/local/preferences.json)
 * 3. Learned preferences (.claude/local/learning.json)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  DeveloperPreferences,
  LearningState,
  PreferenceQuestion,
  PreferenceObservation,
} from '../shared/preferences.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLAUDE_DIR = dirname(__dirname);

const SHARED_DEFAULTS_PATH = join(CLAUDE_DIR, 'shared', 'defaults.json');
const LOCAL_PREFS_PATH = join(CLAUDE_DIR, 'local', 'preferences.json');
const LEARNING_PATH = join(CLAUDE_DIR, 'local', 'learning.json');

/**
 * Deep merge two objects, with source overriding target
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          (target[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        ) as T[typeof key];
      } else {
        result[key] = source[key] as T[typeof key];
      }
    }
  }
  return result;
}

/**
 * Load shared defaults
 */
export function loadSharedDefaults(): DeveloperPreferences {
  const content = readFileSync(SHARED_DEFAULTS_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load local preferences if they exist
 */
export function loadLocalPreferences(): Partial<DeveloperPreferences> | null {
  if (!existsSync(LOCAL_PREFS_PATH)) {
    return null;
  }
  const content = readFileSync(LOCAL_PREFS_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load learning state if it exists
 */
export function loadLearningState(): LearningState {
  if (!existsSync(LEARNING_PATH)) {
    return {
      pendingQuestions: [],
      answeredQuestions: [],
      observations: [],
      confirmedPreferences: {},
    };
  }
  const content = readFileSync(LEARNING_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save learning state
 */
export function saveLearningState(state: LearningState): void {
  writeFileSync(LEARNING_PATH, JSON.stringify(state, null, 2));
}

/**
 * Get effective preferences (merged: defaults + local + learned)
 */
export function getEffectivePreferences(): DeveloperPreferences {
  const defaults = loadSharedDefaults();
  const local = loadLocalPreferences();
  const learning = loadLearningState();

  // Start with defaults
  let prefs = { ...defaults };

  // Apply local overrides
  if (local) {
    prefs = deepMerge(prefs, local);
  }

  // Apply learned preferences (highest priority for confirmed ones)
  if (learning.confirmedPreferences) {
    prefs = deepMerge(prefs, learning.confirmedPreferences as Partial<DeveloperPreferences>);
  }

  return prefs;
}

/**
 * Add a question for the developer
 */
export function addQuestion(question: Omit<PreferenceQuestion, 'id' | 'createdAt'>): void {
  const state = loadLearningState();
  const newQuestion: PreferenceQuestion = {
    ...question,
    id: `q-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state.pendingQuestions.push(newQuestion);
  saveLearningState(state);
}

/**
 * Record an observation about developer preferences
 */
export function addObservation(observation: Omit<PreferenceObservation, 'id' | 'observedAt'>): void {
  const state = loadLearningState();
  const newObs: PreferenceObservation = {
    ...observation,
    id: `obs-${Date.now()}`,
    observedAt: new Date().toISOString(),
  };
  state.observations.push(newObs);
  saveLearningState(state);
}

/**
 * Get pending questions to ask
 */
export function getPendingQuestions(): PreferenceQuestion[] {
  const state = loadLearningState();
  return state.pendingQuestions;
}

/**
 * Mark a question as answered
 */
export function answerQuestion(questionId: string, answer: string): void {
  const state = loadLearningState();
  const idx = state.pendingQuestions.findIndex((q) => q.id === questionId);
  if (idx !== -1) {
    const question = state.pendingQuestions.splice(idx, 1)[0];
    state.answeredQuestions.push({
      ...question,
      answer,
      answeredAt: new Date().toISOString(),
    });
    saveLearningState(state);
  }
}

/**
 * Confirm an observation as a preference
 */
export function confirmObservation(
  observationId: string,
  preferencePath: string,
  value: unknown
): void {
  const state = loadLearningState();
  const obs = state.observations.find((o) => o.id === observationId);
  if (obs) {
    obs.confirmedByUser = true;
    // Set nested preference using path like "communication.verbosity"
    const parts = preferencePath.split('.');
    let current: Record<string, unknown> = state.confirmedPreferences as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
    saveLearningState(state);
  }
}

/**
 * Generate a preferences report
 */
export function generatePreferencesReport(): string {
  const defaults = loadSharedDefaults();
  const local = loadLocalPreferences();
  const learning = loadLearningState();
  const effective = getEffectivePreferences();

  let report = '# Developer Preferences Report\n\n';

  report += '## Effective Preferences\n\n';
  report += '```json\n' + JSON.stringify(effective, null, 2) + '\n```\n\n';

  report += '## Sources\n\n';
  report += `- Shared defaults: ✅ Loaded\n`;
  report += `- Local overrides: ${local ? '✅ Loaded' : '❌ Not found (using defaults)'}\n`;
  report += `- Learned preferences: ${Object.keys(learning.confirmedPreferences).length} confirmed\n`;
  report += `- Pending questions: ${learning.pendingQuestions.length}\n`;
  report += `- Observations: ${learning.observations.length}\n`;

  if (learning.pendingQuestions.length > 0) {
    report += '\n## Pending Questions\n\n';
    learning.pendingQuestions.forEach((q) => {
      report += `### ${q.question}\n`;
      if (q.context) report += `_Context: ${q.context}_\n`;
      if (q.options) report += `Options: ${q.options.join(', ')}\n`;
      report += `Priority: ${q.priority} | Category: ${q.category}\n\n`;
    });
  }

  return report;
}

// CLI
if (process.argv[1]?.includes('preferences.ts')) {
  const command = process.argv[2];

  switch (command) {
    case 'show':
      console.log(JSON.stringify(getEffectivePreferences(), null, 2));
      break;
    case 'questions':
      console.log(JSON.stringify(getPendingQuestions(), null, 2));
      break;
    case 'report':
      console.log(generatePreferencesReport());
      break;
    default:
      console.log('Usage: npx tsx .claude/rag/preferences.ts [show|questions|report]');
  }
}
