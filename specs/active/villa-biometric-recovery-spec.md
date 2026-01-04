# Villa Biometric Recovery & Social Guardians

**Status:** DRAFT  
**Design:** Pending  
**Domain:** villa.cash  
**Updated:** January 4, 2026

---

## Goal

Enable Villa residents to recover their passkey-based accounts using their face (1:1 biometric recovery) or trusted village members (N-of-M social recovery), with zero Web3 complexity exposed and full privacy preserved—no biometric data stored, all verification on-device via ZK proofs.

---

## Why This Approach

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Seed phrase backup | Standard, well-understood | Terrible UX, users lose phrases, phishing risk | ❌ |
| Email/SMS recovery (custodial) | Familiar UX | Requires trusted custodian, privacy concerns, SIM swap attacks | ❌ |
| Hardware wallet backup | Very secure | Expensive, requires user to buy/manage device, not beginner-friendly | ❌ |
| Unforgettable face recovery + ZK liveness | Privacy-preserving, deterministic key from face, anti-spoofing | Novel technology, requires camera access | ✅ MLP |
| Safe social recovery module | Battle-tested (Candide/Worldcoin), audited by Ackee | Requires guardians to be available, some on-chain costs | ✅ Phase 2 |
| ZK Email recovery | Privacy-preserving, uses existing email infrastructure | Additional complexity, DKIM dependency | ✅ Phase 3 |

### Decision Rationale

**Face recovery is the flagship differentiator** for Villa Identity. The Unforgettable SDK's fuzzy extractor approach means the same face → the same cryptographic key, without storing any biometric data. Combined with Rarimo Bionetta's ZK liveness proofs, we prevent photo/video/deepfake spoofing entirely on-device.

**Porto accounts already support multiple key types**, including an `External` key type that delegates signature verification to a custom contract. We'll use this to create a `BiometricRecoverySigner` contract that verifies ZK liveness proofs and allows face-derived keys to authorize Porto account recovery.

**Social recovery complements biometric** for cases where users' faces change significantly (aging, accidents) or for users who prefer human-based backup. Village members become living examples of threshold cryptography—educational and practical.

**Gasless is non-negotiable** for recovery flows. Users who've lost access shouldn't need ETH to regain it. Porto's merchant sponsoring via a self-hosted relay handles this.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Villa Identity System                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   Villa SDK      │    │  Porto Dialog    │    │  Unforgettable   │   │
│  │   (Iframe)       │◄──►│  (Passkey Auth)  │    │  (Face Recovery) │   │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│           │                       │                        │             │
│           ▼                       ▼                        ▼             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Villa Gateway API                            │    │
│  │                       (villa.cash)                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│           │                       │                        │             │
│           ▼                       ▼                        ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   TinyCloud      │    │   Porto Relay    │    │   Bionetta       │   │
│  │   (User Storage) │    │   (Microservice) │    │   (ZK Liveness)  │   │
│  └──────────────────┘    └────────┬─────────┘    └──────────────────┘   │
│                                   │                                      │
│                                   ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         Base L2                                  │    │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌────────────────────┐   │    │
│  │  │ Porto       │  │ Biometric       │  │ Social Recovery    │   │    │
│  │  │ Account     │  │ Recovery Signer │  │ Module (Candide)   │   │    │
│  │  │ (EIP-7702)  │  │ (External Key)  │  │                    │   │    │
│  │  └─────────────┘  └─────────────────┘  └────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## User Experience

### Flow 1: Initial Setup (Account Creation with Recovery Backup)

1. **User opens Villa app** → taps "Get Started"
2. **Passkey creation** → Device prompts for Face ID/Touch ID → Porto creates EIP-7702 smart account
3. **User sees success** → "Your Villa ID is ready!"
4. **Optional: Setup face backup** → User taps "Add Face Recovery" in settings
5. **Camera activates** → TensorFlow.js extracts face features (client-side only)
6. **Bionetta generates ZK liveness proof** → proves this is a live person, not photo (~2-5 seconds)
7. **Fuzzy extractor creates vault** → helper data generated from face features
8. **Porto authorizes external key** → BiometricRecoverySigner contract registered with account
9. **Helper data stored** → encrypted vault saved to TinyCloud (user-controlled)
10. **User sees confirmation** → "Face backup enabled. Your face can now recover your account."

### Flow 2: Face Recovery (Device Lost)

