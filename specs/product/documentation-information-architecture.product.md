# Product Spec: Documentation Information Architecture

**Source:** Product analysis session
**Created:** 2025-01-22
**Product Lead:** @product

---

## Executive Summary

Villa's documentation is comprehensive but fragmented across multiple locations (README, CLAUDE.txt, developers.villa.cash, package READMEs, /docs folder, /specs folder). This creates friction for developers discovering Villa, AI assistants integrating it, and existing users seeking reference material. This spec proposes a unified information architecture that connects all documentation surfaces while respecting their unique purposes.

---

## Current State Analysis

### Documentation Inventory

| Location                            | Content                          | Lines     | Purpose                 | Issues                         |
| ----------------------------------- | -------------------------------- | --------- | ----------------------- | ------------------------------ |
| `README.md` (root)                  | Quick start, architecture, links | 160       | GitHub landing page     | Good, minimal gaps             |
| `packages/sdk/README.md`            | Full API reference               | 870       | npm package docs        | Comprehensive but duplicated   |
| `packages/sdk-react/README.md`      | React SDK reference              | 154       | npm package docs        | Good                           |
| `apps/developers/public/CLAUDE.txt` | AI integration guide             | 79        | AI assistant context    | Concise, needs expansion       |
| `apps/developers/public/llms.txt`   | Minimal AI context               | 45        | Quick AI reference      | Very brief                     |
| `developers.villa.cash`             | Full documentation               | ~1400     | Public developer portal | Well-designed, single-page     |
| `docs/` folder                      | Internal guides                  | ~7 files  | Contributor docs        | Scattered, low discoverability |
| `examples/`                         | Working examples                 | 2 apps    | Learning by example     | Only Next.js covered           |
| `specs/`                            | Feature specifications           | 50+ files | Internal planning       | Not public-facing              |

### Gap Analysis

**Missing Content:**

1. **Migration guides** - No path from other auth solutions (NextAuth, Clerk, Auth0)
2. **Framework guides** - No Vue, Svelte, vanilla HTML coverage
3. **Backend integration** - No Node.js/Express guide for server-side verification
4. **Troubleshooting deep-dive** - Passkey debugging, browser compatibility
5. **Changelog/Versioning** - No version history or upgrade guides
6. **Architecture deep-dive** - CCIP-Read, Porto SDK integration details
7. **Security documentation** - Formal security model, threat analysis

**Structural Issues:**

1. **Duplication** - SDK README duplicates developers.villa.cash content
2. **No search** - Single-page app makes finding specific info difficult
3. **No versioning** - Can't access docs for specific SDK versions
4. **Weak interlinking** - README mentions CLAUDE.txt but doesn't cross-link well
5. **AI context incomplete** - CLAUDE.txt is minimal (79 lines)

---

## Jobs to Be Done

### Primary Job: First-Time Integration

**When I...** discover Villa through GitHub or word-of-mouth
**I want to...** understand what it does and integrate it in under 10 minutes
**So I can...** ship passkey authentication without becoming an expert

**Success Criteria:**

- [ ] Time to working auth < 10 minutes
- [ ] Copy-paste code works first try
- [ ] Zero configuration required for basic use
- [ ] Clear upgrade path when ready for advanced features

### Secondary Jobs

| Job                        | Context                      | Desired Outcome                       | Priority |
| -------------------------- | ---------------------------- | ------------------------------------- | -------- |
| AI-assisted integration    | Using Claude/Cursor/Copilot  | AI generates working code from prompt | P0       |
| API reference lookup       | Debugging or extending       | Find exact method signature quickly   | P1       |
| Framework migration        | Have existing auth           | Swap in Villa with minimal changes    | P1       |
| Architecture understanding | Security review or extending | Understand how passkeys work          | P2       |
| Troubleshooting            | Auth not working             | Diagnose and fix issue                | P1       |
| Contribution               | Want to improve Villa        | Find where to start                   | P3       |

---

## User Value Matrix

| Persona               | Sees                           | Gets                         | Never Knows                    |
| --------------------- | ------------------------------ | ---------------------------- | ------------------------------ |
| **New developer**     | "npm install" + 3-line example | Working auth in minutes      | WebAuthn complexity, Porto SDK |
| **AI assistant**      | CLAUDE.txt structured context  | Correct code generation      | Internal implementation        |
| **Experienced dev**   | Full API reference             | All configuration options    | Why we chose certain patterns  |
| **Security reviewer** | Architecture docs              | Confidence in security model | Internal sprint decisions      |
| **Contributor**       | CONTRIBUTING.md                | Clear path to first PR       | Historical context             |

---

## User Flows

### Flow 1: New Developer Discovery

**Entry Point:** GitHub search, HN/Twitter mention, or AI recommendation
**Happy Path:**

