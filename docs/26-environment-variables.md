# 26 — Environment Variables

## Purpose

Document every environment variable, its purpose, where to find its value, and whether it is safe to expose to the browser.

## Business Goal

Ensure zero configuration secrets are committed to source control, and any developer can fully configure the application from this reference.

---

## Variable Reference

### Database

| Variable | Required | Client? | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | No | Neon PostgreSQL **pooled** connection string (with PgBouncer). Format: `postgresql://[user]:[password]@[host]/[db]?sslmode=require&pgbouncer=true` |
| `DATABASE_URL_UNPOOLED` | Yes (migrations) | No | Neon **direct** connection string (without PgBouncer). Used by Prisma for schema migrations only. |

### Firebase (Client SDK)

These are safe to expose in the browser — they identify your Firebase project but do not grant server-side access.

| Variable | Required | Client? | Description |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | **Yes** | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | **Yes** | Auth domain (e.g. `project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | **Yes** | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | **Yes** | Storage bucket (e.g. `project.appspot.com`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | **Yes** | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | **Yes** | Firebase app ID |

### Firebase (Admin SDK — Server Only)

**Never expose these to the client.** They grant full Firebase Admin access.

| Variable | Required | Client? | Description |
|---|---|---|---|
| `FIREBASE_PROJECT_ID` | Yes | No | Same project ID as above — used by Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Yes | No | Service account email (from Firebase service account JSON) |
| `FIREBASE_PRIVATE_KEY` | Yes | No | Service account private key. **Store with literal `\n` for newlines** (not actual newlines in env var). |

### WhatsApp / Twilio

| Variable | Required | Client? | Description |
|---|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | No | Twilio account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Yes | No | Twilio auth token (never expose) |
| `TWILIO_WHATSAPP_FROM` | Yes | No | Twilio WhatsApp sender number (e.g. `+14155238886`) |

### Application

| Variable | Required | Client? | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | **Yes** | Public URL of the app (e.g. `https://soulfullescape.com` or `http://localhost:3000`) |
| `NODE_ENV` | Auto | No | Set by Next.js: `development`, `production`, `test` |

---

## `.env.example` File

```env
# ============================================================
# DATABASE (Neon PostgreSQL)
# ============================================================
# Pooled connection string — use for runtime
DATABASE_URL="postgresql://[user]:[password]@[pooled-host]/[db]?sslmode=require&pgbouncer=true"
# Direct connection string — use for migrations only
DATABASE_URL_UNPOOLED="postgresql://[user]:[password]@[direct-host]/[db]?sslmode=require"

# ============================================================
# FIREBASE — CLIENT SDK (safe to expose)
# ============================================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# ============================================================
# FIREBASE — ADMIN SDK (server only — never expose)
# ============================================================
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
# Paste the private key value with literal \n for line breaks:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"

# ============================================================
# TWILIO / WHATSAPP
# ============================================================
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_WHATSAPP_FROM="+14155238886"

# ============================================================
# APPLICATION
# ============================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Firebase Private Key Handling

The Firebase private key contains actual newlines which cause issues in `.env` files and CI systems. Two approaches:

### Approach A: Literal `\n` (recommended)
Store the key as a single-line string with literal `\n` characters.

In `lib/config.ts`, convert them back:
```ts
firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
```

### Approach B: Base64 encode
```bash
# Encode
echo -n "$FIREBASE_PRIVATE_KEY" | base64

# Decode in config.ts
Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64!, 'base64').toString('utf-8')
```

---

## Startup Validation

```ts
// lib/config.ts
const required = [
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
]

export function validateEnv() {
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

Called in API route initialisation so missing vars fail loudly on first request.

---

## Vercel Environment Variable Setup

Set each variable in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Assign to appropriate environments:
- `DATABASE_URL` → Production, Preview, Development
- `TWILIO_*` → Production only (use sandbox for Preview)

---

## Secrets That Must NEVER Be Committed

- `FIREBASE_PRIVATE_KEY`
- `TWILIO_AUTH_TOKEN`
- `DATABASE_URL` (contains password)
- `DATABASE_URL_UNPOOLED` (contains password)

These are in `.gitignore` via `.env.local` exclusion. The `.env.example` file contains placeholder values only and is committed to the repo.

---

## Acceptance Criteria

- [ ] `.env.example` committed to repo with all variables and placeholder values
- [ ] `.env.local` excluded via `.gitignore`
- [ ] `validateEnv()` called on server startup
- [ ] No `NEXT_PUBLIC_` prefix on any server-only secrets
- [ ] All Vercel environment variables set for all environments

## Related Documents

- [16-security-rules.md](16-security-rules.md)
- [25-deployment-guide.md](25-deployment-guide.md)
- [11-authentication.md](11-authentication.md)