1. **User opens Villa on new device** → taps "Recover Account"
2. **User enters nickname** → system finds associated account address
3. **Camera activates** → user sees "Look at the camera"
4. **Bionetta proves liveness** → ZK proof generated on-device (~2-5 seconds)
5. **Fuzzy extractor regenerates key** → vault retrieved from TinyCloud, face features + majority voting → same key
6. **System verifies** → liveness proof verified, face-derived key matches registered external key
7. **Porto authorizes new passkey** → user prompted to create new passkey on new device
8. **Recovery complete** → "Welcome back! Your Villa ID is restored."

### Flow 3: Social Recovery Setup (Add Village Guardians)

1. **User opens settings** → taps "Add Recovery Guardians"
2. **User sees explanation** → "Your guardians can help you recover if you lose access. They can't access your account alone."
3. **User selects threshold** → chooses 2-of-3, 3-of-5, or custom (educational UI explains tradeoffs)
4. **User adds guardians** → enters nicknames or wallet addresses of trusted village members
5. **Guardians receive invitation** → notification/message asking them to accept guardian role
6. **Guardians confirm** → sign message accepting responsibility
7. **On-chain registration** → guardian addresses hashed and stored in social recovery module
8. **User sees confirmation** → "3 guardians added. Recovery requires 2 approvals."

### Flow 4: Social Recovery Execution

1. **User initiates recovery** → on new device, selects "Recover with Guardians"
2. **User contacts guardians** → out-of-band (phone, Signal, in-person at village)
3. **Each guardian sees request** → opens Villa app, sees recovery request with emoji verification code
4. **Guardian verifies via video call** → compares 4 emoji hash with user on call (anti-phishing)
5. **Guardian approves** → signs approval transaction (gasless, sponsored)
6. **Threshold met** → 2-of-3 guardians approved → grace period starts (7 days default)
7. **User receives notification** → "Recovery approved. 7-day waiting period started."
8. **After grace period** → user (or anyone) finalizes recovery
9. **New passkey authorized** → user creates new passkey, old keys revoked
10. **Recovery complete** → "Your Villa ID is restored with new security."

---

## Screens

### Recovery Setup

- **RecoveryOptionsScreen**: Overview of available recovery methods (face, guardians, email)
- **FaceRecoverySetupScreen**: Camera UI with liveness guidance, progress indicators
- **GuardianSetupScreen**: Add/remove guardians, threshold selection, invitation management
- **RecoveryConfirmationScreen**: Success state with backup verification prompt

### Recovery Execution

- **RecoveryInitiationScreen**: Enter nickname, select recovery method
- **FaceRecoveryScanScreen**: Camera UI for face recovery attempt
- **GuardianRecoveryStatusScreen**: Shows guardian approval progress, emoji codes
- **GuardianApprovalScreen**: Guardian's view for approving recovery requests
- **RecoveryGracePeriodScreen**: Countdown to finalization, cancel option for owner
- **RecoveryCompleteScreen**: Success, prompt to create new passkey

---

## UI Boundaries

**Villa controls:**
- All screen layouts and UX copy
- Nickname input and account lookup
- Guardian invitation and management UI
- Recovery status and progress indicators
- Educational content and tooltips
- Error states and retry flows

**External system controls:**
- Porto Dialog for passkey creation/authentication (fullscreen iframe)
- Unforgettable SDK for face enrollment/recovery (integrates into our camera UI)
- Bionetta for ZK liveness proofs (runs client-side, invisible to user)
- Camera permission prompts (browser/OS native)

---

## States

### FaceRecoverySetupScreen

| State | Description | UI Treatment |
|-------|-------------|--------------|
| `idle` | User hasn't started | "Add Face Recovery" button |
| `camera_requesting` | Awaiting camera permission | Loading with permission prompt |
| `camera_denied` | User denied camera | Error with instructions to enable |
| `scanning` | Face detection in progress | Live camera feed with face overlay |
| `face_detected` | Face found, awaiting capture | "Hold still" instruction |
| `proving_liveness` | Bionetta generating ZK proof | Progress bar (~2-5 seconds) |
| `creating_vault` | Fuzzy extractor generating vault | "Securing your face backup..." |
| `registering_key` | Porto authorizing external key | "Registering with your account..." |
| `success` | Setup complete | Confirmation with checkmark |
| `error` | Any failure | Error message with retry button |

### GuardianRecoveryStatusScreen

| State | Description | UI Treatment |
|-------|-------------|--------------|
| `pending_guardians` | Waiting for guardian approvals | List of guardians with status |
| `threshold_met` | Enough approvals received | "Recovery approved!" banner |
| `grace_period` | Waiting for delay to expire | Countdown timer |
| `ready_to_finalize` | Grace period complete | "Finalize Recovery" button |
| `finalizing` | Transaction in progress | Loading spinner |
| `complete` | Recovery successful | Success screen, passkey prompt |
| `cancelled` | Owner cancelled recovery | "Recovery cancelled by owner" |

