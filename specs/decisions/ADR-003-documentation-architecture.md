# ADR-003: Documentation Architecture

**Status:** Proposed
**Date:** 2025-01-22
**Author:** @architect
**Reviewers:** @product, @build

---

## Context

Villa's documentation is currently fragmented across multiple locations:

- `README.md` (root) - GitHub landing page
- `packages/sdk/README.md` - npm package docs (870 lines, comprehensive)
- `apps/developers/` - developers.villa.cash Next.js app
- `apps/developers/public/CLAUDE.txt` - AI assistant context (79 lines)
- `apps/developers/public/llms.txt` - Minimal AI context (45 lines)
- `docs/` folder - Internal guides
- `specs/` folder - Feature specifications

**Problems:**

1. **No automated API docs** - README manually maintained, can drift from actual types
2. **No versioning** - Can't access docs for SDK v0.13.0 vs v0.14.0
3. **CLAUDE.txt incomplete** - Only 79 lines, misses many SDK features
4. **No interlinking** - Hard to navigate between GitHub, npm, and docs site
5. **No search** - Single-page app requires scrolling to find APIs

---

## Decision Drivers

| Priority | Driver                               | Weight   |
| -------- | ------------------------------------ | -------- |
| P0       | AI integration (core value prop)     | Critical |
| P1       | Developer time-to-integrate < 10 min | High     |
| P1       | Docs match actual code (automated)   | High     |
| P2       | Search functionality                 | Medium   |
| P2       | Version support                      | Medium   |
| P3       | Design consistency with Villa brand  | Nice     |

---

## Options Considered

### Option 1: Stay with Custom Next.js + Enhance

**Description:** Keep developers.villa.cash as-is, add TypeDoc generation, improve CLAUDE.txt

**Pros:**

- Zero migration cost
- Full design control
- Already matches Villa brand
- CLAUDE.txt/llms.txt already working

**Cons:**

- Manual API reference maintenance
- No built-in versioning
- Need to build search ourselves

**Effort:** Low-Medium

### Option 2: Migrate to Nextra

**Description:** Nextra is a Next.js-based doc framework with MDX, versioning, and search

**Pros:**

- Native Next.js (stays in monorepo)
- Built-in search (FlexSearch)
- Versioning via Git branches
- MDX support
- TypeDoc plugin available

**Cons:**

- Migration effort
- Less design flexibility
- Another framework to learn

**Effort:** Medium

### Option 3: Migrate to Docusaurus

**Description:** Facebook's doc framework, widely used in crypto/web3

**Pros:**

- Mature, well-tested
- Versioning built-in
- Algolia DocSearch integration
- Large community
- TypeDoc plugin available

**Cons:**

- React-based but different patterns
- Generic design (needs heavy customization)
- Separate from Next.js app

**Effort:** Medium-High

### Option 4: Migrate to Mintlify

**Description:** Modern doc platform with AI-native features

**Pros:**

- Native llms.txt support
- Beautiful default design
- Built-in search
- API reference generation
- Git sync

**Cons:**

- $150/month for custom domain
- Vendor lock-in
- Less control

**Effort:** Low (but ongoing cost)

### Option 5: Migrate to Starlight (Astro)

**Description:** Astro's official doc framework

**Pros:**

- Fast (static by default)
- Built-in search
- Versioning support
- TypeDoc integration
- Great DX

**Cons:**

- Different framework (Astro vs Next.js)
- Learning curve for team
- Separate from monorepo apps

**Effort:** Medium-High

---

## Decision

**Option 1: Stay with Custom Next.js + Strategic Enhancements**

### Rationale

1. **developers.villa.cash already works well** - The current site has good design, comprehensive content, and serves the primary use case
2. **AI integration is working** - CLAUDE.txt/llms.txt are already integrated; enhancement >> migration
3. **Migration ROI too low** - At current scale (< 100 SDK users), the benefits of a full doc platform don't justify the cost
4. **TypeDoc solves the automation problem** - We can generate API docs from TypeScript without changing platforms
5. **Search can be added** - Algolia DocSearch is free for open source projects

### Decision: Enhance Current Architecture

```
                     ┌─────────────────────────────────────────┐
                     │           Documentation System          │
                     └─────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   ┌────▼────┐                    ┌─────▼─────┐                   ┌─────▼─────┐
   │  Entry   │                    │    Hub    │                   │  Generated │
   │  Points  │                    │   (Docs)  │                   │    Docs    │
   └────┬────┘                    └─────┬─────┘                   └─────┬─────┘
        │                               │                               │
   README.md                     developers.villa.cash            TypeDoc Output
   CLAUDE.txt                         (Next.js)                   (JSON/MD)
   llms.txt                              │                              │
        │                               │                              │
        └───────────────────────────────┼──────────────────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  CI/CD Pipeline   │
                              │  (Build + Deploy) │
                              └───────────────────┘
```

