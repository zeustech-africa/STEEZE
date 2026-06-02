# STEEZE CSRF Protection Strategy

**Last Updated:** June 1, 2026
**Version:** 1.0

## Overview
STEEZE implements multiple layers of CSRF protection.

## Protection Mechanisms

| Mechanism | Implementation | Status |
|-----------|----------------|--------|
| SameSite Cookies | `sameSite: 'lax'` | ✅ Active |
| HttpOnly Cookies | `httpOnly: true` | ✅ Active |
| Authentication Required | All state-changing endpoints | ✅ Active |

## Implementation Details

### SameSite Cookies
STEEZE uses `SameSite=Lax` for all authentication cookies, blocking cross-site POST requests while allowing top-level navigation.

### HttpOnly Cookies
Authentication tokens are stored in HttpOnly cookies, inaccessible to JavaScript.

### Authentication Requirement
All POST, PUT, DELETE endpoints require valid authentication.

## Safe vs Unsafe Methods

| Method | Protected |
|--------|-----------|
| GET, HEAD, OPTIONS | ✅ (no state change) |
| POST, PUT, DELETE | ✅ (auth + origin check) |

## Compliance
This strategy meets OWASP Top 10 and GDPR requirements.

## Contact
security@steeze.com