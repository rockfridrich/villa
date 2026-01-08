# Villa

[![CI](https://github.com/rockfridrich/villa/actions/workflows/ci.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/ci.yml)
[![Deploy](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml/badge.svg)](https://github.com/rockfridrich/villa/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Privacy-first identity for AI-native apps.**

Drop-in passkey authentication, persistent identities, and cross-device sync. Built for developers using AI assistants to ship faster.

## Why Villa?

- **10-line integration** - Fullscreen passkey auth with persistent nicknames and avatars
- **AI-optimized** - Ships with [CLAUDE.txt](https://developers.villa.cash/CLAUDE.txt) for instant AI assistant context
- **Cross-device sync** - Identity follows users across devices via biometric recovery
- **Proof of Retreat ecosystem** - Identity for pop-up village apps (vote, share rides, split bills)

## SDK Quick Start

```bash
npm install @rockfridrich/villa-sdk
```

```typescript
import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'your-app-id',
  appSignature: '0x...',
  appWallet: '0x...'
})

// Open fullscreen passkey auth
const result = await villa.signIn()

if (result.success) {
  console.log(result.identity.nickname)    // "alice"
  console.log(result.identity.walletAddress) // "0x..."
  console.log(result.identity.avatar)       // DiceBear avatar URL
}
```

**What you get:**
- Passwordless auth via Face ID / Touch ID / fingerprint
- Persistent nickname (alice.villa.eth)
- Deterministic avatar generation
- Session management (7-day TTL)
- Cross-device sync via biometric recovery

## For AI Assistants

Villa ships with structured context for AI coding assistants:

```bash
# Add to your AI assistant's context
curl https://developers.villa.cash/CLAUDE.txt
```

**What's included:**
- SDK API reference
- Integration patterns
- Common troubleshooting
- Contract addresses

**Example prompt:**
```
"Add Villa authentication to my Next.js app. Use https://developers.villa.cash/CLAUDE.txt for context."
```

See [developers.villa.cash](https://developers.villa.cash) for full documentation.

## Ecosystem

**Proof of Retreat apps using Villa:**
- **Vote** - Governance for village decisions
- **Rides** - Coordinate transportation
- **Splits** - Group expense tracking
- **More** - Built by the community

## Live Environments

| Environment | URL | Use Case |
|-------------|-----|----------|
| Production | [villa.cash](https://villa.cash) | Stable SDK |
| Staging | [beta.villa.cash](https://beta.villa.cash) | Latest features |
| Developers | [developers.villa.cash](https://developers.villa.cash) | Docs + CLAUDE.txt |

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Local development
pnpm dev:https        # Passkey testing (requires mkcert)
pnpm verify           # Run before every push (typecheck + build + E2E)
```

## Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| VillaNicknameResolverV2 | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` |
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
returned        (passkeys)          (alice.villa.eth)
```

**Privacy model:**
- Passkeys never leave device (WebAuthn)
- Biometrics processed 100% on-device
- User controls all data sharing

## Links

- [Developer Portal](https://developers.villa.cash) - Docs + CLAUDE.txt
- [Telegram](https://t.me/proofofretreat) - Community
- [Porto SDK](https://porto.sh/sdk) - Passkey infrastructure

## Contributing

```bash
git clone https://github.com/rockfridrich/villa.git
cd villa
pnpm install
pnpm dev
pnpm verify  # Before every commit
```

See `.claude/CLAUDE.md` for AI-assisted development workflow.

## License

MIT - Report vulnerabilities: security@villa.cash