---

## Session Behavior

| What | TTL | Who Controls | Notes |
|------|-----|--------------|-------|
| Porto session | Until logout | Porto SDK | Persists across page reloads |
| Face recovery vault | Permanent | TinyCloud (user) | Helper data, not biometrics |
| Liveness proof | Single use | Discarded | Generated fresh each attempt |
| Guardian approval signatures | 30 days | Candide service | Can aggregate off-chain |
| Recovery grace period | 7 days default | Smart contract | Configurable per deployment |
| Biometric key derivation | Ephemeral | Client memory | Never persisted |

---

## Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| Porto Account | Villa ID |
| Passkey | Security key / Face ID / Touch ID |
| External key | Face backup |
| Fuzzy extractor | (never shown) |
| ZK liveness proof | (never shown, just "Verifying...") |
| Guardian threshold | Recovery contacts needed |
| Grace period | Waiting period |
| Finalize recovery | Complete recovery |
| BiometricRecoverySigner | Face recovery |
| Helper data | (never shown) |
| Wallet address | Villa ID |
| Smart contract | Account |

---

## Technical

### Data Storage

**TinyCloud (User-Controlled)**:
```
User's Vault:
├── recovery/
│   ├── face/
│   │   ├── vault           # Fuzzy extractor helper data (~135KB)
│   │   ├── enrolledAt      # Timestamp
│   │   └── keyHash         # Porto key hash for verification
│   └── guardians/
│       ├── {guardian1Hash} # Guardian metadata (hashed address)
│       ├── {guardian2Hash}
│       └── threshold       # Required approvals
```

**On-Chain (Base L2)**:
- Porto Account: authorized keys including External key for biometric
- BiometricRecoverySigner: verifies liveness proofs, derives key hash
- SocialRecoveryModule: guardian hashes, threshold, active recovery requests

### Dependencies

**Core SDKs**:
- `@portofi/sdk` — Passkey auth, account management
- `@unforgettable/sdk` — Face enrollment/recovery via fuzzy extractors
- `@rarimo/bionetta` — On-device ZK liveness proofs
- `@tinycloudlabs/web-sdk` — User-controlled storage

**Recovery Infrastructure**:
- `@candide/abstractionkit` — Social recovery module SDK
- `@candide/safe-recovery-service-sdk` — Guardian signature aggregation (optional)

**Utilities**:
- `@tensorflow/tfjs` — Face detection (bundled with Bionetta)
- `viem` — Ethereum interactions
- `wagmi` — React hooks for Web3

### Porto Relay Microservice

**Purpose**: Self-hosted Porto relay for gasless transactions and sponsorship.

**Deployment**:
```yaml
# docker-compose.yml (monorepo service)
services:
  porto-relay:
    image: ghcr.io/ithacaxyz/relay:latest
    ports:
      - "9200:9200"
    environment:
      - RPC_URL=${BASE_RPC_URL}
      - CHAIN_ID=8453
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Gateway Proxy** (Cloudflare):
```
relay.villa.cash → porto-relay:9200
```

### Gas Tank Key Management

**Purpose**: Secure generation, storage, and rotation of the merchant wallet (gas tank) private key that sponsors transactions.

**Key Generation Protocol**:
```bash
# Generate merchant wallet using cast (Foundry)
# Run this ONCE, securely, on a trusted machine

# 1. Generate new wallet
cast wallet new --json > /tmp/merchant-wallet.json

# 2. Extract address and private key
MERCHANT_ADDRESS=$(cat /tmp/merchant-wallet.json | jq -r '.address')
MERCHANT_PRIVATE_KEY=$(cat /tmp/merchant-wallet.json | jq -r '.private_key')

# 3. Display for 1Password entry (copy manually, don't pipe)
echo "Merchant Address: $MERCHANT_ADDRESS"
echo "Private Key: $MERCHANT_PRIVATE_KEY"

# 4. Securely delete temp file
shred -u /tmp/merchant-wallet.json
```

**1Password Storage Structure**:
```
Vault: Villa Infrastructure
├── Villa Gas Tank - Base Sepolia (Testnet)
│   ├── Address: 0x...
│   ├── Private Key: 0x...
│   ├── Chain ID: 84532
│   ├── Faucet URL: https://www.alchemy.com/faucets/base-sepolia
│   └── Notes: Test only, refill weekly
│
├── Villa Gas Tank - Base Mainnet (Production)
│   ├── Address: 0x...
│   ├── Private Key: 0x...
│   ├── Chain ID: 8453
│   ├── Funding Source: Coinbase
│   └── Notes: Production, monitor balance alerts
│
└── Villa Deployer - All Chains
    ├── Address: 0x...
    ├── Private Key: 0x...
    └── Notes: Contract deployment only, minimal balance
