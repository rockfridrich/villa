# Villa SDK - Plain HTML/JS Example

Zero-dependency integration using postMessage iframe protocol.

## Quick Start

```bash
# Serve locally (any static server works)
npx serve .
# or
python -m http.server 8080
```

Open http://localhost:8080 in your browser.

## How It Works

1. Click "Sign In" to open the Villa auth iframe
2. Complete passkey authentication
3. Receive identity via postMessage

## Message Protocol

```javascript
// Listen for auth events
window.addEventListener('message', (event) => {
  if (!event.origin.includes('villa.cash')) return;
  
  const { type, payload } = event.data;
  
  if (type === 'VILLA_AUTH_SUCCESS') {
    const { identity } = payload;
    // identity = { address, nickname, avatar }
  }
});
```

## Files

- `index.html` - Complete working example (copy-paste ready)

## Requirements

- Modern browser with passkey support
- HTTPS in production (passkeys require secure context)
