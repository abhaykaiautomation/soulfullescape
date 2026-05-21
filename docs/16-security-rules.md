# 16 — Security Rules

## Purpose

Define the complete security posture of the Soulfullescape platform: authentication enforcement, input validation, data protection, and threat mitigations.

## Business Goal

Protect guest data, prevent fraudulent bookings, and ensure no unauthorised actor can access or manipulate the platform.

---

## Threat Model

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Unauthenticated booking | Direct API call without token | Firebase token verification on every protected route |
| Token forgery | Crafted JWT | Firebase Admin SDK verifies against Google JWK public keys |
| Privilege escalation | Guest calling admin endpoint | Role check from DB after token verification |
| SQL injection | Malicious input in request body | Prisma parameterised queries — no string interpolation |
| XSS | Injected script in user-controlled content | React auto-escapes JSX; no `dangerouslySetInnerHTML` |
| CSRF | Cross-site form submission | Bearer token auth (not cookie-based) — immune to CSRF |
| Overbooking exploit | Race condition on booking endpoint | Serializable DB transaction |
| Secret exposure | Server env vars in client bundle | `NEXT_PUBLIC_` prefix convention; no server vars on client |
| Enumeration (users) | Brute-force login | Firebase handles rate limiting; password reset gives no info |
| Sensitive data logging | Error logs with PII | Never log full request bodies containing PII in production |
| Path traversal | `../` in route params | Next.js and Prisma sanitise ID params; use CUID format |

---

## Authentication Rules

1. **Every API route that mutates data must call `requireAuth()`** — no exceptions.
2. **Every admin API route must call `requireAdmin()`** as the first operation.
3. **Token verification must be server-side** using Firebase Admin SDK — never trust client-provided role claims.
4. **Tokens must not be stored in localStorage** — use Firebase SDK's built-in secure storage (IndexedDB in modern browsers).
5. **Token expiry**: Firebase ID tokens expire after 1 hour. The client SDK auto-refreshes. Never extend expiry manually.

---

## Input Validation Rules

1. **Validate all API inputs with Zod** before any database operation.
2. **Reject requests with unexpected fields** (Zod strict mode where appropriate).
3. **Sanitise phone numbers** — strip whitespace and normalise format before storage.
4. **Validate IDs are valid CUIDs** — `z.string().cuid()` prevents injection via malformed IDs.
5. **Validate numeric fields** — `spotsRequested` must be integer 1–10; enforce server-side regardless of client enforcement.
6. **Validate date fields** — `tripDate` must be a valid ISO datetime string; `startTime`/`endTime` must follow expected format.

---

## Database Security

1. **Parameterised queries only** — Prisma enforces this. Never use `prisma.$queryRaw()` with string interpolation.
2. **Row-level ownership check**: Before returning any booking, verify `booking.userId === currentUser.id` (for guest access) or `role === 'ADMIN'`.
3. **Price stored at booking time** — prevents price manipulation after booking creation.
4. **`spots_booked` never manually editable** — only updated via the booking transaction. No direct field update exposed in admin API.
5. **No hard deletes of users or bookings** — soft delete (status = CANCELLED) preserves audit trail.

---

## Environment Variable Security

```
# PUBLIC (safe in browser bundle — used by Firebase client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# PRIVATE (server-side only — never expose to client)
DATABASE_URL                    # Neon connection string
FIREBASE_PROJECT_ID             # Firebase Admin
FIREBASE_CLIENT_EMAIL           # Firebase Admin
FIREBASE_PRIVATE_KEY            # Firebase Admin private key
TWILIO_ACCOUNT_SID              # Twilio WhatsApp
TWILIO_AUTH_TOKEN               # Twilio auth
TWILIO_WHATSAPP_FROM            # Twilio sender number
```

**Rule:** Any variable without `NEXT_PUBLIC_` prefix is server-only. Never reference server env vars in any file that could be imported by client components.

---

## CORS Policy

Next.js API routes are same-origin by default.

If cross-origin access is ever required (e.g. mobile app):
- Allowlist specific origins: `https://soulfullescape.com`
- Never allow `*` wildcard
- Restrict methods to `GET, POST, PATCH, DELETE, OPTIONS`

---

## Content Security Policy (Phase 2)

Add CSP headers via `next.config.js` to prevent XSS:

```
default-src 'self';
script-src 'self' 'nonce-{nonce}' https://www.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://api.twilio.com https://*.firebaseio.com;
```

---

## Rate Limiting

| Endpoint | Limit | Enforcement |
|---|---|---|
| `POST /api/bookings` | 10/min per IP | Vercel edge config |
| `POST /api/auth/me` | 20/min per IP | Vercel edge config |
| All other API routes | 100/min per IP | Vercel edge config |

---

## Logging & Monitoring

**Do log:**
- API errors (without PII in message)
- WhatsApp send failures (with bookingId, not phone number in production)
- Serialization conflicts (booking race conditions)
- 403/401 responses (auth failures)

**Do NOT log:**
- Full request bodies (may contain phone numbers, emails)
- Firebase tokens
- Database connection strings

---

## Dependency Security

- Use `npm audit` in CI — block deployment if high severity vulnerabilities exist
- Pin dependency versions in `package.json`
- Review Dependabot/Renovate PRs weekly (Phase 2)

---

## Incident Response (Phase 1)

If a security incident is detected:
1. Disable affected Firebase Auth provider (Google/Email) in Firebase console
2. Rotate affected API secrets in Vercel environment variables
3. Redeploy to pick up new secrets
4. Investigate access logs

---

## Acceptance Criteria

- [ ] No server-only env vars referenced in `NEXT_PUBLIC_` or client components
- [ ] All API routes call `requireAuth()` or `requireAdmin()` before any data access
- [ ] Zod validation applied to all POST/PATCH request bodies
- [ ] No `dangerouslySetInnerHTML` usage in any component
- [ ] No raw SQL with string interpolation
- [ ] `npm audit` passes with no high severity issues in CI

## Related Documents

- [11-authentication.md](11-authentication.md)
- [17-role-based-access.md](17-role-based-access.md)
- [26-environment-variables.md](26-environment-variables.md)
- [09-backend-architecture.md](09-backend-architecture.md)
