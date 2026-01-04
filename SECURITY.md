# Security Policy

Villa is a privacy-first passkey authentication system. We take security seriously.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release | :white_check_mark: |
| beta.villa.cash | :white_check_mark: |
| dev-*.villa.cash | :x: (preview only) |

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email:** security@villa.cash (or create private security advisory)
2. **GitHub:** Use [Security Advisories](https://github.com/rockfridrich/villa/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | 24-48 hours |
| Initial assessment | 72 hours |
| Fix development | 1-2 weeks |
| Disclosure coordination | After fix deployed |

## Bug Bounty Program

We offer rewards for responsibly disclosed security vulnerabilities.

### Scope

**In Scope:**
- `villa.cash` (production)
- `beta.villa.cash` (staging)
- Authentication bypasses
- Data exposure
- XSS, CSRF, injection attacks
- Passkey/WebAuthn vulnerabilities
- Porto SDK integration issues

**Out of Scope:**
- `dev-*.villa.cash` (preview environments)
- Denial of Service (DoS)
- Social engineering
- Physical attacks
- Third-party services (Porto, DigitalOcean)
- Issues already reported
- Issues in dependencies (report upstream)

### Rewards

| Severity | Impact | Reward |
|----------|--------|--------|
| Critical | Auth bypass, data breach | $500-1000 |
| High | Privilege escalation, XSS | $200-500 |
| Medium | Information disclosure | $50-200 |
| Low | Best practice violations | Swag/Thanks |

*Rewards are discretionary and depend on impact and quality of report.*

### Rules

1. **No disruption:** Don't degrade service or access other users' data
2. **No data exfiltration:** If you find user data, stop and report
3. **Good faith:** Act in good faith and follow responsible disclosure
4. **One report per issue:** Don't submit duplicates
5. **Allow fix time:** Give us reasonable time to fix before disclosure

## Security Architecture

### Authentication

- **Passkeys only:** No passwords, no SMS, no email magic links
- **Porto SDK:** WebAuthn handled by Porto infrastructure
- **No secrets stored:** Villa never sees private keys

### Data Privacy

- **Minimal data:** Only display name and Villa ID
- **No tracking:** No analytics, no cookies, no fingerprinting
- **Local-first:** Most state in browser localStorage

### Infrastructure

- **HTTPS everywhere:** All domains use TLS 1.2+
- **CSP headers:** Strict Content-Security-Policy
- **No secrets in code:** Environment variables only
- **Isolated environments:** Prod/staging/preview separated

### Code Security

- **TypeScript strict:** No `any` types
- **Input validation:** Zod schemas
- **Dependency updates:** Dependabot enabled
- **CI security checks:** Automated on every PR

## Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [strict policy]
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Acknowledgments

We thank the following researchers for responsible disclosure:

*No reports yet - be the first!*

---

**Last updated:** 2025-01-04