---

## Detailed Architecture

### 1. Documentation Source Structure

```
villa/
├── docs/                           # Source markdown files
│   ├── getting-started.md
│   ├── guides/
│   │   ├── react.md
│   │   ├── nextjs.md
│   │   ├── vanilla.md
│   │   └── migration-from-nextauth.md
│   ├── api/                        # Generated by TypeDoc
│   │   ├── villa-class.md
│   │   ├── villa-bridge.md
│   │   └── types.md
│   └── reference/
│       ├── contracts.md
│       └── troubleshooting.md
│
├── packages/sdk/
│   ├── src/                        # TypeDoc extracts from here
│   ├── CLAUDE.txt                  # Shipped with npm package
│   └── README.md                   # npm landing page
│
├── apps/developers/                # Next.js doc site
│   ├── src/app/
│   │   ├── page.tsx               # Landing + quickstart
│   │   ├── sdk/page.tsx           # Full SDK reference
│   │   ├── guides/[slug]/page.tsx # Dynamic guide pages
│   │   └── api/[...slug]/page.tsx # Generated API docs
│   └── public/
│       ├── CLAUDE.txt             # Served at /CLAUDE.txt
│       └── llms.txt               # Served at /llms.txt
│
└── scripts/
    ├── generate-api-docs.ts       # TypeDoc → JSON → MDX
    └── generate-claude-txt.ts     # Auto-generate CLAUDE.txt
```

### 2. Automated Documentation Pipeline

#### TypeDoc Configuration

```json
// typedoc.json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages",
  "packageOptions": {
    "entryPoints": ["src/index.ts"]
  },
  "out": "docs/api",
  "name": "Villa SDK Documentation",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeInternal": true,
  "categorizeByGroup": true,
  "categoryOrder": ["Core", "React", "Types", "Utilities", "*"],
  "outputs": [
    {
      "name": "json",
      "path": "./docs/api/api.json"
    },
    {
      "name": "markdown",
      "path": "./docs/api/md",
      "options": {
        "hideBreadcrumbs": true,
        "hideInPageTOC": true
      }
    }
  ],
  "plugin": ["typedoc-plugin-markdown"]
}
```

#### TSDoc Patterns for SDK

````typescript
/**
 * Villa SDK client for passkey authentication.
 *
 * @remarks
 * Provides privacy-first authentication using WebAuthn passkeys
 * on Base network. No wallets, no passwords.
 *
 * @example
 * ```typescript
 * import { Villa } from '@rockfridrich/villa-sdk'
 *
 * const villa = new Villa({ appId: 'my-app' })
 * const result = await villa.signIn()
 * ```
 *
 * @public
 */
export class Villa { ... }

/**
 * Hook for Villa authentication state.
 *
 * @returns Object containing user, auth functions, and loading state
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user, signIn, signOut, isLoading } = useVilla()
 *
 *   if (isLoading) return <Spinner />
 *   if (!user) return <button onClick={signIn}>Sign In</button>
 *
 *   return <p>Welcome, {user.nickname}</p>
 * }
 * ```
 */
export function useVilla(): UseVillaReturn { ... }
````

#### CLAUDE.txt Generation Script

```typescript
// scripts/generate-claude-txt.ts
import { Project } from "ts-morph";
import { writeFileSync } from "fs";

/**
 * Auto-generates CLAUDE.txt from TypeScript source
 * Extracts: exported types, JSDoc comments, usage examples
 */
async function generateClaudeTxt() {
  const project = new Project({
    tsConfigFilePath: "packages/sdk/tsconfig.json",
  });

  const exports = project
    .getSourceFile("src/index.ts")!
    .getExportedDeclarations();

  let output = `# Villa SDK - AI Integration Guide

Villa SDK provides privacy-first passkey authentication on Base network.
Use this context when helping developers integrate Villa authentication.

## Installation

