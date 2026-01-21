import type { SearchResult, SearchIndexPage } from "../types/docs";

const searchIndex: SearchIndexPage[] = [
  {
    id: "quickstart",
    title: "Quick Start",
    content:
      "npm install @rockfridrich/villa-sdk. Import villa from the SDK. Call villa.signIn() to authenticate. Get user address, nickname, avatar.",
    section: "Getting Started",
    url: "/#quickstart",
  },
  {
    id: "react",
    title: "React Integration",
    content:
      "VillaProvider wraps your app. useVilla hook for user state. VillaButton component for sign-in UI. VillaAuth for custom triggers.",
    section: "React",
    url: "/#react",
  },
  {
    id: "api-villa",
    title: "Villa Class",
    content:
      "villa.signIn() authenticates user with passkey. villa.signOut() clears session. villa.getUser() returns current identity. villa.isConnected() checks auth state.",
    section: "API Reference",
    url: "/#api",
  },
  {
    id: "api-types",
    title: "TypeScript Types",
    content:
      "Identity interface: address, nickname, avatar, chainId. SignInResult: identity plus session info. VillaConfig: environment, storage options.",
    section: "API Reference",
    url: "/#types",
  },
  {
    id: "errors",
    title: "Error Handling",
    content:
      "VillaError base class. UserRejectedError when user cancels. PasskeyNotSupportedError for browser compatibility. NetworkError for connection issues.",
    section: "Troubleshooting",
    url: "/#errors",
  },
  {
    id: "contracts",
    title: "Smart Contracts",
    content:
      "VillaNicknameResolverV3 on Base Sepolia. BiometricRecoverySignerV2 for account recovery. CCIP-Read for cross-chain resolution.",
    section: "Architecture",
    url: "/#contracts",
  },
  {
    id: "claude-txt",
    title: "AI Integration (CLAUDE.txt)",
    content:
      "CLAUDE.txt provides AI context. One-prompt integration pattern. Works with Claude, Cursor, Copilot. curl https://developers.villa.cash/CLAUDE.txt",
    section: "AI",
    url: "/CLAUDE.txt",
  },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

function calculateScore(
  query: string,
  page: SearchIndexPage,
): { score: number; snippet: string } {
  const queryTokens = tokenize(query);
  const titleTokens = tokenize(page.title);
  const contentTokens = tokenize(page.content);

  let score = 0;
  let matchedContent = "";

  for (const qt of queryTokens) {
    if (titleTokens.some((t) => t.includes(qt) || qt.includes(t))) {
      score += 10;
    }

    for (const ct of contentTokens) {
      if (ct.includes(qt) || qt.includes(ct)) {
        score += 1;
        const idx = page.content.toLowerCase().indexOf(qt);
        if (idx !== -1) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(page.content.length, idx + qt.length + 50);
          matchedContent = page.content.slice(start, end);
        }
      }
    }
  }

  const snippet =
    matchedContent ||
    page.content.slice(0, 100) + (page.content.length > 100 ? "..." : "");

  return { score, snippet };
}

export function search(query: string, limit = 5): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const page of searchIndex) {
    const { score, snippet } = calculateScore(query, page);

    if (score > 0) {
      results.push({
        title: page.title,
        url: page.url,
        description: page.content.slice(0, 150),
        section: page.section,
        snippet,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getSearchIndex(): SearchIndexPage[] {
  return searchIndex;
}
