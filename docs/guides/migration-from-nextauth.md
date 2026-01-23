# Migration Guide: NextAuth.js to Villa

This guide helps you migrate from NextAuth.js to Villa SDK for authentication.

## Why Migrate?

| Feature        | NextAuth.js              | Villa SDK           |
| -------------- | ------------------------ | ------------------- |
| Auth Method    | OAuth/Credentials        | Passkeys (WebAuthn) |
| Passwords      | Required for credentials | None                |
| Provider Setup | Complex OAuth configs    | Zero config         |
| User Database  | Your responsibility      | Built-in            |
| Identity       | Provider-specific        | Universal Villa ID  |
| Privacy        | Depends on providers     | Privacy-first       |

## Quick Comparison

### Before (NextAuth.js)

```tsx
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Check password against database
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (user && verifyPassword(credentials.password, user.password)) {
          return user;
        }
        return null;
      },
    }),
  ],
  // ... more config
});

export { handler as GET, handler as POST };
```

### After (Villa SDK)

```tsx
// app/providers.tsx
"use client";
import { VillaProvider } from "@rockfridrich/villa-sdk-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VillaProvider config={{ appId: "your-app" }}>{children}</VillaProvider>
  );
}
```

That's it. No API routes, no OAuth setup, no password hashing.

## Step-by-Step Migration

### Step 1: Install Villa SDK

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
npm uninstall next-auth @auth/core
```

### Step 2: Remove NextAuth Configuration

Delete these files:

- `app/api/auth/[...nextauth]/route.ts`
- `auth.ts` or `auth.config.ts`
- Any provider-specific files

Remove from `.env`:

```diff
- NEXTAUTH_SECRET=...
- NEXTAUTH_URL=...
- GOOGLE_CLIENT_ID=...
- GOOGLE_CLIENT_SECRET=...
- GITHUB_ID=...
- GITHUB_SECRET=...
```

### Step 3: Replace SessionProvider

```diff
// app/providers.tsx
'use client'
- import { SessionProvider } from 'next-auth/react'
+ import { VillaProvider } from '@rockfridrich/villa-sdk-react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
-   <SessionProvider>
+   <VillaProvider config={{ appId: 'your-app' }}>
      {children}
-   </SessionProvider>
+   </VillaProvider>
  )
}
```

### Step 4: Replace Auth Hooks

```diff
// components/UserButton.tsx
'use client'
- import { useSession, signIn, signOut } from 'next-auth/react'
+ import { useIdentity, useAuth } from '@rockfridrich/villa-sdk-react'