```

**GitHub Secrets Configuration**:
```bash
# Use GitHub CLI to set secrets from 1Password
# This keeps keys out of shell history

# For testnet (Base Sepolia)
op read "op://Villa Infrastructure/Villa Gas Tank - Base Sepolia/Private Key" | \
  gh secret set MERCHANT_PRIVATE_KEY_TESTNET --repo your-org/villa-identity

op read "op://Villa Infrastructure/Villa Gas Tank - Base Sepolia/Address" | \
  gh secret set MERCHANT_ADDRESS_TESTNET --repo your-org/villa-identity

# For mainnet (Base)
op read "op://Villa Infrastructure/Villa Gas Tank - Base Mainnet/Private Key" | \
  gh secret set MERCHANT_PRIVATE_KEY --repo your-org/villa-identity

op read "op://Villa Infrastructure/Villa Gas Tank - Base Mainnet/Address" | \
  gh secret set MERCHANT_ADDRESS --repo your-org/villa-identity
```

**Digital Ocean App Platform Secrets**:
```bash
# Set secrets via doctl (for porto-relay and merchant worker)
doctl apps update $APP_ID --spec - <<EOF
name: villa-identity
services:
  - name: porto-relay
    envs:
      - key: MERCHANT_ADDRESS
        value: "${MERCHANT_ADDRESS}"
        scope: RUN_TIME
        type: SECRET
      - key: MERCHANT_PRIVATE_KEY
        value: "${MERCHANT_PRIVATE_KEY}"
        scope: RUN_TIME
        type: SECRET
EOF
```

**Balance Monitoring**:
```typescript
// scripts/monitor-gas-tank.ts
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia, base } from 'viem/chains';

const ALERT_THRESHOLD_ETH = 0.1;
const CRITICAL_THRESHOLD_ETH = 0.01;

async function checkBalance(chain: 'testnet' | 'mainnet') {
  const config = chain === 'testnet' 
    ? { chain: baseSepolia, address: process.env.MERCHANT_ADDRESS_TESTNET }
    : { chain: base, address: process.env.MERCHANT_ADDRESS };
    
  const client = createPublicClient({
    chain: config.chain,
    transport: http(),
  });
  
  const balance = await client.getBalance({ address: config.address as `0x${string}` });
  const ethBalance = parseFloat(formatEther(balance));
  
  if (ethBalance < CRITICAL_THRESHOLD_ETH) {
    console.error(`🚨 CRITICAL: ${chain} gas tank at ${ethBalance} ETH`);
  } else if (ethBalance < ALERT_THRESHOLD_ETH) {
    console.warn(`⚠️ WARNING: ${chain} gas tank at ${ethBalance} ETH`);
  } else {
    console.log(`✅ ${chain} gas tank healthy: ${ethBalance} ETH`);
  }
  
  return ethBalance;
}
```

**Key Rotation Protocol**:
1. Generate new wallet using protocol above
2. Store in 1Password with timestamp suffix (e.g., "Villa Gas Tank - Base Mainnet - 2026-01")
3. Fund new wallet from old wallet
4. Update GitHub/DO secrets
5. Deploy updated services
6. Verify sponsoring works with new key
7. Drain remaining balance from old wallet to new
8. Archive old 1Password entry (don't delete for audit trail)

### Porto Merchant API (Sponsorship)

**Purpose**: Cover gas costs for recovery operations.

**Implementation** (Cloudflare Worker):
```typescript
// workers/porto-merchant/src/index.ts
import { Router, Route } from 'porto/server'

export default Router({ basePath: '/porto' })
  .route('/merchant', Route.merchant({
    address: env.MERCHANT_ADDRESS as `0x${string}`,
    key: env.MERCHANT_PRIVATE_KEY as `0x${string}`,
    sponsor(request) {
      // Sponsor all recovery-related transactions
      const allowedMethods = [
        'authorize',           // Adding new keys
        'revoke',              // Revoking compromised keys
        'confirmRecovery',     // Guardian approvals
        'finalizeRecovery',    // Completing recovery
        'executeRecovery',     // Social recovery execution
      ];
      
      // Check if transaction involves recovery contracts
      const isRecoveryTx = request.calls.some(call => 
        call.to === env.BIOMETRIC_SIGNER_ADDRESS ||
        call.to === env.SOCIAL_RECOVERY_MODULE_ADDRESS ||
        allowedMethods.includes(call.functionName)
      );
      
      return isRecoveryTx;
    },
  }))
