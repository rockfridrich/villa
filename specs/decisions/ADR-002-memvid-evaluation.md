# ADR-002: Memvid AI Context Management Evaluation

**Status:** Evaluated - Defer
**Date:** 2026-01-07
**Decision:** Defer Memvid integration; current tooling sufficient

## Context

Evaluated [Memvid](https://memvid.com/) as a context management layer for:
1. Claude Code development context (`.claude/` knowledge base)
2. User agent context in TinyCloud

## What is Memvid?

Video-based AI memory that replaces vector databases with a single file:

| Version | Format | Features |
|---------|--------|----------|
| [Python](https://github.com/Olow304/memvid) | `.mp4` (QR codes) | 50-100x smaller than vector DBs |
| [Rust](https://github.com/memvid/memvid) | `.mv2` | Sub-5ms retrieval, MCP server |

## Evaluation Summary

### For `.claude/` Context: ✅ Potentially Viable (Deferred)

**Pros:**
- Better semantic search than grep/ripgrep
- Single portable file survives session clears
- MCP integration enables tool calls

**Cons:**
- Adds ~600MB embedding model
- Re-indexing needed when docs change
- Complexity vs. current file-based approach

**Current Alternatives Working Well:**
- `.claude/LEARNINGS.md` - structured learnings
- `specs/` directory - organized specs
- Beads (`.beads/`) - task memory
- `bd prime` - context recovery

### For TinyCloud: ❌ Not Recommended

TinyCloud and Memvid solve different problems:

| Aspect | TinyCloud | Memvid |
|--------|-----------|--------|
| Purpose | User data storage | AI memory/RAG |
| Data | Avatars, profiles | Text + embeddings |
| Search | Key-value | Semantic similarity |

## Decision

**Defer** Memvid integration. Current tooling is sufficient:

1. Session context recovery works via `bd prime`
2. Project knowledge is well-organized in specs/
3. LEARNINGS.md captures reusable patterns
4. Beads provides persistent task memory

**Reconsider if:**
- Project docs exceed ~50 files
- Cross-session context retrieval becomes a pain point
- MCP ecosystem matures further

## Alternatives Considered

1. **Vector database (ChromaDB, Pinecone)** - Too heavy, requires infrastructure
2. **SQLite FTS** - Good for exact search, not semantic
3. **Memvid** - Right approach, premature for current scale

## Sources

- [Memvid Documentation](https://memvid.com/)
- [GitHub: memvid/memvid (Rust)](https://github.com/memvid/memvid)
- [Memvid MCP Server](https://github.com/angrysky56/memvid_mcp_server)
- [Medium: The Future of AI Memory](https://medium.com/@Rohini_Vaidya/memvid-the-future-of-ai-memory-is-a-video-d53b75854227)
