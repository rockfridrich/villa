# Villa Relay Service

Porto relay service for gas sponsoring on Base network.

## Overview

This service acts as a relay for Porto UserOperations, providing gas sponsoring for eligible transactions based on merchant configuration.

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Type check
pnpm --filter @villa/relay typecheck

# Run dev server
pnpm --filter @villa/relay dev

# Build
pnpm --filter @villa/relay build

# Run production
pnpm --filter @villa/relay start
```

## Docker

```bash
# Build image
docker build -t villa-relay -f apps/relay/Dockerfile .

# Run with docker-compose (from apps/relay/)
cd apps/relay
docker-compose up

# Health check
curl http://localhost:3001/health
```

## Environment Variables

See `.env.example` for required configuration.

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAIN_ENV` | `testnet` or `production` | `testnet` |
| `BASE_RPC_URL` | Base RPC endpoint | `https://sepolia.base.org` |
| `MERCHANT_PRIVATE_KEY` | Merchant signing key | - |
| `PORT` | Server port | `3001` |

## Network

- **Testnet:** Base Sepolia (Chain ID: 84532)
- **Production:** Base (Chain ID: 8453)

## Endpoints

### GET /health

Returns service health and chain connectivity status.

**Response:**
```json
{
  "status": "ok",
  "chain": "base-sepolia",
  "chainId": 84532,
  "blockNumber": "12345678",
  "timestamp": 1704403200000
}
```

### POST /relay

Relays a UserOperation to Porto bundler with optional gas sponsoring.

**Request:**
```json
{
  "operation": "TRANSFER",
  "target": "0x...",
  "value": "0",
  "data": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x..."
}
```

## Merchant Sponsoring

Gas sponsoring is configured per merchant with:

- **Allowed operations:** Whitelist of operation types
- **Daily gas limits:** Maximum gas per merchant per day
- **Rate limiting:** Per-user transaction limits

See `src/merchant.ts` for sponsoring logic.

## Architecture

```
Client → Porto SDK → Villa Relay → Porto Bundler → Base
                         ↓
                   Gas Sponsoring
                      Decision
```

The relay service:
1. Receives UserOperations from Porto SDK
2. Validates operation against merchant config
3. Sponsors gas if eligible
4. Forwards to Porto bundler
5. Returns transaction hash to client

## Security

- CORS restricted to Villa domains
- Request validation and sanitization
- Merchant private key stored securely
- Rate limiting per user (TODO)
- Gas limit enforcement (TODO)
