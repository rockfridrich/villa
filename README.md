# Villa

[![CI](https://github.com/rockfridrich/villa/actions/workflows/ci.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/ci.yml)
[![Deploy](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml)

**Passkey authentication for AI-native apps.**

## Quick Start

```bash
npm install @rockfridrich/villa-sdk
```

```typescript
import { villa } from "@rockfridrich/villa-sdk";

const user = await villa.signIn();
// { address: "0x...", nickname: "alice", avatar: "🦊" }
```

That's it. No API keys, no configuration.

## React

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react
```

```tsx
import { useVilla, VillaButton } from "@rockfridrich/villa-sdk-react";

function App() {
  const { user } = useVilla();
  return user ? <p>@{user.nickname}</p> : <VillaButton />;
}
```

## For AI Assistants

```bash
curl https://docs.villa.cash/CLAUDE.txt
```

Works with Claude Code, Cursor, Windsurf, Lovable.

## Links

| Resource | URL |
|----------|-----|
| Docs | [docs.villa.cash](https://docs.villa.cash) |
| AI Context | [CLAUDE.txt](https://docs.villa.cash/CLAUDE.txt) |
| SDK | [npm](https://www.npmjs.com/package/@rockfridrich/villa-sdk) |
| React | [npm](https://www.npmjs.com/package/@rockfridrich/villa-sdk-react) |

## Environments

| Name | URL | Purpose |
|------|-----|---------|
| Production | [villa.cash](https://villa.cash) | Stable |
| Construction | [construction.villa.cash](https://construction.villa.cash) | Preview |
| Docs | [docs.villa.cash](https://docs.villa.cash) | Documentation |

## Development

```bash
bun install
bun dev           # Start all services
bun verify        # Typecheck + lint + test
```

## Infrastructure

All services run on [Railway](https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115).

## License

MIT