1. Lands on README.md - sees value prop + quick start
2. Copies npm install command
3. Copies 3-line example code
4. Runs app, sees passkey prompt
5. Auth works, visits developers.villa.cash for more

**Error Paths:**
| Trigger | User Sees | Recovery Action |
|---------|-----------|-----------------|
| Framework not React | README shows vanilla JS too | Links to framework-specific guides |
| Passkey fails | Troubleshooting section | Debug mode + common fixes |
| Need more options | API Reference section | Full documentation link |

### Flow 2: AI Assistant Integration

**Entry Point:** User asks AI "add Villa authentication"
**Happy Path:**

1. AI searches npm/GitHub for "villa-sdk"
2. AI finds CLAUDE.txt context file
3. AI generates VillaProvider + VillaAuth code
4. User runs code, auth works
5. AI can answer follow-up questions from context

**Error Paths:**
| Trigger | User Sees | Recovery Action |
|---------|-----------|-----------------|
| AI lacks context | AI asks user for docs URL | developers.villa.cash/CLAUDE.txt |
| Generated code wrong | Runtime error | CLAUDE.txt has troubleshooting |
| User wants customization | AI needs more context | Links to full docs in CLAUDE.txt |

### Flow 3: Existing User Reference Lookup

**Entry Point:** Need to find specific API detail
**Happy Path:**

1. Opens developers.villa.cash
2. Uses sidebar navigation OR in-page anchors
3. Finds method/type definition
4. Copies code example

**Pain Points (Current):**

- Single-page app requires scrolling
- No search functionality
- Must know which section contains info

---

## Recommended Information Architecture

### Tier 1: Entry Points (Minimal, Inviting)

```
README.md (GitHub)
├── Value proposition (2 sentences)
├── Quick Start (3 lines of code)
├── Live demo link
├── "Full docs" link → developers.villa.cash
└── Links section

CLAUDE.txt (AI Context)
├── One-prompt integration pattern
├── Key types (Identity, SignInResult)
├── Error handling patterns
├── Link to full docs
└── Troubleshooting basics
```

### Tier 2: Developer Portal (developers.villa.cash)

```
/                     → Landing + Quick Start
/sdk                  → SDK Reference (comprehensive)
/guides/
  ├── react           → React integration guide
  ├── nextjs          → Next.js specific guide
  ├── vue             → Vue integration guide (NEW)
  ├── vanilla         → Vanilla JS guide (NEW)
  └── migration       → From Auth0/Clerk/NextAuth (NEW)
/api/
  ├── villa           → Villa class reference
  ├── bridge          → VillaBridge reference
  └── types           → TypeScript types
/troubleshooting      → Debug guide + common issues
/architecture         → How Villa works internally
/contracts            → Smart contract documentation
/changelog            → Version history (NEW)
/playground           → Interactive playground
/examples             → Code examples gallery
```

### Tier 3: Deep Reference (Package READMEs)

```
packages/sdk/README.md       → npm landing page (stays current)
packages/sdk-react/README.md → npm landing page (stays current)
```

### Tier 4: Internal Documentation

```
docs/                        → Contributor guides
specs/                       → Feature specifications
CONTRIBUTING.md             → How to contribute
SECURITY.md                  → Security policy
```

---

## Content Specifications

### CLAUDE.txt Enhancement

**Current:** 79 lines, basic integration
**Recommended:** 200-300 lines, comprehensive AI context

**New Sections to Add:**

1. **Framework detection** - Patterns for Next.js, Vite, CRA
2. **Common customizations** - Theming, custom buttons
3. **Error recovery** - What to do when auth fails
4. **Testing patterns** - Mocking Villa in tests
5. **TypeScript patterns** - Proper typing for identity

### Missing Guides (Priority Order)

1. **Migration from NextAuth** - Most common migration path
2. **Next.js App Router** - Modern Next.js patterns
3. **Vanilla HTML/JS** - No-framework integration
4. **Vue 3 + Composition API** - Second most requested
5. **Server-Side Verification** - Verify identity on backend
6. **Testing Guide** - How to test Villa integration

---

## Documentation Solution Evaluation

### Requirements

| Requirement   | Weight   | Why                               |
| ------------- | -------- | --------------------------------- |
| AI-friendly   | Critical | Core value prop is AI integration |
| GitHub sync   | High     | Docs live with code               |
| Search        | High     | API reference discovery           |
| Versioning    | Medium   | SDK version matching              |
| Custom domain | Required | developers.villa.cash             |
| Free tier     | Nice     | Early-stage project               |

### Recommended: Stay with Next.js Custom

**Why not migrate:**

1. developers.villa.cash already exists and works well
2. Custom design matches Villa brand
3. CLAUDE.txt/llms.txt already solve AI discovery
4. Migration cost > benefit