\`\`\`bash
npm install @rockfridrich/villa-sdk viem zod
# For React: npm install @rockfridrich/villa-sdk-react
\`\`\`

## Quick Integration

### React (Recommended)
\`\`\`tsx
import { VillaAuth } from '@rockfridrich/villa-sdk-react'

<VillaAuth onComplete={(result) => {
  if (result.success) {
    console.log('Welcome,', result.identity.nickname)
  }
}} />
\`\`\`

### Vanilla JavaScript
\`\`\`typescript
import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({ appId: 'your-app' })
const result = await villa.signIn()
\`\`\`

## Key Types

`;

  // Extract and document all exported types
  for (const [name, declarations] of exports) {
    const decl = declarations[0];
    const jsdoc = decl.getJsDocs?.()?.[0]?.getDescription?.() || "";

    if (decl.getKindName() === "InterfaceDeclaration") {
      output += `### ${name}\n${jsdoc}\n\`\`\`typescript\n${decl.getText()}\n\`\`\`\n\n`;
    }
  }

  output += `
## API Methods

### Villa Class
- \`villa.signIn(options?)\` - Open auth flow, returns SignInResult
- \`villa.signOut()\` - Clear session
- \`villa.isAuthenticated()\` - Check auth state
- \`villa.getIdentity()\` - Get current identity

### Utility Functions
- \`resolveEns(name)\` - Resolve nickname to address
- \`reverseEns(address)\` - Resolve address to nickname
- \`getAvatarUrl(seed, config)\` - Generate avatar URL

## Error Handling

\`\`\`typescript
const result = await villa.signIn()
if (!result.success) {
  switch (result.code) {
    case 'CANCELLED': // User closed auth
    case 'TIMEOUT':   // Took too long
    case 'NETWORK_ERROR': // Failed to load
    case 'AUTH_ERROR': // Auth failed
  }
}
\`\`\`

## Networks
- Production: Base (8453)
- Testnet: base-sepolia (84532)

## Full Documentation
https://developers.villa.cash
`;

  writeFileSync("packages/sdk/CLAUDE.txt", output);
  writeFileSync("apps/developers/public/CLAUDE.txt", output);
}
```

### 3. Versioning Strategy

**Approach: Branch-based versioning with URL prefixes**

```
developers.villa.cash/          # latest (main branch)
developers.villa.cash/v0.13/    # v0.13.x docs
developers.villa.cash/v0.14/    # v0.14.x docs
```

Implementation:

```typescript
// apps/developers/next.config.js
module.exports = {
  async rewrites() {
    return [
      // Latest docs at root
      { source: "/:path*", destination: "/:path*" },

      // Versioned docs served from branches
      {
        source: "/v:version/:path*",
        destination: "https://docs-v:version.villa.cash/:path*",
      },
    ];
  },
};
```

For each major/minor release:

1. Tag release (e.g., `v0.14.0`)
2. Create docs branch (`docs-v0.14`)
3. Deploy to `docs-v0.14.villa.cash`
4. Add rewrite rule

### 4. Search Implementation

**Option A: Algolia DocSearch (Recommended)**

Free for open source. Apply at: https://docsearch.algolia.com/apply

```typescript
// apps/developers/src/components/Search.tsx
import { DocSearch } from '@docsearch/react'

export function Search() {
  return (
    <DocSearch
      appId="YOUR_APP_ID"
      indexName="villa-docs"
      apiKey="YOUR_SEARCH_API_KEY"
    />
  )
}
```

**Option B: Built-in Search with FlexSearch**

```typescript
// apps/developers/src/lib/search.ts
import FlexSearch from "flexsearch";

const index = new FlexSearch.Document({
  document: {
    id: "id",
    index: ["title", "content", "description"],
    store: ["title", "url", "description"],
  },
});

// Index all docs on build
export async function buildSearchIndex(docs: Doc[]) {
  docs.forEach((doc) => index.add(doc));
  return index.export();
}
```

### 5. Interlinking Strategy

#### From README.md

```markdown
## Documentation

