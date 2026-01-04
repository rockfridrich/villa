# Product Vision: Villa

**Spec ID:** PROD-001
**Status:** APPROVED
**Created:** 2026-01-02
**Last Updated:** 2026-01-02

## Vision Statement

Villa is a privacy-first identity and community companion that puts users in complete control of their digital presence. We believe authentication should be passwordless, recovery should not depend on corporations, and personal data should never leave a user's device without explicit consent.

## Problem Space

Current digital identity systems fail users in fundamental ways. Passwords are a security liability that users either make too simple or forget entirely. Account recovery depends on email providers, phone carriers, or centralized services that can deny access at any time. Personal data flows to corporations who monetize it without meaningful consent. Users have no way to prove membership in communities without revealing their full identity.

## Solution Approach

Villa solves these problems through four interconnected capabilities. First, passwordless authentication via Porto ID uses device-native biometrics (Face ID, fingerprint) with passkeys that sync across devices through iCloud or Google. Second, self-sovereign recovery combines face-based backup using Unforgettable technology with ZK social recovery where trusted guardians can help restore access without learning the user's identity on-chain. Third, privacy-preserving community membership uses zero-knowledge proofs to verify someone belongs to a community without revealing who they are. Fourth, local-first architecture keeps all personal data on-device with explicit consent required before anything is shared externally.

## Target Users

Villa serves two primary user segments. The first segment is privacy-conscious individuals who understand the risks of centralized identity, want control over their data, and are comfortable with newer technology patterns like passkeys and ZK proofs. The second segment is community organizers who need to verify membership, coordinate events, and build trust without creating surveillance infrastructure.

## Core Principles

Our product decisions are guided by six principles. Users own their identity, meaning no corporation can revoke access or lock users out. Recovery is self-sovereign through methods that don't depend on third-party cooperation. Privacy is the default, with data staying local unless users explicitly choose to share. Security is not traded for convenience, meaning we won't weaken protection to reduce friction. Open source builds trust, as all code and cryptographic implementations are auditable. Community ownership matters, so map data and shared infrastructure belong to users, not platforms.

## Success Metrics

We measure success through four key metrics. The authentication success rate should exceed 95% of passkey creation attempts completing successfully. The recovery success rate should exceed 90% of users successfully recovering via face or guardian methods. Zero security incidents means no private keys leaked, no unauthorized recoveries, and no data breaches. The community adoption metric tracks the number of communities using Villa for membership verification.

## Roadmap Phases

Phase 1 focuses on identity foundation by implementing Porto ID integration with custom theming, creating the passkey onboarding flow, and establishing basic profile functionality.

Phase 2 adds recovery infrastructure by integrating Unforgettable SDK for face backup, implementing ZK social recovery with guardian management, and building QR and Bluetooth signing flows for air-gapped security.

Phase 3 enables community features by implementing ZK membership proofs, integrating community map data from OpenStreetMap, and creating check-in and presence functionality.

Phase 4 delivers the AI assistant by building local-first AI using WebLLM, adding cloud AI with explicit consent, and creating community knowledge integration.

## Out of Scope

Certain capabilities are explicitly outside Villa's scope. We will not implement custodial key management where Villa holds users' private keys. We will not add centralized identity verification through KYC or government ID requirements. We will not support non-consensual location tracking or background monitoring. We will not include advertising or data monetization of any kind.

## Dependencies

Villa depends on external systems that must remain available and functional. Porto SDK provides the core passkey infrastructure. Unforgettable SDK enables face-based recovery. OpenStreetMap supplies community map data. Ethereum-compatible chains are needed for ZK proof verification if using on-chain guardians.