**Enhance instead:**

1. Add search (Algolia DocSearch or similar)
2. Add sidebar navigation (already present)
3. Add versioned docs via routes (/v1, /v2)
4. Add changelog page

### Alternative: Mintlify (If Migrating)

**Pros:**

- Native AI integration (llms.txt support)
- Beautiful default design
- Git sync built-in
- Search included
- API reference generation

**Cons:**

- $150/month for custom domain
- Less control over design
- Another system to maintain

### Alternative: Docusaurus

**Pros:**

- Free, open source
- Versioning built-in
- Search via Algolia
- Large community

**Cons:**

- Generic design
- More setup required
- Less AI-friendly out of box

---

## Interlinking Strategy

### From README.md

````markdown
## Documentation

- **Quick Start** → developers.villa.cash/#quickstart
- **Full API Reference** → developers.villa.cash/sdk
- **AI Integration** → developers.villa.cash/CLAUDE.txt
- **Examples** → github.com/rockfridrich/villa/tree/main/examples

## For AI Assistants

Copy this context to your AI assistant:

```bash
curl https://developers.villa.cash/CLAUDE.txt
```
````

````

### From Package README (npm)

```markdown
## Documentation

This README provides complete API reference.

For guides and tutorials: https://developers.villa.cash
For AI integration: https://developers.villa.cash/CLAUDE.txt
````

### From CLAUDE.txt

```markdown
## Full Documentation

This file provides quick integration context.
For complete documentation: https://developers.villa.cash

## Specific Topics

- React guide: https://developers.villa.cash/guides/react
- Troubleshooting: https://developers.villa.cash/troubleshooting
- Smart Contracts: https://developers.villa.cash/contracts
```

### From developers.villa.cash

```markdown
## Source Code

- GitHub: github.com/rockfridrich/villa
- npm: npmjs.com/package/@rockfridrich/villa-sdk

## Edit This Page