export function UserButton() {
- const { data: session } = useSession()
+ const identity = useIdentity()
+ const { signIn, signOut } = useAuth()

- if (!session) {
+ if (!identity) {
    return <button onClick={() => signIn()}>Sign In</button>
  }

  return (
    <div>
-     <span>{session.user?.name}</span>
+     <span>@{identity.nickname}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

### Step 5: Replace Auth Components

```diff
// app/login/page.tsx
'use client'
- import { signIn } from 'next-auth/react'
+ import { VillaAuth } from '@rockfridrich/villa-sdk-react'
+ import { useRouter } from 'next/navigation'

export default function LoginPage() {
+ const router = useRouter()

  return (
    <div>
-     <button onClick={() => signIn('google')}>
-       Sign in with Google
-     </button>
-     <button onClick={() => signIn('github')}>
-       Sign in with GitHub
-     </button>
+     <VillaAuth
+       onComplete={(result) => {
+         if (result.success) {
+           router.push('/dashboard')
+         }
+       }}
+     />
    </div>
  )
}
```

### Step 6: Update Protected Routes

```diff
// middleware.ts
- import { withAuth } from 'next-auth/middleware'
-
- export default withAuth({
-   pages: {
-     signIn: '/login',
-   },
- })
+ import { NextResponse } from 'next/server'
+ import type { NextRequest } from 'next/server'
+
+ export function middleware(request: NextRequest) {
+   const session = request.cookies.get('villa-session')
+
+   if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
+     return NextResponse.redirect(new URL('/login', request.url))
+   }
+
+   return NextResponse.next()
+ }

export const config = {
  matcher: '/dashboard/:path*',
}
```

### Step 7: Update Server-Side Auth Checks

```diff
// app/api/protected/route.ts
- import { getServerSession } from 'next-auth'
- import { authOptions } from '@/auth'
+ import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
- const session = await getServerSession(authOptions)
-
- if (!session) {
-   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
- }
-
- return NextResponse.json({ user: session.user })

+ const cookieStore = cookies()
+ const session = cookieStore.get('villa-session')
+
+ if (!session) {
+   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
+ }
+
+ try {
+   const data = JSON.parse(session.value)
+   return NextResponse.json({ user: data.identity })
+ } catch {
+   return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
+ }
}
```

## Data Migration

### User Data

If you have existing users in your database:

1. **Keep your users table** - Villa doesn't require you to store users
2. **Link by wallet address** - When a Villa user signs in, link their `identity.address` to your user record

```typescript
// On first Villa sign-in for existing users
async function linkVillaToExistingUser(villaIdentity, existingUserId) {
  await db.user.update({
    where: { id: existingUserId },
    data: {
      villaAddress: villaIdentity.address,
      villaNickname: villaIdentity.nickname,
    },
  });
}

// On subsequent sign-ins
async function findUserByVilla(villaAddress) {
  return db.user.findUnique({
    where: { villaAddress },
  });
}
```

### Session Data

Villa sessions are simpler:

| NextAuth Session     | Villa Identity                         |
| -------------------- | -------------------------------------- |
| `session.user.id`    | `identity.address`                     |
| `session.user.name`  | `identity.nickname`                    |
| `session.user.email` | N/A (privacy-first)                    |
| `session.user.image` | `villa.getAvatarUrl(identity.address)` |

## Handling Edge Cases

### Users Without Passkey Support

Villa automatically detects passkey support. For browsers that don't support passkeys:

```typescript
import { isPasskeySupported } from "@rockfridrich/villa-sdk";

if (!isPasskeySupported()) {
  // Show alternative sign-in method or upgrade prompt
  showBrowserUpgradeMessage();
}
```

### Multiple Auth Methods (Transition Period)

During migration, you might want both:

```tsx
function LoginPage() {
  const [showLegacy, setShowLegacy] = useState(false);

  return (
    <div>
      <h2>Sign in with Passkey (Recommended)</h2>
      <VillaAuth onComplete={handleVillaAuth} />

      <button onClick={() => setShowLegacy(!showLegacy)}>
        Use legacy sign-in
      </button>

      {showLegacy && (
        <div>
          <button onClick={() => signInWithGoogle()}>Google</button>
          <button onClick={() => signInWithCredentials()}>Email</button>
        </div>
      )}
    </div>
  );
}
```

## Benefits After Migration

1. **No OAuth maintenance** - No more refreshing tokens, handling provider changes
2. **No password security** - No hashing, no breaches, no reset flows
3. **Universal identity** - Users can use their Villa ID across all pop-up village apps
4. **Simpler codebase** - Less auth code to maintain
5. **Better UX** - Face ID/Touch ID is faster than typing passwords

## Troubleshooting

### "Can't find user after migration"

Make sure you're linking by wallet address:

```typescript
// Wrong: Looking up by email (Villa doesn't have email)
const user = await db.user.findUnique({ where: { email } });

// Right: Looking up by Villa address
const user = await db.user.findUnique({
  where: { villaAddress: identity.address },
});
```

### "Sessions not persisting after migration"

Villa uses localStorage, not HTTP-only cookies. For server-side auth:

```typescript
// Client: Sync Villa session to cookie
villa.onAuthChange((user) => {
  if (user) {
    document.cookie = `villa-session=${JSON.stringify(user)};path=/;max-age=604800`;
  } else {
    document.cookie = "villa-session=;path=/;max-age=0";
  }
});
```

### "Type errors after migration"

Update your types:

```typescript
// Before
import type { Session } from "next-auth";
const user: Session["user"] = session?.user;

// After
import type { Identity } from "@rockfridrich/villa-sdk";
const user: Identity | null = identity;
```

## Need Help?

- [Villa Documentation](https://docs.villa.cash)
- [GitHub Issues](https://github.com/rockfridrich/villa/issues)
- [Telegram Community](https://t.me/proofofretreat)
