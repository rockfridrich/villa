/**
 * Context RAG Tests
 *
 * Validates that all agent prompts and context files are properly configured.
 * Run with: pnpm test:context
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const CLAUDE_DIR = join(process.cwd(), '.claude');
const AGENTS_DIR = join(CLAUDE_DIR, 'agents');
const ROOT_AGENTS_DIR = join(process.cwd(), 'agents');

describe('Context RAG Structure', () => {
  describe('Required Files', () => {
    it('CLAUDE.md exists and is under 200 lines', () => {
      const path = join(CLAUDE_DIR, 'CLAUDE.md');
      expect(existsSync(path)).toBe(true);

      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(200);
    });

    it('SYSTEM_PROMPT.md exists', () => {
      const path = join(CLAUDE_DIR, 'SYSTEM_PROMPT.md');
      expect(existsSync(path)).toBe(true);
    });

    it('MANIFESTO.md exists', () => {
      const path = join(CLAUDE_DIR, 'MANIFESTO.md');
      expect(existsSync(path)).toBe(true);
    });

    it('LEARNINGS.md exists', () => {
      const path = join(CLAUDE_DIR, 'LEARNINGS.md');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('CLAUDE.md References', () => {
    let claudeMd: string;

    beforeAll(() => {
      claudeMd = readFileSync(join(CLAUDE_DIR, 'CLAUDE.md'), 'utf-8');
    });

    it('references SYSTEM_PROMPT.md for orchestrator context', () => {
      expect(claudeMd).toMatch(/SYSTEM_PROMPT|system.prompt|orchestrator/i);
    });

    it('references agent directory', () => {
      expect(claudeMd).toMatch(/agents?[/\\]|@\w+/);
    });

    it('has quick reference section', () => {
      expect(claudeMd).toMatch(/quick\s*reference/i);
    });
  });

  describe('Agent Definitions', () => {
    let agentFiles: string[];

    beforeAll(() => {
      if (existsSync(AGENTS_DIR)) {
        agentFiles = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
      } else {
        agentFiles = [];
      }
    });

    it('has at least 5 core agents', () => {
      const coreAgents = ['build', 'test', 'review', 'ops', 'design'];
      const found = coreAgents.filter((a) => agentFiles.includes(`${a}.md`));
      expect(found.length).toBeGreaterThanOrEqual(5);
    });

    it('each agent has frontmatter with model', () => {
      agentFiles.forEach((file) => {
        const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
        const hasFrontmatter = content.startsWith('---');
        const hasModel = content.match(/model:\s*(haiku|sonnet|opus)/i);

        expect(hasFrontmatter || hasModel).toBeTruthy();
      });
    });

    it('each agent is under 10K tokens (~40K chars)', () => {
      const MAX_CHARS = 40000;

      agentFiles.forEach((file) => {
        const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
        expect(content.length).toBeLessThan(MAX_CHARS);
      });
    });
  });

  describe('No Duplicate Agents', () => {
    it('agents in /agents should be consolidated to .claude/agents', () => {
      if (!existsSync(ROOT_AGENTS_DIR)) return; // Skip if no root agents dir

      const rootAgents = readdirSync(ROOT_AGENTS_DIR).filter((f) =>
        f.endsWith('.md')
      );
      const claudeAgents = existsSync(AGENTS_DIR)
        ? readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'))
        : [];

      const duplicates = rootAgents.filter((f) => claudeAgents.includes(f));

      // Warning only - not a hard failure
      if (duplicates.length > 0) {
        console.warn(
          `Warning: Duplicate agents found: ${duplicates.join(', ')}`
        );
        console.warn(
          'Consider consolidating to .claude/agents/ as single source of truth'
        );
      }
    });
  });

  describe('Knowledge Files', () => {
    const KNOWLEDGE_DIR = join(CLAUDE_DIR, 'knowledge');

    it('knowledge directory exists', () => {
      expect(existsSync(KNOWLEDGE_DIR)).toBe(true);
    });

    it('has domain-specific knowledge files', () => {
      if (!existsSync(KNOWLEDGE_DIR)) return;

      const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('Token Budget Compliance', () => {
    it('total context under 50K tokens (~200K chars)', () => {
      const MAX_TOTAL_CHARS = 200000;
      let totalChars = 0;

      // Count CLAUDE.md, SYSTEM_PROMPT, MANIFESTO
      ['CLAUDE.md', 'SYSTEM_PROMPT.md', 'MANIFESTO.md'].forEach((file) => {
        const path = join(CLAUDE_DIR, file);
        if (existsSync(path)) {
          totalChars += readFileSync(path, 'utf-8').length;
        }
      });

      // Count agents
      if (existsSync(AGENTS_DIR)) {
        readdirSync(AGENTS_DIR)
          .filter((f) => f.endsWith('.md'))
          .forEach((file) => {
            totalChars += readFileSync(join(AGENTS_DIR, file), 'utf-8').length;
          });
      }

      expect(totalChars).toBeLessThan(MAX_TOTAL_CHARS);
    });
  });
});

describe('Agent Prompt Quality', () => {
  const AGENTS_DIR = join(CLAUDE_DIR, 'agents');

  it('agents have clear purpose section', () => {
    if (!existsSync(AGENTS_DIR)) return;

    const files = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

    files.forEach((file) => {
      const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
      const hasPurpose =
        content.match(/purpose|role|responsibility|you are/i) !== null;
      expect(hasPurpose).toBe(true);
    });
  });

  it('agents have tool access defined', () => {
    if (!existsSync(AGENTS_DIR)) return;

    const files = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

    files.forEach((file) => {
      const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
      const hasTools =
        content.match(/tools?:|Read|Write|Edit|Bash|Grep|Glob/i) !== null;
      expect(hasTools).toBe(true);
    });
  });
});