[Edit on GitHub](https://github.com/rockfridrich/villa/edit/main/apps/developers/...)
```

---

## Analytics Requirements

### Key Metrics

| Metric               | Definition             | Target     | Tracking         |
| -------------------- | ---------------------- | ---------- | ---------------- |
| Time to first auth   | Install → working auth | < 10 min   | User survey      |
| CLAUDE.txt downloads | AI adoption indicator  | 1000/month | Server logs      |
| Doc page views       | Content popularity     | Track all  | Analytics        |
| Search queries       | What devs can't find   | Track      | Search analytics |

### Events to Track

| Event                 | Trigger           | Properties                 | Purpose              |
| --------------------- | ----------------- | -------------------------- | -------------------- |
| `docs_page_view`      | Page load         | `{ page, referrer }`       | Content popularity   |
| `code_copy`           | Copy button click | `{ snippet_id }`           | Most useful examples |
| `claude_txt_download` | Download click    | `{ source }`               | AI adoption          |
| `search_query`        | Search submit     | `{ query, results_count }` | Missing content      |
| `external_link_click` | Click external    | `{ destination }`          | Navigation patterns  |

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. **Enhance CLAUDE.txt** - Add missing patterns, expand to 200+ lines
2. **Add search** - Integrate Algolia DocSearch
3. **Improve README links** - Better cross-linking
4. **Add "Edit on GitHub" links** - Enable community contributions

### Phase 2: Content Gaps (1 week)

1. **Migration guide: NextAuth** - Most requested
2. **Testing guide** - How to test Villa integration
3. **Changelog page** - Version history
4. **Enhanced troubleshooting** - More debug patterns

### Phase 3: Framework Coverage (2 weeks)

1. **Vue 3 guide** - Second most common framework
2. **Vanilla JS guide** - No-framework users
3. **Server-side verification** - Backend integration
4. **React Native guide** - Mobile apps

### Phase 4: Advanced (Ongoing)

1. **Interactive playground** - Try API in browser
2. **Video tutorials** - Quick start videos
3. **Community examples** - Showcase integrations
4. **API versioning** - /v1, /v2 routes

---

## Success Definition

**This feature is successful when:**

1. 80% of new integrations complete in < 15 minutes
2. AI assistants generate working code 90% of the time
3. Support questions drop 50% (self-serve discovery)
4. CLAUDE.txt downloads reach 1000+/month

**We will validate by:**

- User surveys post-integration
- AI-generated code testing
- Support ticket analysis
- Analytics review

---

## Scope Boundaries

### In Scope (v1)

- CLAUDE.txt enhancement
- Search integration
- README improvements
- Interlinking fixes
- Changelog page

### Out of Scope (v1)

- Full doc platform migration - Too costly for current scale
- Video content - Focus on written docs first
- Internationalization - English only initially
- Print/PDF export - Not a priority use case

### Dependencies

- Analytics integration for tracking
- Algolia account for search
- Design system consistency

---

## Appendix A: Documentation Platform Research

### Platform Comparison Matrix

| Platform       | AI/LLM Support             | GitHub Sync   | Versioning | Search     | Pricing    |
| -------------- | -------------------------- | ------------- | ---------- | ---------- | ---------- |
| **Docusaurus** | No native llms.txt         | Manual deploy | Native     | Algolia    | Free (OSS) |
| **Mintlify**   | llms.txt + MCP + AI Agent  | Git sync      | Yes        | Built-in   | $0-30/mo   |
| **GitBook**    | AI Assistant               | Git Sync      | Yes        | Built-in   | $0-65/mo   |
| **Nextra**     | No native                  | Manual        | Manual     | Algolia    | Free (OSS) |
| **ReadMe**     | llms.txt + MCP + AI Search | Bidirectional | Yes        | AI-powered | $0-349/mo  |

### Platform Recommendations

**For Villa (Current Scale):** Stay with custom Next.js

- developers.villa.cash already exists and works
- CLAUDE.txt provides AI context
- Migration cost exceeds benefit

**If Migrating (Future):** Mintlify recommended

- Native llms.txt and MCP support
- AI writing assistant included
- Used by Anthropic, Vercel, Laravel
- $30/mo Pro tier is affordable

### Key Insight: Wagmi's AI Pattern

Wagmi docs include an "Are you an LLM?" prompt that directs to Markdown-optimized pages. Villa should adopt similar pattern:

- Add `/llm` or `/ai` endpoint with plain markdown
- Include structured metadata for AI parsing
- Optimize for context window efficiency

---

## Appendix B: AI-Friendly Documentation Best Practices

### From Industry Research (Paligo, Alation, Geneo, Bluestream)

1. **Structure content for AI retrieval**
   - Use component-based, semantically structured content
   - Clear hierarchy so AI can traverse effectively
   - Consistent metadata strategy

2. **Use metadata consistently**
   - Define metadata for content type, audience, version
   - Align visible content with structured data
   - Schema.org JSON-LD for discoverability

3. **Separate content from presentation**
   - Easier to generate multiple outputs
   - Keep AI pipelines consistent

4. **Provide comprehensive, context-rich examples**
   - Full, runnable examples with edge cases
   - Keep code samples current with API version

### CLAUDE.txt Enhancement Recommendations

Based on research, enhance CLAUDE.txt with:

```markdown
# Villa SDK - AI Integration Context

# Version: 1.0.0

# Last Updated: 2025-01-22

# For: Claude, GPT-4, Copilot, Cursor

## Quick Facts

- Package: @rockfridrich/villa-sdk
- Peer deps: viem, zod
- Bundle: ~22KB
- Auth: Passkeys (WebAuthn)
- Network: Base (8453) / Base Sepolia (84532)

## One-Prompt Integration

[Full working example]

## Framework Detection

- Next.js App Router: Use 'use client' directive
- Next.js Pages: Standard React
- Vite/CRA: Standard React
- Vanilla: Use Villa class directly

## Common Patterns

[Expanded patterns section]

## Error Recovery

[Troubleshooting section]

## Testing

[Mocking patterns for tests]
```

---

## Appendix C: Competitive Analysis

### How Web3 SDKs Document Their APIs

| SDK           | Docs Tool | AI Support               | Key Pattern                               |
| ------------- | --------- | ------------------------ | ----------------------------------------- |
| **wagmi**     | VitePress | "Are you an LLM?" prompt | Multi-version, hooks-based API            |
| **viem**      | VitePress | Markdown-optimized       | Strong TypeScript emphasis                |
| **ethers.js** | Custom    | None                     | Versioned (v4/v5/v6) + single-page option |
| **Clerk**     | Custom    | None                     | Framework-specific guides                 |
| **Auth0**     | Custom    | None                     | Comprehensive, multi-language             |

**Villa's Differentiation:**

- CLAUDE.txt is more comprehensive than competitors' llms.txt
- AI-native positioning is unique value prop
- One-prompt integration is competitive advantage
- Privacy-first messaging resonates with developers

### Best Practices from Successful SDKs

1. **Stripe** - Excellent sidebar, multi-language examples, copy buttons
2. **Twilio** - Step-by-step quickstarts, clear prerequisites
3. **wagmi** - Comprehensive TypeScript types, LLM-friendly
4. **Vercel** - Framework-specific guides, templates, playground

---

## Next Steps

1. **Architect:** Review and decompose into implementation tasks
2. **Build:** Implement Phase 1 quick wins
3. **Design:** Review search UI integration
4. **Test:** Validate with 5 new developers

---

_Product spec complete. Ready for @architect decomposition._