```

### BiometricRecoverySigner Contract

**Purpose**: External key type for Porto that verifies face-derived keys via ZK liveness proofs.

```solidity
// contracts/BiometricRecoverySigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IExternalSigner} from "@porto/contracts/interfaces/IExternalSigner.sol";
import {Groth16Verifier} from "@bionetta/contracts/Groth16Verifier.sol";

contract BiometricRecoverySigner is IExternalSigner {
    Groth16Verifier public immutable livenessVerifier;
    
    // Maps account => face-derived key hash (from fuzzy extractor)
    mapping(address => bytes32) public enrolledFaceKeyHashes;
    
    // Maps account => last used nonce (prevents replay)
    mapping(address => uint256) public recoveryNonces;
    
    event FaceEnrolled(address indexed account, bytes32 keyHash);
    event RecoveryExecuted(address indexed account, uint256 nonce);
    
    constructor(address _livenessVerifier) {
        livenessVerifier = Groth16Verifier(_livenessVerifier);
    }
    
    /// @notice Enroll a face-derived key hash for an account
    /// @dev Called during face recovery setup, must be authorized by account owner
    function enrollFace(
        address account,
        bytes32 faceKeyHash,
        bytes calldata livenessProof
    ) external {
        require(msg.sender == account, "Only account owner can enroll");
        require(_verifyLiveness(livenessProof), "Invalid liveness proof");
        
        enrolledFaceKeyHashes[account] = faceKeyHash;
        emit FaceEnrolled(account, faceKeyHash);
    }
    
    /// @notice Verify signature for Porto External key type
    /// @dev Called by Porto account during recovery authorization
    function isValidSignatureWithKeyHash(
        bytes32 digest,
        bytes calldata signature,
        bytes32 keyHash
    ) external view returns (bool) {
        // Decode signature: (livenessProof, faceSignature, nonce)
        (
            bytes memory livenessProof,
            bytes memory faceSignature,
            uint256 nonce
        ) = abi.decode(signature, (bytes, bytes, uint256));
        
        // Verify liveness proof (ZK proof that face capture was live)
        if (!_verifyLiveness(livenessProof)) {
            return false;
        }
        
        // Verify nonce to prevent replay
        if (nonce <= recoveryNonces[msg.sender]) {
            return false;
        }
        
        // Verify face-derived signature matches enrolled key
        address account = msg.sender;
        bytes32 enrolledHash = enrolledFaceKeyHashes[account];
        
        // The keyHash passed should match what Porto has stored
        // and the face signature should verify against the digest
        return _verifyFaceSignature(digest, faceSignature, enrolledHash);
    }
    
    function _verifyLiveness(bytes memory proof) internal view returns (bool) {
        // Decode Groth16 proof and verify against liveness circuit
        // Returns true if proof shows live face capture
        return livenessVerifier.verifyProof(proof);
    }
    
    function _verifyFaceSignature(
        bytes32 digest,
        bytes memory signature,
        bytes32 expectedKeyHash
    ) internal pure returns (bool) {
        // Verify ECDSA signature from face-derived key
        // The key is regenerated client-side from face via fuzzy extractor
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        address recovered = ecrecover(digest, v, r, s);
        bytes32 recoveredHash = keccak256(abi.encode(recovered));
        
        return recoveredHash == expectedKeyHash;
    }
}
```

### Social Recovery Module Integration

**Purpose**: Enable N-of-M guardian recovery using Candide's audited Safe module.

**Module Deployment** (for Porto accounts):
```typescript
// scripts/deploy-social-recovery.ts
import { SocialRecoveryModule } from 'abstractionkit';

// Deploy with 7-day grace period
const gracePeriod = SocialRecoveryModuleGracePeriodSelector.After7Days;
const srm = new SocialRecoveryModule(gracePeriod);

// Enable module on Porto account
const enableModuleTx = srm.createEnableModuleMetaTransaction(portoAccountAddress);

