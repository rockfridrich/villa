# OpenCode Agents

5 agents. Route cheap first.

| Agent | Model | What | Tools |
|-------|-------|------|-------|
| @explore | Gemini Flash | Search code | Read, Grep, Glob |
| @fix | Haiku | Quick fixes ≤3 files | Full |
| @test | Haiku | Run tests | Bash, Read |
| @build | Sonnet | Implementation | Full |
| @review | Gemini Pro | Code review | Read, Bash |

**Decision:** Search? → @explore. Small fix? → @fix. Tests? → @test. Build? → @build. Review? → @review.
