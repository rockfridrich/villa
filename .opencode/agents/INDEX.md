# OpenCode Agents

5 agents. Route cheap first.

| Agent | Model | Cost/1M tok | What | Tools |
|-------|-------|-------------|------|-------|
| @explore | Gemini 2.5 Flash | ~$0.08 | Search code (READ-ONLY) | Read, Grep, Glob |
| @fix | Claude Haiku 3.5 | ~$0.25 | Quick fixes, 1-3 files | Full (Read/Write/Edit/Bash/Grep/Glob) |
| @test | Claude Haiku 3.5 | ~$0.25 | Run tests, report only | Bash, Read, Grep, Glob |
| @build | Claude Sonnet 4.5 | ~$3.00 | Implementation | Full (Read/Write/Edit/Bash/Grep/Glob) |
| @review | Gemini 2.5 Pro | ~$3.00 | Code review (READ-ONLY) | Read, Grep, Glob, Bash |

**Decision:** Search? -> @explore. Small fix? -> @fix. Tests? -> @test. Build? -> @build. Review? -> @review.

**Escalation:** Architecture, specs, security -> Claude Code GUI.