// Add guardians with threshold
const addGuardiansTxs = guardianAddresses.map((guardian, i) => 
  srm.createAddGuardianWithThresholdMetaTransaction(
    guardian,
    i === guardianAddresses.length - 1 ? threshold : BigInt(i + 1)
  )
);
```

### Security Requirements

**Biometric Recovery**:
- Liveness proof required for every recovery attempt (prevents photo/video attacks)
- Face-derived key never stored—regenerated on demand from fuzzy extractor vault
- Helper data (vault) is cryptographically secure—reveals nothing about face or key
- Single-use nonces prevent signature replay
- ~20 bits security from face alone; combine with password for 60+ bits

**Social Recovery**:
- Guardian addresses stored as hashes on-chain (privacy)
- 7-day grace period allows owner to cancel malicious recovery
- Emoji verification prevents social engineering attacks
- Guardians cannot access account funds—only approve ownership changes
- Recommended: include one external/institutional guardian to prevent village collusion

**Sponsorship**:
- Merchant wallet spending limits ($100/day/user suggested)
- Allowlist of recovery-related contract functions only
- Rate limiting on recovery attempts (3 per day per account)

### Performance Expectations

| Operation | Target Latency | Fallback |
|-----------|---------------|----------|
| Face detection | <500ms | Retry with adjusted lighting guidance |
| Liveness proof generation | 2-5 seconds | Progress indicator, allow retry |
| Vault retrieval from TinyCloud | <1 second | Cached locally after first fetch |
| Key regeneration (fuzzy extractor) | <100ms | N/A (client-side only) |
| On-chain key authorization | 2-10 seconds | Pending state with confirmation |
| Guardian signature aggregation | Real-time | Poll every 5 seconds |

**Offline Behavior**:
- Face setup requires network (vault must be stored)
- Face recovery requires network (vault retrieval, on-chain verification)
- Guardian management requires network (on-chain module)
- Recovery request initiation requires network
- Guardian approval can be signed offline, submitted when online

---

## Deployment Considerations

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MERCHANT_ADDRESS_TESTNET` | Yes (testnet) | Gas tank wallet for Base Sepolia |
| `MERCHANT_PRIVATE_KEY_TESTNET` | Yes (testnet) | Private key for testnet gas tank |
| `MERCHANT_ADDRESS` | Yes (prod) | Gas tank wallet for Base mainnet |
| `MERCHANT_PRIVATE_KEY` | Yes (prod) | Private key for mainnet gas tank |
| `DEPLOYER_PRIVATE_KEY` | Yes | Contract deployer wallet (separate from gas tank) |
| `BIOMETRIC_SIGNER_ADDRESS` | Yes | Deployed BiometricRecoverySigner contract |
| `SOCIAL_RECOVERY_MODULE_ADDRESS` | Yes | Deployed SocialRecoveryModule contract |
| `BIONETTA_VERIFIER_ADDRESS` | Yes | Deployed Groth16 liveness verifier |
| `BASE_SEPOLIA_RPC_URL` | Yes (testnet) | Base Sepolia RPC endpoint |
| `BASE_RPC_URL` | Yes (prod) | Base mainnet RPC endpoint |
| `PORTO_RELAY_URL` | Yes | Self-hosted relay URL |
| `BASESCAN_API_KEY` | Yes | For contract verification |
| `UNFORGETTABLE_API_URL` | No | Custom Unforgettable API (default: public) |
| `RECOVERY_RATE_LIMIT` | No | Max recovery attempts/day (default: 3) |
| `GRACE_PERIOD_DAYS` | No | Social recovery delay (default: 7) |

### Platform Quirks

**Porto Relay (Docker)**:
- Must expose port 9200 internally
- Requires direct RPC access to Base
- Health check on `/health` endpoint
- Auto-restarts on failure

**Bionetta (Client-Side)**:
- Requires WASM support (all modern browsers)
- Web Workers for off-main-thread proof generation
- ~15MB initial model download (cached after first use)
- Fails gracefully on Safari iOS <15 (no SharedArrayBuffer)

**Unforgettable SDK**:
- Camera must be HTTPS (secure context required)
- Face detection works best with front-facing camera
- Low-light conditions degrade accuracy—show guidance UI
- X25519 key generation uses WebCrypto API

**Digital Ocean**:
- Use `Spec.Name` not `Name` in doctl commands
- Prune devDependencies before container build
- Workers need minimum 512MB RAM for TensorFlow.js

### Contract Deployment

**Testnet First (Base Sepolia)**:
```bash
# Deploy to Base Sepolia for testing
forge script script/DeployRecovery.s.sol:DeployRecovery \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv

# Deployed addresses saved to deployments/84532.json
```

**Mainnet (Base) - After Testnet Validation**:
```bash
# Deploy to Base mainnet (only after testnet validation passes)
forge script script/DeployRecovery.s.sol:DeployRecovery \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv

# Deployed addresses saved to deployments/8453.json
```

**Deployment Artifacts**:
```
deployments/
├── 84532.json          # Base Sepolia addresses
├── 8453.json           # Base mainnet addresses (after validation)
└── README.md           # Deployment notes and verification links
```

