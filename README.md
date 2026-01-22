# Villa

[![CI](https://github.com/rockfridrich/villa/actions/workflows/ci.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/ci.yml)
[![Deploy](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/rockfridrich/villa/branch/main/graph/badge.svg)](https://codecov.io/gh/rockfridrich/villa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Privacy-first identity for AI-native apps.**

Drop-in passkey authentication, persistent identities, and cross-device sync. Built for developers using AI assistants to ship faster.

## Why Villa?

- **10-line integration** - Fullscreen passkey auth with persistent nicknames and avatars
- **AI-optimized** - Ships with [CLAUDE.txt](https://docs.villa.cash/CLAUDE.txt) for instant AI assistant context
- **Cross-device sync** - Identity follows users across devices via biometric recovery
- **Proof of Retreat ecosystem** - Identity for pop-up village apps (vote, share rides, split bills)

## SDK Quick Start

```bash
npm install @rockfridrich/villa-sdk
```

### Vanilla JavaScript (3 lines)

```typescript
import { villa } from "@rockfridrich/villa-sdk";

const user = await villa.signIn();
console.log(user.address, user.nickname, user.avatar);
```

### React (2 components)

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react
```

```tsx
import { useVilla, VillaButton } from "@rockfridrich/villa-sdk-react";

function App() {
  const { user } = useVilla();

  return user ? (
    <p>Welcome, @{user.nickname}!</p>
  ) : (
    <VillaButton onSignIn={(u) => console.log("Signed in:", u)} />
  );
}
```

**What you get:**

- Passwordless auth via Face ID / Touch ID / fingerprint
- Persistent nickname and avatar
- Automatic session management (7-day TTL)
- Zero configuration required

## For AI Assistants

Villa ships with structured context for AI coding assistants:

```bash
curl https://docs.villa.cash/CLAUDE.txt
```

**Works with:** Claude Code, Cursor, Windsurf, Lovable, GitHub Copilot

**Example prompt:**

```
Add Villa authentication to my Next.js app
```

Your AI already knows how - [CLAUDE.txt](https://docs.villa.cash/CLAUDE.txt) includes:

- Complete API reference with TypeScript types
- React hooks and components
- Next.js integration patterns
- Error handling and troubleshooting

## Documentation

| Resource             | URL                                                                | Description        |
| -------------------- | ------------------------------------------------------------------ | ------------------ |
| **Developer Portal** | [docs.villa.cash](https://docs.villa.cash)                         | Full documentation |
| **AI Context**       | [CLAUDE.txt](https://docs.villa.cash/CLAUDE.txt)                   | For AI assistants  |
| **SDK Reference**    | [npm](https://www.npmjs.com/package/@rockfridrich/villa-sdk)       | API docs           |
| **React Reference**  | [npm](https://www.npmjs.com/package/@rockfridrich/villa-sdk-react) | Component docs     |
| **Source Code**      | [GitHub](https://github.com/rockfridrich/villa)                    | Implementation     |
| **Deploy Status**    | [villa.cash/deployments](https://villa.cash/deployments)           | Live status        |

## Ecosystem

**Proof of Retreat apps using Villa:**

- **Vote** - Governance for village decisions
- **Rides** - Coordinate transportation
- **Splits** - Group expense tracking
- **More** - Built by the community

## Live Environments

| Environment  | URL                                                        | Use Case          |
| ------------ | ---------------------------------------------------------- | ----------------- |
| Production   | [villa.cash](https://villa.cash)                           | Stable SDK        |
| Construction | [construction.villa.cash](https://construction.villa.cash) | Latest features   |
| Docs         | [docs.villa.cash](https://docs.villa.cash)                 | Docs + CLAUDE.txt |

## Development

```bash
bun install          # Install dependencies
bun dev              # Local development
bun dev:https        # Passkey testing (requires mkcert)
bun verify           # Run before every push (typecheck + build + E2E)
```

## Contract Addresses (Base Sepolia)

| Contract                  | Address                                      |
| ------------------------- | -------------------------------------------- |
| VillaNicknameResolverV3   | `0x180ddE044F1627156Cac6b2d068706508902AE9C` |
| VillaNicknameResolverV2   | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` |

## Architecture

```
Your App            Villa           Base Chain
========            =====           ==========
Villa SDK     -->   Fullscreen  --> Smart Contracts
                    iframe          (nicknames, recovery)
    |                 |                   |
    v                 v                   v
Identity        Porto SDK           ENS resolver
returned        (passkeys)          (alice.villa.cash)
```

**Privacy model:**

- Passkeys never leave device (WebAuthn)
- Biometrics processed 100% on-device
- User controls all data sharing

## Links

- [Developer Portal](https://docs.villa.cash) - Docs + CLAUDE.txt
- [Telegram](https://t.me/proofofretreat) - Community
- [Porto SDK](https://porto.sh/sdk) - Passkey infrastructure

## Contributing

```bash
git clone https://github.com/rockfridrich/villa.git
cd villa
bun install
./scripts/doctor.sh  # Verify setup
bun dev              # Start development
bun verify           # Before every commit
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT - Report vulnerabilities: security@villa.cash
