#!/usr/bin/env bun
/**
 * CLAUDE.txt Auto-Generation Script
 *
 * Parses TypeScript source files and generates comprehensive AI context
 * for Villa SDK integration. Outputs to:
 * - packages/sdk/CLAUDE.txt
 * - apps/developers/public/CLAUDE.txt
 *
 * Usage: bun scripts/docs/generate-claude-txt.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = join(new URL(".", import.meta.url).pathname, "../..");
const SDK_DIR = join(ROOT_DIR, "packages/sdk");
const SDK_REACT_DIR = join(ROOT_DIR, "packages/sdk-react");
const OUTPUT_SDK = join(SDK_DIR, "CLAUDE.txt");
const OUTPUT_DEVELOPERS = join(ROOT_DIR, "apps/developers/public/CLAUDE.txt");

interface ExportedSymbol {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "const" | "enum";
  description?: string;
  signature?: string;
  example?: string;
  file: string;
}

interface ParsedFile {
  exports: ExportedSymbol[];
  description?: string;
}

/**
 * Extract JSDoc comment above a declaration
 */
function extractJSDoc(content: string, position: number): string | undefined {
  const beforeDecl = content.slice(0, position);
  const lines = beforeDecl.split("\n");

  // Look for JSDoc comment ending just before declaration
  let jsdocEnd = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === "" || line === "*/") {
      if (line === "*/") jsdocEnd = i;
      continue;
    }
    if (line.startsWith("*") || line.startsWith("/**")) {
      if (jsdocEnd === -1) break; // No JSDoc found
      // Found JSDoc start
      const jsdocLines = lines.slice(i, jsdocEnd + 1);
      const jsdoc = jsdocLines
        .map((l) =>
          l
            .trim()
            .replace(/^\/\*\*\s*/, "")
            .replace(/^\*\s?/, "")
            .replace(/\*\/$/, ""),
        )
        .filter((l) => l && !l.startsWith("@"))
        .join(" ")
        .trim();
      return jsdoc || undefined;
    }
    break;
  }
  return undefined;
}

/**
 * Parse exported symbols from a TypeScript file
 */