---

## Tasks

### Phase 1: MLP (Face Recovery)

- [ ] Deploy Porto Relay as Docker service in monorepo
- [ ] Create Cloudflare Worker for merchant sponsoring
- [ ] Implement BiometricRecoverySigner contract
- [ ] Deploy Bionetta Groth16 verifier contract
- [ ] Integrate Unforgettable SDK for face enrollment
- [ ] Integrate Bionetta for client-side liveness proofs
- [ ] Build FaceRecoverySetupScreen with camera UI
- [ ] Build FaceRecoveryScanScreen for recovery flow
- [ ] Store vault in TinyCloud with encryption
- [ ] Register External key type with Porto account
- [ ] End-to-end test: setup → device loss → recovery
- [ ] Security audit of BiometricRecoverySigner

### Phase 2: Social Recovery

- [ ] Deploy Candide SocialRecoveryModule (7-day grace period)
- [ ] Build GuardianSetupScreen with threshold selection
- [ ] Build guardian invitation flow (in-app notifications)
- [ ] Build GuardianApprovalScreen with emoji verification
- [ ] Build GuardianRecoveryStatusScreen with progress
- [ ] Implement grace period countdown UI
- [ ] Integrate Candide recovery service for signature aggregation
- [ ] Test 2-of-3, 3-of-5 threshold scenarios
- [ ] Document guardian onboarding for village context

### Phase 3: Email Recovery (Optional)

- [ ] Research ZK Email integration for guardian role
- [ ] Evaluate cost/complexity tradeoffs
- [ ] Spec out email-as-guardian flow

### Infrastructure

- [ ] Set up merchant wallet with appropriate funding
- [ ] Configure spending limits and rate limiting
- [ ] Add monitoring/alerting for relay health
- [ ] Create recovery drills for village education

---

## Acceptance Criteria

### Face Recovery

- [ ] User can add face backup in settings (<30 seconds total)
- [ ] Liveness detection rejects photos/videos with >99% accuracy
- [ ] Face recovery works on new device with same face
- [ ] Different person's face cannot recover account
- [ ] No biometric data stored anywhere (verified via storage audit)
- [ ] Recovery is gasless for user
- [ ] Works on Chrome, Safari, Firefox, Edge (desktop and mobile)
- [ ] Graceful degradation on older browsers without WASM

### Social Recovery

- [ ] User can add 1-7 guardians with custom threshold
- [ ] Guardians can approve recovery from their devices
- [ ] Emoji verification displayed for anti-phishing
- [ ] Owner can cancel recovery during grace period
- [ ] Recovery completes after grace period with threshold met
- [ ] Guardian addresses remain private (hashed on-chain)
- [ ] Guardians don't need ETH to approve (gasless)

### Infrastructure

- [ ] Porto Relay responds to health checks
- [ ] Merchant sponsoring covers recovery transactions
- [ ] Rate limiting prevents abuse
- [ ] Contracts verified on block explorer
- [ ] All secrets stored in DO Secrets (not repo)

### Security

- [ ] BiometricRecoverySigner audit completed
- [ ] Liveness proofs verify correctly on-chain
- [ ] Replay attacks prevented via nonces
- [ ] No private keys in client-side code
- [ ] TinyCloud vault encrypted at rest

---

## Out of Scope

- **Native mobile SDKs** — React Native wrapper planned for v2
- **Face aging compensation** — Users may need to re-enroll after significant aging
- **Object-based recovery** (using photo of object as key) — Future exploration
- **Cross-chain recovery** — Single chain (Base) for MLP
- **Self-hosted Unforgettable API** — Use public API initially
- **Hardware wallet as guardian** — Possible but not prioritized
- **Biometric + password combination** — MLP uses face alone (~20 bits security is acceptable for recovery, not primary auth)

---

## Appendix: Recovery Factor Security Comparison

| Factor | Security Bits | Spoofing Resistance | User Friction | Privacy |
|--------|--------------|---------------------|---------------|---------|
| Passkey (primary) | 128+ | Excellent (hardware) | Very low | Excellent |
| Face + ZK liveness | ~20 | Good (ZK proofs) | Low | Excellent |
| 3-of-5 guardians | Distributed | Good (social verification) | Medium | Good (hashed) |
| Email (ZK Email) | ~40 | Medium (DKIM) | Low | Good |
| Seed phrase | 128+ | N/A | Very high | Poor (if leaked) |

## Appendix: Guardian Threshold Recommendations

