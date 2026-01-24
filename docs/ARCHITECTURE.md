# Architecture

Villa is a privacy-first identity system for pop-up villages, providing passkey authentication on the Base blockchain. This document outlines the system architecture, data flow, and key patterns for contributors.

## Overview

Villa replaces traditional wallet-based authentication with a passkey-first experience. It allows users to create persistent identities (nicknames and avatars) that follow them across devices via biometric recovery, without ever managing a seed phrase or private key.

## System Components

The project is structured as a monorepo with the following core components:

### Applications

- **Hub (`apps/hub`)**: The primary web application and API gateway. It handles profile persistence, database-backed nickname fallbacks, and ENS resolution via CCIP-Read.
- **Key (`apps/key`)**: A thin authentication domain (`key.villa.cash`) dedicated to WebAuthn operations. It isolates passkey logic to ensure hardware-bound keys are tied to a stable origin.
- **Developers (`apps/developers`)**: Documentation, SDK playground, and developer resources.

### Packages

- **SDK (`packages/sdk`)**: Core TypeScript library (`@rockfridrich/villa-sdk`) for third-party integration. Handles iframe bridging and session management.
- **SDK React (`packages/sdk-react`)**: React-specific bindings, providers, and hooks.
- **UI (`packages/ui`)**: Shared design system and Tailwind configuration.

### Smart Contracts

- **Nickname Resolver**: Handles on-chain nickname resolution and ownership.
- **Recovery Signer**: Manages biometric recovery logic for cross-device synchronization.

## Data Flow

### Authentication Flow

1. **Initiation**: The third-party app calls `villa.signIn()` via the SDK.
2. **Iframe Bridge**: The SDK creates a fullscreen iframe pointing to the Key app.
3. **WebAuthn**: The Key app invokes the Porto SDK to trigger a biometric prompt (FaceID/TouchID).
4. **Identity Generation**:
   - On success, the Key app generates a deterministic Ethereum address from the passkey signature.
   - For new users, a PascalCase nickname (e.g., `CosmicFox`) is generated and persisted to the Hub API.
5. **Callback**: The Key app sends the `Identity` object back to the parent window via `postMessage`.
6. **Persistence**: The SDK stores the session in `localStorage` with a 7-day TTL.

### Nickname Resolution

Villa uses a hybrid resolution strategy:

1. **On-chain First**: Attempts to resolve the nickname via the `VillaNicknameResolverV3` contract on Base.
2. **Database Fallback**: If not found on-chain, the Hub API (`/api/ens/resolve`) falls back to the PostgreSQL database for off-chain profiles.

## Architectural Patterns

### 1. Hub-centric API

All user data and metadata APIs reside in the Hub application (`/api/profile`, `/api/ens`, `/api/nicknames`). This centralizes business logic and database access while keeping the Key app focused solely on authentication.

### 2. Thin Key App

The Key app is kept as minimal as possible. Its primary responsibility is to serve as a trusted origin for WebAuthn. It does not store user data beyond the temporary authentication session.

### 3. VillaBridge Communication

Communication between the parent application and the auth iframe is managed by `VillaBridge`. It handles:

- Handshake and "Ready" signals.
- Secure message exchange.
- Origin validation against a trusted allowlist.
- Automatic popup fallback if the iframe is blocked.

### 4. PascalCase Identities

Nicknames are enforced as PascalCase (e.g., `SwiftRaven`). This ensures visual consistency across the ecosystem and avoids ambiguity in human-readable identifiers.

## Security

- **Origin Validation**: Every `postMessage` is validated against a strict allowlist of Villa domains and registered applications.
- **Zod Validation**: All incoming API requests and cross-window messages are validated using Zod schemas.
- **Passkey Privacy**: Biometric data never leaves the user's device. The private key is hardware-bound and only produces signatures.
- **Rate Limiting**: All Hub APIs are rate-limited to prevent enumeration and brute-force attacks.

## Contract Addresses (Base Sepolia)

| Contract                  | Address                                      |
| ------------------------- | -------------------------------------------- |
| VillaNicknameResolverV3   | `0x180ddE044F1627156Cac6b2d068706508902AE9C` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` |

## System Diagram

```text
+-------------------+       (1) signIn()       +-------------------+
|                   +-------------------------->                   |
|  Third-Party App  |                          |     Villa SDK     |
|                   <--------------------------+   (VillaBridge)   |
+---------+---------+       (6) Identity       +---------+---------+
          |                                              |
          |                                       (2) postMessage
          |                                              |
          |          +-----------------------------------+-----------------------------------+
          |          |                                   |                                   |
          v          v                                   v                                   v
+---------+----------+                      +------------+------------+          +------------+------------+
|                    |                      |                        |          |                        |
|      Key App       | <--- (3) Auth -----> |        Hub App         | <--(4)-->|       Base Chain       |
|   (Auth Domain)    |                      |    (API / Database)    |          |    (Smart Contracts)   |
|                    |                      |                        |          |                        |
+---------+----------+                      +------------+------------+          +------------+------------+
          |                                              |                                   |
          | (3a) Porto SDK                               | (3b) Profile Persistence          | (4a) On-chain Names
          | (WebAuthn)                                   | (/api/profile)                    | (4b) Recovery
          +----------------------------------------------+-----------------------------------+
```