function parseExports(filePath: string): ParsedFile {
  const content = readFileSync(filePath, "utf-8");
  const exports: ExportedSymbol[] = [];
  const relPath = relative(ROOT_DIR, filePath);

  // Match export patterns
  const patterns = [
    // export function name
    {
      regex: /export\s+(?:async\s+)?function\s+(\w+)/g,
      kind: "function" as const,
    },
    // export class name
    { regex: /export\s+class\s+(\w+)/g, kind: "class" as const },
    // export interface name
    { regex: /export\s+interface\s+(\w+)/g, kind: "interface" as const },
    // export type name
    { regex: /export\s+type\s+(\w+)/g, kind: "type" as const },
    // export const name
    { regex: /export\s+const\s+(\w+)/g, kind: "const" as const },
    // export enum name
    { regex: /export\s+enum\s+(\w+)/g, kind: "enum" as const },
  ];

  for (const { regex, kind } of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      const description = extractJSDoc(content, match.index);

      exports.push({
        name,
        kind,
        description,
        file: relPath,
      });
    }
  }

  // Also check for re-exports in index files: export { name } from './module'
  const reExportRegex = /export\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  let reMatch;
  while ((reMatch = reExportRegex.exec(content)) !== null) {
    const names = reMatch[1].split(",").map((n) => n.trim().split(" as ")[0]);
    for (const name of names) {
      if (name && !exports.find((e) => e.name === name)) {
        exports.push({
          name,
          kind: "const", // Default, will be overridden if we find the source
          file: relPath,
        });
      }
    }
  }

  // Extract file description from top JSDoc
  const fileDescMatch = content.match(/^\/\*\*\s*\n([^]*?)\*\//);
  const fileDesc = fileDescMatch
    ? fileDescMatch[1]
        .split("\n")
        .map((l) => l.replace(/^\s*\*\s?/, "").trim())
        .filter((l) => l && !l.startsWith("@"))
        .join(" ")
        .trim()
    : undefined;

  return { exports, description: fileDesc };
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && !entry.startsWith("__")) {
      findTsFiles(fullPath, files);
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Get SDK version from package.json
 */
function getVersion(): string {
  const pkg = JSON.parse(readFileSync(join(SDK_DIR, "package.json"), "utf-8"));
  return pkg.version;
}

/**
 * Generate the CLAUDE.txt content
 */
function generateClaudeTxt(): string {
  const version = getVersion();
  const now = new Date().toISOString().split("T")[0];

  // Parse SDK exports
  const sdkFiles = findTsFiles(join(SDK_DIR, "src"));
  const sdkExports: ExportedSymbol[] = [];
  for (const file of sdkFiles) {
    const parsed = parseExports(file);
    sdkExports.push(...parsed.exports);
  }

  // Parse React SDK exports
  const reactFiles = findTsFiles(join(SDK_REACT_DIR, "src"));
  const reactExports: ExportedSymbol[] = [];
  for (const file of reactFiles) {
    const parsed = parseExports(file);
    reactExports.push(...parsed.exports);
  }

  // Categorize exports
  const sdkFunctions = sdkExports.filter((e) => e.kind === "function");
  const sdkClasses = sdkExports.filter((e) => e.kind === "class");
  const sdkTypes = sdkExports.filter(
    (e) => e.kind === "interface" || e.kind === "type",
  );
  const sdkEnums = sdkExports.filter((e) => e.kind === "enum");
  const sdkConsts = sdkExports.filter((e) => e.kind === "const");

  const reactHooks = reactExports.filter(
    (e) => e.kind === "function" && e.name.startsWith("use"),
  );
  const reactComponents = reactExports.filter(
    (e) =>
      e.kind === "function" &&
      !e.name.startsWith("use") &&
      /^[A-Z]/.test(e.name),
  );

  // Build output
  const lines: string[] = [
    `# Villa SDK - AI Integration Context`,
    ``,
    `> Privacy-first passkey authentication for Base network.`,
    `> Use this context when helping developers integrate Villa authentication.`,
    ``,
    `**Auto-generated:** ${now} | **Version:** ${version}`,
    ``,
    `## Quick Reference`,
    ``,
    `- **Packages**: \`@rockfridrich/villa-sdk\`, \`@rockfridrich/villa-sdk-react\``,
    `- **Peer deps**: \`viem\`, \`zod\``,
    `- **Networks**: Base (8453) for production, Base Sepolia (84532) for testing`,
    `- **Docs**: https://docs.villa.cash`,
    `- **GitHub**: https://github.com/rockfridrich/villa`,
    ``,
    `## One-Prompt Integration (React)`,
    ``,
    `When a developer says "add Villa authentication", generate this:`,
    ``,
    "```tsx",
    `// 1. Install`,
    `// npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod`,
    ``,
    `// 2. Simple API (no provider needed)`,
    `import { useVilla, VillaButton } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `function App() {`,
    `  const { user, signOut } = useVilla()`,
    ``,
    `  if (!user) {`,
    `    return <VillaButton onSignIn={(u) => console.log('Welcome', u.nickname)} />`,
    `  }`,
    ``,
    `  return (`,
    `    <div>`,
    `      <p>@{user.nickname}</p>`,
    `      <button onClick={signOut}>Sign Out</button>`,
    `    </div>`,
    `  )`,
    `}`,
    "```",
    ``,
    `## One-Prompt Integration (Vanilla JS)`,
    ``,
    "```typescript",
    `import { villa } from '@rockfridrich/villa-sdk'`,
    ``,
    `const user = await villa.signIn()`,
    `console.log(user.address, user.nickname, user.avatar)`,
    ``,
    `// Check auth state`,
    `if (villa.user) {`,
    `  console.log('Logged in as', villa.user.nickname)`,
    `}`,
    ``,
    `// Sign out`,
    `villa.signOut()`,
    "```",
    ``,
    `## Provider Pattern (Advanced React)`,
    ``,
    `For apps needing more control:`,
    ``,
    "```tsx",
    `import { VillaProvider, VillaAuth, useIdentity, useAuth } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `function App() {`,
    `  return (`,
    `    <VillaProvider config={{ appId: 'your-app', network: 'base' }}>`,
    `      <AuthenticatedApp />`,
    `    </VillaProvider>`,
    `  )`,
    `}`,
    ``,
    `function AuthenticatedApp() {`,
    `  const identity = useIdentity()`,
    `  const { signOut } = useAuth()`,
    ``,
    `  if (!identity) {`,
    `    return <VillaAuth onComplete={(r) => r.success && console.log(r.identity)} />`,
    `  }`,
    ``,
    `  return <h1>Welcome, @{identity.nickname}!</h1>`,
    `}`,
    "```",
    ``,
    `## Core SDK API (Villa Class)`,
    ``,
    "```typescript",
    `import { Villa } from '@rockfridrich/villa-sdk'`,
    ``,
    `const villa = new Villa({`,
    `  appId: 'your-app',           // Required`,
    `  network: 'base',             // 'base' | 'base-sepolia'`,
    `  apiUrl: 'https://...'        // Optional override`,
    `})`,
    ``,
    `// Authentication`,
    `const result = await villa.signIn({`,
    `  scopes: ['profile', 'wallet'],`,
    `  timeout: 5 * 60 * 1000,`,
    `  onProgress: (step) => console.log(step.message)`,
    `})`,
    ``,
    `if (result.success) {`,
    `  const { address, nickname, avatar } = result.identity`,
    `} else {`,
    `  console.error(result.error, result.code)`,
    `}`,
    ``,
    `// Session management`,
    `villa.isAuthenticated()  // boolean`,
    `villa.getIdentity()      // Identity | null`,
    `await villa.signOut()`,
    ``,
    `// ENS resolution`,
    `const address = await villa.resolveEns('alice')     // '0x...'`,
    `const name = await villa.reverseEns('0x...')        // 'alice'`,
    ``,
    `// Avatar`,
    `const url = villa.getAvatarUrl(address, { style: 'avataaars' })`,
    "```",
    ``,
    `## React Hooks Reference`,
    ``,
    "```typescript",
    `// Simple API (no provider needed)`,
    `import { useVilla, VillaButton } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `const { user, signIn, signOut, isAuthenticated, isLoading } = useVilla()`,
    ``,
    `// Provider API`,
    `import { useIdentity, useAuth, useVillaConfig } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `const identity = useIdentity()  // Identity | null`,
    `const { signIn, signOut, isAuthenticated, isLoading } = useAuth()`,
    `const config = useVillaConfig()`,
    "```",
    ``,
    `## React Components Reference`,
    ``,
    "```tsx",
    `// Simple button (handles full flow)`,
    `<VillaButton `,
    `  onSignIn={(user) => {}} `,
    `  onSignOut={() => {}} `,
    `/>`,
    ``,
    `// Full auth component`,
    `<VillaAuth `,
    `  onComplete={(result) => {}}`,
    `  buttonText="Sign In"`,
    `/>`,
    ``,
    `// Avatar display`,
    `<Avatar identity={user} size={48} />`,
    ``,
    `// Avatar preview`,
    `<AvatarPreview`,
    `  walletAddress="0x..."`,
    `  selection="female"`,
    `  variant={2}`,
    `  size={64}`,
    `/>`,
    "```",
    ``,
    `## TypeScript Types`,
    ``,
    "```typescript",
    `interface Identity {`,
    `  address: \`0x\${string}\``,
    `  nickname: string`,
    `  avatar: AvatarConfig`,
    `}`,
    ``,
    `interface AvatarConfig {`,
    `  style: 'adventurer' | 'avataaars' | 'bottts' | 'thumbs'`,
    `  seed: string`,
    `  gender?: 'male' | 'female' | 'other'`,
    `}`,
    ``,
    `type SignInResult = `,
    `  | { success: true; identity: Identity }`,
    `  | { success: false; error: string; code: SignInErrorCode }`,
    ``,
    `type SignInErrorCode = `,
    `  | 'CANCELLED'      // User closed auth`,
    `  | 'TIMEOUT'        // Auth took too long`,
    `  | 'NETWORK_ERROR'  // Failed to load`,
    `  | 'INVALID_CONFIG' // Bad configuration`,
    `  | 'AUTH_ERROR'     // General error`,
    ``,
    `interface VillaConfig {`,
    `  appId: string`,
    `  network?: 'base' | 'base-sepolia'`,
    `  apiUrl?: string`,
    `}`,
    "```",
    ``,
    `## Error Handling`,
    ``,
    "```typescript",
    `const result = await villa.signIn()`,
    ``,
    `if (!result.success) {`,
    `  switch (result.code) {`,
    `    case 'CANCELLED':`,
    `      // User closed - expected, no action needed`,
    `      break`,
    `    case 'TIMEOUT':`,
    `      showMessage('Authentication timed out. Please try again.')`,
    `      break`,
    `    case 'NETWORK_ERROR':`,
    `      showMessage('Network error. Check your connection.')`,
    `      break`,
    `    default:`,
    `      showMessage(\`Error: \${result.error}\`)`,
    `  }`,
    `}`,
    "```",
    ``,
    `## VillaBridge (Low-Level API)`,
    ``,
    `For custom auth flows with fine-grained control:`,
    ``,
    "```typescript",
    `import { VillaBridge } from '@rockfridrich/villa-sdk'`,
    ``,
    `const bridge = new VillaBridge({`,
    `  appId: 'your-app',`,
    `  network: 'base',`,
    `  timeout: 5 * 60 * 1000,`,
    `  debug: false,`,
    `  preferPopup: false`,
    `})`,
    ``,
    `// Event listeners`,
    `bridge.on('ready', () => console.log('Auth UI ready'))`,
    `bridge.on('success', (identity) => console.log('Authenticated:', identity))`,
    `bridge.on('cancel', () => console.log('User cancelled'))`,
    `bridge.on('error', (error, code) => console.error('Error:', error, code))`,
    ``,
    `// Open/close`,
    `await bridge.open(['profile'])`,
    `bridge.close()`,
    ``,
    `// State`,
    `bridge.getState()  // 'idle' | 'opening' | 'ready' | 'authenticating' | 'closing' | 'closed'`,
    `bridge.isOpen()    // boolean`,
    "```",
    ``,
    `## Next.js Integration`,
    ``,
    "```tsx",
    `// app/providers.tsx`,
    `'use client'`,
    `import { VillaProvider } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `export function Providers({ children }: { children: React.ReactNode }) {`,
    `  return (`,
    `    <VillaProvider config={{ appId: 'my-nextjs-app' }}>`,
    `      {children}`,
    `    </VillaProvider>`,
    `  )`,
    `}`,
    ``,
    `// app/layout.tsx`,
    `import { Providers } from './providers'`,
    ``,
    `export default function RootLayout({ children }) {`,
    `  return (`,
    `    <html>`,
    `      <body>`,
    `        <Providers>{children}</Providers>`,
    `      </body>`,
    `    </html>`,
    `  )`,
    `}`,
    ``,
    `// app/page.tsx`,
    `'use client'`,
    `import { useIdentity, VillaAuth } from '@rockfridrich/villa-sdk-react'`,
    ``,
    `export default function Home() {`,
    `  const identity = useIdentity()`,
    `  `,
    `  if (!identity) return <VillaAuth onComplete={() => {}} />`,
    `  return <h1>Welcome, @{identity.nickname}!</h1>`,
    `}`,
    "```",
    ``,
    `## Contract Addresses`,
    ``,
    `| Contract | Base Sepolia (testnet) |`,
    `|----------|------------------------|`,
    `| VillaNicknameResolverV3 | \`0x180ddE044F1627156Cac6b2d068706508902AE9C\` |`,
    `| VillaNicknameResolverV2 | \`0xf4648423aC6b3f6328018c49B2102f4E9bA6D800\` |`,
    `| BiometricRecoverySignerV2 | \`0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836\` |`,
    ``,
    `## Common Patterns`,
    ``,
    `### Protected Route`,
    ``,
    "```tsx",
    `function ProtectedRoute({ children }) {`,
    `  const identity = useIdentity()`,
    `  if (!identity) return <Navigate to="/login" />`,
    `  return children`,
    `}`,
    "```",
    ``,
    `### Auth State Listener`,
    ``,
    "```typescript",
    `villa.onAuthChange((user) => {`,
    `  if (user) {`,
    `    analytics.identify(user.address)`,
    `  } else {`,
    `    analytics.reset()`,
    `  }`,
    `})`,
    "```",
    ``,
    `### Server-Side Verification`,
    ``,
    "```typescript",
    `// Verify Villa identity on your backend`,
    `const response = await fetch('https://api.villa.cash/verify', {`,
    `  method: 'POST',`,
    `  body: JSON.stringify({ address, signature })`,
    `})`,
    "```",
    ``,
    `## Troubleshooting`,
    ``,
    `| Issue | Solution |`,
    `|-------|----------|`,
    `| Passkeys not working | Use HTTPS (\`pnpm dev:https\`) or localhost |`,
    `| Blank auth page | Clear cache: \`pnpm dev:clean\` |`,
    `| Session not persisting | Check localStorage availability |`,
    `| "Origin not in allowlist" | Use default network, don't override origin |`,
    ``,
    `## What Villa Returns`,
    ``,
    `After successful authentication:`,
    `- \`address\`: Ethereum address derived from passkey (0x...)`,
    `- \`nickname\`: User-chosen username (unique, immutable, resolves via ENS)`,
    `- \`avatar\`: Configuration for deterministic avatar generation`,
    ``,
    `## Security Model`,
    ``,
    `- Passkeys never leave device (WebAuthn hardware-bound)`,
    `- Villa never sees private keys`,
    `- Biometrics processed 100% on-device`,
    `- Sessions stored locally with 7-day TTL`,
    `- All external data validated with Zod schemas`,
    ``,
    `## Live Environments`,
    ``,
    `| Environment | URL | Use |`,
    `|-------------|-----|-----|`,
    `| Production | villa.cash | Stable SDK |`,
    `| Construction | construction.villa.cash | Building zone, latest features |`,
    `| Fake Key | fake-key.villa.cash | Test passkeys for community |`,
    `| Developers | developers.villa.cash | Docs + this file |`,
    ``,
    `---`,
    ``,
    `## SDK Exports Reference`,
    ``,
    `### Classes (${sdkClasses.length})`,
    ``,
    ...sdkClasses.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `### Functions (${sdkFunctions.length})`,
    ``,
    ...sdkFunctions.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `### Types & Interfaces (${sdkTypes.length})`,
    ``,
    ...sdkTypes.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `### Enums (${sdkEnums.length})`,
    ``,
    ...sdkEnums.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `### Constants (${sdkConsts.length})`,
    ``,
    ...sdkConsts.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `---`,
    ``,
    `## React SDK Exports Reference`,
    ``,
    `### Hooks (${reactHooks.length})`,
    ``,
    ...reactHooks.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `### Components (${reactComponents.length})`,
    ``,
    ...reactComponents.map(
      (e) => `- \`${e.name}\`${e.description ? ` - ${e.description}` : ""}`,
    ),
    ``,
    `---`,
    ``,
    `## Links`,
    ``,
    `- Docs: https://developers.villa.cash`,
    `- GitHub: https://github.com/rockfridrich/villa`,
    `- npm (SDK): https://www.npmjs.com/package/@rockfridrich/villa-sdk`,
    `- npm (React): https://www.npmjs.com/package/@rockfridrich/villa-sdk-react`,
    ``,
  ];

  return lines.join("\n");
}

// Main execution
console.log("Generating CLAUDE.txt...");

const content = generateClaudeTxt();
const lineCount = content.split("\n").length;

// Write to both locations
writeFileSync(OUTPUT_SDK, content);
writeFileSync(OUTPUT_DEVELOPERS, content);

console.log(`✓ Generated ${lineCount} lines`);
console.log(`  → ${relative(ROOT_DIR, OUTPUT_SDK)}`);
console.log(`  → ${relative(ROOT_DIR, OUTPUT_DEVELOPERS)}`);