| Scenario | Guardians | Threshold | Rationale |
|----------|-----------|-----------|-----------|
| Solo traveler | 3 | 2 | Minimum viable, 1 can be unavailable |
| Couple | 4 | 2 | Each partner + 2 external |
| Village regular | 5 | 3 | Diverse mix of village members |
| High-value account | 7 | 5 | Includes institutional guardian |

## Appendix: Village Guardian Education Script

> "You're being asked to be a Recovery Guardian for [Name]'s Villa ID. This means:
> 
> **What you can do:**
> - Help them recover access if they lose their device
> - Approve a recovery request after verifying it's really them
> 
> **What you cannot do:**
> - Access their account or funds on your own
> - Approve recovery without other guardians also approving
> - See any of their private information
> 
> **How it works:**
> - If they lose access, they'll contact you (probably via Signal or in person)
> - You'll open your Villa app and see a recovery request
> - You'll video call them and compare 4 emoji codes to verify it's really them
> - You tap 'Approve' and sign with your passkey
> - Once enough guardians approve, they wait 7 days (in case of fraud), then access is restored
> 
> **Your responsibility:**
> - Keep your own Villa ID secure
> - Only approve requests after video verification
> - Be reachable (check Villa app occasionally)
> 
> This is like being a trusted neighbor with a spare key—you can help them get back in, but you can't enter alone."

---

## Parallel Execution Decomposition

This section defines how work can be parallelized across multiple Claude Code agents.

### Agent 1: Solidity Expert (Contracts)

**Scope**: All smart contract development, testing, and deployment

**Inputs**:
- `villa-solidity-agent-prompt.md` (system prompt)
- This spec's BiometricRecoverySigner contract section

**Outputs**:
- Foundry project in `packages/contracts/`
- Deployed addresses in `deployments/84532.json`
- All tests passing

**Blocking**: Nothing (can start immediately)

**Blocks**: Agent 3 (SDK integration needs deployed addresses)

### Agent 2: Infrastructure (Relay + Merchant)

**Scope**: Porto relay microservice, merchant sponsoring worker, key management

**Inputs**:
- This spec's Porto Relay Microservice section
- This spec's Gas Tank Key Management section
- This spec's Porto Merchant API section

**Outputs**:
- Docker service in `services/porto-relay/`
- Cloudflare Worker in `workers/porto-merchant/`
- Balance monitoring script
- 1Password entries documented

**Blocking**: Nothing (can start immediately)

**Blocks**: Agent 3 (SDK needs relay URL for integration)

### Agent 3: SDK Integration

**Scope**: Client-side face enrollment, recovery flows, Porto integration

**Inputs**:
- Deployed contract addresses (from Agent 1)
- Relay URL (from Agent 2)
- Unforgettable SDK docs
- Bionetta SDK docs

**Outputs**:
- SDK methods: `enrollFace()`, `recoverWithFace()`
- Camera UI components
- TinyCloud vault storage
- End-to-end tests

**Blocking**: Agents 1 and 2

**Blocks**: Nothing (final integration)

### Agent 4: Social Recovery (Phase 2)

**Scope**: Guardian management, approval flows, Candide integration

**Inputs**:
- This spec's Social Recovery Module Integration section
- Candide AbstractionKit docs

**Outputs**:
- Guardian management UI
- Approval flow with emoji verification
- Grace period handling

**Blocking**: Agent 1 (needs base contracts deployed)

**Blocks**: Nothing (parallel to Agent 3 after Phase 1)

### Execution Order

```
Week 1:
├── Agent 1: Contracts (parallel)
└── Agent 2: Infrastructure (parallel)

Week 2:
├── Agent 1: Testnet deployment + validation
├── Agent 2: Staging environment setup
└── Agent 3: SDK integration begins

Week 3:
├── Agent 3: Face recovery complete
├── Agent 4: Social recovery begins
└── Agent 1: Mainnet deployment (after validation)

Week 4:
├── Agent 4: Social recovery complete
└── All: End-to-end testing + security review
```

### Handoff Artifacts

Each agent produces specific artifacts that unblock the next:

| From | To | Artifact | Location |
|------|-----|----------|----------|
| Agent 1 | Agent 3 | Contract ABIs | `packages/contracts/out/*.json` |
| Agent 1 | Agent 3 | Deployed addresses | `deployments/84532.json` |
| Agent 2 | Agent 3 | Relay URL | `PORTO_RELAY_URL` env var |
| Agent 2 | Agent 3 | Merchant URL | `MERCHANT_API_URL` env var |
| Agent 3 | QA | SDK build | `packages/sdk/dist/` |

---

Ready to build.
