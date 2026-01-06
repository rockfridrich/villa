/**
 * Context RAG Loader
 *
 * Validates and tests context loading for Claude Code agents.
 * This is a test utility, not runtime code.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file, then go up to .claude and project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLAUDE_DIR = dirname(__dirname); // .claude/rag -> .claude
const ROOT_DIR = dirname(CLAUDE_DIR); // .claude -> project root

interface AgentDefinition {
  name: string;
  path: string;
  model?: string;
  tools?: string[];
  content: string;
  tokens: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse frontmatter from agent definition
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter: Record<string, string> = {};
  match[1].split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  return frontmatter;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Load all agent definitions
 */
export function loadAgents(): AgentDefinition[] {
  const agentsDir = join(CLAUDE_DIR, 'agents');
  if (!existsSync(agentsDir)) return [];

  const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));

  return files.map((file) => {
    const path = join(agentsDir, file);
    const content = readFileSync(path, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    return {
      name: basename(file, '.md'),
      path,
      model: frontmatter.model,
      tools: frontmatter.tools?.split(',').map((t) => t.trim()),
      content,
      tokens: estimateTokens(content),
    };
  });
}

/**
 * Validate agent definition
 */
export function validateAgent(agent: AgentDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required sections
  const requiredSections = ['# ', '## '];
  if (!requiredSections.some((s) => agent.content.includes(s))) {
    errors.push(`${agent.name}: Missing markdown headers`);
  }

  // Model specified
  if (!agent.model) {
    warnings.push(`${agent.name}: No model specified in frontmatter`);
  }

  // Token budget
  const MAX_TOKENS = 10000;
  if (agent.tokens > MAX_TOKENS) {
    warnings.push(
      `${agent.name}: ${agent.tokens} tokens exceeds recommended ${MAX_TOKENS}`
    );
  }

  // Check for common issues
  if (agent.content.includes('TODO:')) {
    warnings.push(`${agent.name}: Contains TODO markers`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all context files
 */
export function validateContext(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required files exist
  const requiredFiles = ['CLAUDE.md', 'SYSTEM_PROMPT.md', 'MANIFESTO.md'];
  for (const file of requiredFiles) {
    const path = join(CLAUDE_DIR, file);
    if (!existsSync(path)) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check for duplicate agents
  const rootAgents = existsSync(join(ROOT_DIR, 'agents'))
    ? readdirSync(join(ROOT_DIR, 'agents')).filter((f) => f.endsWith('.md'))
    : [];
  const claudeAgents = existsSync(join(CLAUDE_DIR, 'agents'))
    ? readdirSync(join(CLAUDE_DIR, 'agents')).filter((f) => f.endsWith('.md'))
    : [];

  const duplicates = rootAgents.filter((f) => claudeAgents.includes(f));
  if (duplicates.length > 0) {
    warnings.push(
      `Duplicate agent definitions: ${duplicates.join(', ')} (exists in both /agents and /.claude/agents)`
    );
  }

  // Validate each agent
  const agents = loadAgents();
  for (const agent of agents) {
    const result = validateAgent(agent);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Check CLAUDE.md references SYSTEM_PROMPT
  const claudeMd = readFileSync(join(CLAUDE_DIR, 'CLAUDE.md'), 'utf-8');
  if (!claudeMd.includes('SYSTEM_PROMPT')) {
    warnings.push('CLAUDE.md does not reference SYSTEM_PROMPT.md');
  }
  if (!claudeMd.includes('MANIFESTO')) {
    warnings.push('CLAUDE.md does not reference MANIFESTO.md');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate context report
 */
export function generateReport(): string {
  const agents = loadAgents();
  const validation = validateContext();

  let report = '# Context RAG Report\n\n';

  report += '## Summary\n\n';
  report += `- Agents: ${agents.length}\n`;
  report += `- Total tokens: ${agents.reduce((sum, a) => sum + a.tokens, 0)}\n`;
  report += `- Valid: ${validation.valid}\n\n`;

  if (validation.errors.length > 0) {
    report += '## Errors\n\n';
    validation.errors.forEach((e) => (report += `- ${e}\n`));
    report += '\n';
  }

  if (validation.warnings.length > 0) {
    report += '## Warnings\n\n';
    validation.warnings.forEach((w) => (report += `- ${w}\n`));
    report += '\n';
  }

  report += '## Agents\n\n';
  report += '| Name | Model | Tokens |\n';
  report += '|------|-------|--------|\n';
  agents.forEach((a) => {
    report += `| ${a.name} | ${a.model || 'unspecified'} | ${a.tokens} |\n`;
  });

  return report;
}

// CLI entry point
if (process.argv[1]?.includes('loader.ts')) {
  const command = process.argv[2];

  if (command === 'validate') {
    const result = validateContext();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } else if (command === 'report') {
    console.log(generateReport());
  } else {
    console.log('Usage: npx tsx .claude/rag/loader.ts [validate|report]');
  }
}