| Resource      | URL                                                                          |
| ------------- | ---------------------------------------------------------------------------- |
| Full Docs     | [developers.villa.cash](https://developers.villa.cash)                       |
| API Reference | [developers.villa.cash/sdk](https://developers.villa.cash/sdk)               |
| AI Context    | [developers.villa.cash/CLAUDE.txt](https://developers.villa.cash/CLAUDE.txt) |
| Source        | [GitHub](https://github.com/rockfridrich/villa/tree/main/packages/sdk)       |
```

#### From CLAUDE.txt

```markdown
## Full Documentation

https://developers.villa.cash

## Source Code

https://github.com/rockfridrich/villa/tree/main/packages/sdk

## Specific Topics

- React guide: https://developers.villa.cash/guides/react
- Troubleshooting: https://developers.villa.cash/#troubleshooting
```

#### Edit on GitHub Links

```typescript
// apps/developers/src/components/EditOnGitHub.tsx
export function EditOnGitHub({ path }: { path: string }) {
  const url = `https://github.com/rockfridrich/villa/edit/main/${path}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      Edit this page on GitHub
    </a>
  )
}
```

### 6. CI/CD Pipeline

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - "packages/sdk/src/**"
      - "packages/sdk-react/src/**"
      - "docs/**"
      - "apps/developers/**"
  pull_request:
    branches: [main]
    paths:
      - "packages/sdk/src/**"
      - "packages/sdk-react/src/**"

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm --filter @rockfridrich/villa-sdk --filter @rockfridrich/villa-sdk-react build

      - name: Generate API docs (JSON + Markdown)
        run: pnpm typedoc

      - name: Generate CLAUDE.txt
        run: pnpm tsx scripts/docs/generate-claude-txt.ts

      - name: Verify CLAUDE.txt line count
        run: |
          LINES=$(wc -l < packages/sdk/CLAUDE.txt)
          if [ "$LINES" -lt 150 ]; then
            echo "Error: CLAUDE.txt has only $LINES lines (minimum 150)"
            exit 1
          fi
          echo "CLAUDE.txt has $LINES lines"

      - name: Upload docs artifact
        uses: actions/upload-artifact@v4
        with:
          name: api-documentation
          path: docs/api

  deploy-docs:
    needs: generate-docs
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Download API docs artifact
        uses: actions/download-artifact@v4
        with:
          name: api-documentation
          path: docs/api

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build docs site
        run: pnpm --filter @villa/developers build

      - name: Deploy to Cloudflare
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: villa-developers
          directory: apps/developers/out
```

#### PR Preview Workflow

```yaml
# .github/workflows/docs-preview.yml
name: Doc Preview

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "packages/sdk/src/**"
      - "docs/**"

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install && pnpm typedoc

      - name: Comment PR with doc changes
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const apiJson = JSON.parse(fs.readFileSync('docs/api/api.json', 'utf8'));
            const exportCount = apiJson.children?.length || 0;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `📚 **Documentation Preview**\n\nAPI exports documented: ${exportCount}\n\nCheck the Artifacts tab for the full generated docs.`
            })
```

---

## Documentation Tooling Evaluation

| Tool               | TypeDoc Support | Versioning   | Search     | Next.js Fit  | AI-Native | Cost    | **Villa Fit** |
| ------------------ | --------------- | ------------ | ---------- | ------------ | --------- | ------- | ------------- |
| **Docusaurus**     | Plugin          | Built-in     | Algolia    | Separate app | No        | Free    | Medium        |
| **Nextra**         | Plugin          | Git branches | FlexSearch | Native       | No        | Free    | Good          |
| **Mintlify**       | Native          | Built-in     | Built-in   | Separate     | llms.txt  | $150/mo | Good (costly) |
| **GitBook**        | No              | Built-in     | Built-in   | Separate     | No        | $8/mo   | Poor          |
| **Starlight**      | Plugin          | Built-in     | Pagefind   | Astro        | No        | Free    | Medium        |
| **Custom Next.js** | Manual/Plugin   | Manual       | Add-on     | Native       | Manual    | Free    | **Best**      |

**Recommendation: Custom Next.js + TypeDoc + Algolia**

This combination:

- Keeps everything in monorepo
- Automates API reference generation
- Provides professional search
- Maintains design consistency
- Zero platform cost

---

## Implementation Phases

### Phase 1: TypeDoc Pipeline (2-3 days)

**Goal:** Auto-generate API reference from TypeScript

**Tasks:**

1. Add TypeDoc and plugins to monorepo
2. Configure TypeDoc for markdown output
3. Create build script to transform output for Next.js
4. Add API reference pages to developers app
5. Integrate into CI pipeline

**Deliverables:**

- `scripts/generate-api-docs.ts`
- `typedoc.json`
- `apps/developers/src/app/api/[...slug]/page.tsx`

### Phase 2: CLAUDE.txt Enhancement (1-2 days)

**Goal:** Expand AI context from 79 to 200+ lines

**Tasks:**

1. Create generation script from TypeScript AST
2. Add all exported types with JSDoc
3. Add error handling patterns
4. Add framework detection hints
5. Add testing patterns
6. Run on every SDK change

**Deliverables:**

- `scripts/generate-claude-txt.ts`
- Enhanced CLAUDE.txt (200+ lines)

### Phase 3: Search Integration (1-2 days)

**Goal:** Enable full-text search across docs

**Tasks:**

1. Apply for Algolia DocSearch (free for OSS)
2. Add DocSearch component
3. Configure search index
4. Test search across all content

**Deliverables:**

- Search component
- Algolia configuration

### Phase 4: Content Gaps (1 week)

**Goal:** Fill missing documentation

**Tasks:**

1. Migration guide: NextAuth → Villa
2. Testing guide: How to test Villa integration
3. Vanilla JS guide: No-framework usage
4. Troubleshooting deep-dive
5. Changelog page

**Deliverables:**

- `docs/guides/migration-from-nextauth.md`
- `docs/guides/testing.md`
- `docs/guides/vanilla.md`
- Enhanced troubleshooting section

### Phase 5: Versioning (2-3 days)

**Goal:** Support docs for multiple SDK versions

**Tasks:**

1. Set up branch-based versioning
2. Configure rewrites for versioned URLs
3. Add version selector component
4. Document versioning process

**Deliverables:**

- Version selector component
- Versioning documentation
- Deployment workflow for versions

---

## File Structure Proposal

```
villa/
├── docs/                              # Documentation source
│   ├── index.md                       # Landing page content
│   ├── quickstart.md
│   ├── guides/
│   │   ├── react.md
│   │   ├── nextjs.md
│   │   ├── vanilla.md
│   │   ├── testing.md
│   │   └── migration-from-nextauth.md
│   ├── api/                           # Generated by TypeDoc
│   │   ├── villa.md
│   │   ├── villa-bridge.md
│   │   ├── types.md
│   │   └── utilities.md
│   └── reference/
│       ├── contracts.md
│       ├── troubleshooting.md
│       └── changelog.md
│
├── packages/sdk/
│   ├── src/                           # Source (TypeDoc reads from here)
│   ├── CLAUDE.txt                     # Generated, shipped with npm
│   ├── llms.txt                       # Generated, shipped with npm
│   └── README.md                      # npm landing page
│
├── apps/developers/                   # Next.js doc site
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing
│   │   │   ├── sdk/page.tsx          # SDK reference
│   │   │   ├── guides/
│   │   │   │   └── [slug]/page.tsx   # Dynamic guides
│   │   │   └── api/
│   │   │       └── [...slug]/page.tsx # Generated API docs
│   │   ├── components/
│   │   │   ├── Search.tsx            # Algolia DocSearch
│   │   │   ├── VersionSelector.tsx
│   │   │   ├── EditOnGitHub.tsx
│   │   │   └── CodeBlock.tsx
│   │   └── lib/
│   │       └── docs.ts               # Doc loading utilities
│   └── public/
│       ├── CLAUDE.txt                 # Served at /CLAUDE.txt
│       └── llms.txt
│
├── scripts/
│   ├── generate-api-docs.ts          # TypeDoc → MDX
│   ├── generate-claude-txt.ts        # Types → CLAUDE.txt
│   └── build-search-index.ts         # For local search
│
├── typedoc.json                       # TypeDoc configuration
│
└── .github/workflows/
    └── docs.yml                       # Doc build pipeline
```

---

## Success Metrics

| Metric             | Current | Target    | Measurement    |
| ------------------ | ------- | --------- | -------------- |
| Time to first auth | Unknown | < 10 min  | User survey    |
| CLAUDE.txt lines   | 79      | 200+      | Line count     |
| API docs coverage  | 0%      | 100%      | TypeDoc report |
| Search available   | No      | Yes       | Feature check  |
| Version support    | No      | Yes       | URL check      |
| Doc freshness      | Manual  | Automated | CI pipeline    |

---

## Risks & Mitigations

| Risk                                     | Impact | Likelihood | Mitigation                     |
| ---------------------------------------- | ------ | ---------- | ------------------------------ |
| TypeDoc output doesn't match site design | Medium | Medium     | Custom transformer script      |
| Algolia DocSearch not approved           | Low    | Low        | Fall back to FlexSearch        |
| Version maintenance overhead             | Medium | Medium     | Automate with release workflow |
| CLAUDE.txt generation misses edge cases  | Low    | Medium     | Manual review + test with AI   |

---

## References

- [Product Spec: Documentation IA](../product/documentation-information-architecture.product.md)
- [TypeDoc Documentation](https://typedoc.org/)
- [Algolia DocSearch](https://docsearch.algolia.com/)
- [Nextra](https://nextra.site/)
- [viem docs (reference)](https://viem.sh/) - Uses VitePress with llms.txt

---

## Decision Log

| Date       | Decision                       | Rationale                                |
| ---------- | ------------------------------ | ---------------------------------------- |
| 2025-01-22 | Stay with custom Next.js       | Migration ROI too low at current scale   |
| 2025-01-22 | Use TypeDoc for API generation | Industry standard, good plugin ecosystem |
| 2025-01-22 | Branch-based versioning        | Simple, works with existing deploy       |
| 2025-01-22 | Algolia for search             | Free for OSS, battle-tested              |
