# Developer App Registration API

API endpoints for registering and managing third-party applications that integrate with Villa's identity services.

## Overview

The Developer API allows wallet owners to register applications, receive API keys, and manage allowed origins for CORS. All endpoints require EIP-191 message signature verification.

## Authentication

All endpoints require wallet signature authentication:

```typescript
// Sign a message with your wallet
const message = `Your action message\nTimestamp: ${Date.now()}`
const signature = await wallet.signMessage(message)

// Include in request
{
  "address": "0x...",
  "message": message,
  "signature": signature,
  // ... other fields
}
```

## Endpoints

### POST /developers/apps

Register a new application.

**Rate Limit:** 5 apps per wallet per 24 hours

**Request:**
```json
{
  "name": "My App",
  "description": "Optional description (max 500 chars)",
  "allowedOrigins": [
    "https://myapp.com",
    "http://localhost:3000"
  ],
  "address": "0x...",
  "message": "Register app: My App\nTimestamp: 1234567890",
  "signature": "0x..."
}
```

**Response (200):**
```json
{
  "id": "app_abc123...",
  "name": "My App",
  "description": "Optional description",
  "apiKey": "vk_live_xyz789...",
  "allowedOrigins": [
    "https://myapp.com",
    "http://localhost:3000"
  ],
  "rateLimit": 100,
  "createdAt": "2026-01-05T00:00:00Z"
}
```

**Validation Rules:**

- **Name:**
  - 3-100 characters
  - Alphanumeric, spaces, hyphens, underscores only

- **Description:**
  - Optional
  - Max 500 characters

- **Allowed Origins:**
  - At least 1 origin required
  - Max 10 origins
  - Must use HTTPS (except localhost)
  - No wildcards
  - No paths, query params, or fragments
  - No duplicate origins

**Error Responses:**

```json
// 400 - Invalid input
{
  "error": "App name must be at least 3 characters",
  "field": "name"
}

// 401 - Invalid signature
{
  "error": "Invalid signature",
  "details": "Signature does not match address and message"
}

// 429 - Rate limit exceeded
{
  "error": "Rate limit exceeded",
  "limit": 5,
  "resetIn": "12 hours",
  "resetAt": "2026-01-05T12:00:00Z"
}
```

---

### GET /developers/apps

List all apps for the authenticated wallet.

**Request:**
```json
{
  "address": "0x...",
  "message": "List apps\nTimestamp: 1234567890",
  "signature": "0x..."
}
```

**Response (200):**
```json
{
  "apps": [
    {
      "id": "app_abc123...",
      "name": "My App",
      "description": "Optional description",
      "apiKey": "vk_live_xyz7...9abc",
      "allowedOrigins": ["https://myapp.com"],
      "rateLimit": 100,
      "createdAt": "2026-01-05T00:00:00Z",
      "updatedAt": "2026-01-05T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Note:** API keys are masked in list view (first 4 and last 4 characters shown).

---

### GET /developers/apps/:id

Get full details for a specific app.

**Request:**
```json
{
  "address": "0x...",
  "message": "Get app\nTimestamp: 1234567890",
  "signature": "0x..."
}
```

**Response (200):**
```json
{
  "id": "app_abc123...",
  "name": "My App",
  "description": "Optional description",
  "apiKey": "vk_live_xyz789...",
  "allowedOrigins": ["https://myapp.com"],
  "rateLimit": 100,
  "createdAt": "2026-01-05T00:00:00Z",
  "updatedAt": "2026-01-05T00:00:00Z"
}
```

**Note:** Full API key is only shown to the app owner.

**Error Responses:**

```json
// 403 - Not the owner
{
  "error": "Forbidden",
  "details": "You do not own this app"
}

// 404 - App not found
{
  "error": "App not found"
}
```

---

## API Keys

### Format

API keys use the format: `vk_live_<64 hex characters>`

Example: `vk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Security

- Store API keys securely (environment variables, secret managers)
- Never commit API keys to version control
- Rotate keys if compromised
- Each app has its own unique key

### Usage

Include the API key in requests to Villa services:

```typescript
fetch('https://api.villa.cash/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
})
```

---

## Origin Validation

Origins must follow these rules:

### Valid Origins

- `https://example.com` - HTTPS domains
- `https://app.example.com` - Subdomains
- `https://example.com:8443` - Custom ports
- `http://localhost` - Localhost HTTP
- `http://localhost:3000` - Localhost with port
- `http://127.0.0.1:3000` - IPv4 localhost

### Invalid Origins

- `http://example.com` - HTTP not allowed (except localhost)
- `https://*.example.com` - Wildcards not allowed
- `https://example.com/path` - Paths not allowed
- `https://example.com?query=1` - Query params not allowed
- `https://example.com#hash` - Fragments not allowed
- `https://example.com:443` - Default ports should be omitted

---

## Rate Limits

### App Registration

- **Limit:** 5 apps per wallet per 24 hours
- **Window:** Rolling 24-hour period
- **Reset:** Automatically after 24 hours from first registration

### API Usage

Each registered app has a default rate limit of **100 requests per minute** across all Villa API endpoints.

---

## Examples

### Register App (Node.js)

```typescript
import { createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0x...')
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http()
})

const message = `Register app: My DApp\nTimestamp: ${Date.now()}`
const signature = await client.signMessage({ message })

const response = await fetch('https://api.villa.cash/developers/apps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My DApp',
    description: 'A decentralized application',
    allowedOrigins: ['https://mydapp.com'],
    address: account.address,
    message,
    signature
  })
})

const data = await response.json()
console.log('API Key:', data.apiKey)
```

### List Apps (Browser)

```typescript
import { useSignMessage } from 'wagmi'

function MyApps() {
  const { signMessageAsync } = useSignMessage()

  async function listApps() {
    const message = `List apps\nTimestamp: ${Date.now()}`
    const signature = await signMessageAsync({ message })

    const response = await fetch('https://api.villa.cash/developers/apps', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x...',
        message,
        signature
      })
    })

    const data = await response.json()
    return data.apps
  }

  // ... render UI
}
```

---

## Database Schema

### developer_apps

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (app_xxx format) |
| name | text | App name |
| description | text | Optional description |
| owner_address | varchar(42) | Ethereum address of owner |
| api_key | text | Unique API key (vk_live_xxx) |
| allowed_origins | text[] | Array of allowed CORS origins |
| rate_limit | integer | Requests per minute (default: 100) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### app_registration_limits

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| address | varchar(42) | Ethereum address |
| registrations_today | integer | Count in current window |
| window_starts_at | timestamp | Window start time |
| created_at | timestamp | Creation timestamp |

---

## Security Considerations

1. **Signature Verification:** All requests verify EIP-191 signatures
2. **Origin Validation:** Strict CORS origin validation prevents XSS
3. **Rate Limiting:** Per-wallet rate limits prevent abuse
4. **API Key Security:** Cryptographically secure random generation
5. **Owner Verification:** Only owners can view full API keys

---

## Support

For issues or questions:
- GitHub: https://github.com/rockfridrich/villa/issues
- Documentation: https://villa.cash/docs
