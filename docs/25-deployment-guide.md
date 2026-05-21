# 25 — Deployment Guide

## Purpose

Document the complete deployment process from local development to production, including environment setup, CI/CD pipeline, and rollback procedures.

## Business Goal

Ensure any authorised developer can deploy the platform reliably and consistently without tribal knowledge.

---

## Hosting

| Layer | Provider | Plan |
|---|---|---|
| Frontend + API | Vercel | Pro (for preview environments) |
| Database | Neon PostgreSQL | Launch (branching support) |
| Auth | Firebase | Spark (free) or Blaze |
| WhatsApp | Twilio | Pay-as-you-go |

---

## Environments

| Environment | URL | Neon Branch | Auto-Deploy |
|---|---|---|---|
| Production | `soulfullescape.com` | `main` | On merge to `main` |
| Preview | `pr-[N].soulfullescape.vercel.app` | `preview` | On PR open |
| Development | `localhost:3000` | `dev` (or local PG) | Manual |

---

## Initial Project Setup

### 1. Clone and Install

```bash
git clone https://github.com/[org]/soulfullescape.git
cd soulfullescape
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values. See [26-environment-variables.md](26-environment-variables.md) for the complete reference.

### 3. Set Up Neon Database

```bash
# Install Neon CLI
npm install -g neonctl

# Create dev branch
neonctl branches create --name dev --project-id [your-project-id]

# Get connection string
neonctl connection-string --branch dev
```

Update `DATABASE_URL` in `.env.local` with the **pooled** connection string.

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Set Up Firebase

1. Create Firebase project at console.firebase.google.com
2. Enable Authentication → Sign-in methods → Google + Email/Password
3. Download service account key → fill in Firebase Admin env vars
4. Copy web config values → fill in `NEXT_PUBLIC_FIREBASE_*` vars

### 6. Start Development Server

```bash
npm run dev
```

---

## Vercel Deployment

### First Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Link to existing project
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add FIREBASE_PRIVATE_KEY production
# ... (all vars from .env.example)
```

### Production Deployment

Production deploys automatically on merge to `main`. Manual deploy:

```bash
vercel --prod
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          BASE_URL: ${{ steps.deploy.outputs.url }}
```

---

## Database Migration in Production

**Never run `prisma migrate dev` in production** — it can drop data.

Use:
```bash
npx prisma migrate deploy
```

This applies pending migrations without interactive prompts. Run as part of the deployment process:

```bash
# package.json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

Migrations run automatically on Vercel via the build command.

---

## Rollback Procedure

### Option 1: Vercel Instant Rollback

1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Vercel instantly reverts (< 1 minute)

### Option 2: Git Revert

```bash
git revert HEAD
git push origin main
# CI/CD deploys the revert commit
```

### Option 3: Database Rollback

If a migration caused issues:
```bash
npx prisma migrate resolve --rolled-back [migration-name]
```

**Warning:** Never roll back a migration that has removed columns — data is already lost. Always add, never remove, in Phase 1.

---

## Post-Deployment Checklist

After every production deployment:
- [ ] Landing page loads correctly
- [ ] Trip listing shows upcoming trips
- [ ] Sign in with Google works
- [ ] Booking form submits successfully (test with test user)
- [ ] Admin dashboard accessible at `/admin`
- [ ] WhatsApp confirmation received on test booking
- [ ] No errors in Vercel function logs

---

## Monitoring

Phase 1 monitoring:
- Vercel Analytics (built-in): deployment health, function errors
- Neon dashboard: query performance, connection counts
- Firebase console: auth error rates

Phase 2:
- Sentry for error tracking
- Axiom or Logflare for structured logging
- Uptime monitoring (Better Uptime)

---

## Domain Setup

1. Purchase domain at Namecheap / Cloudflare Registrar
2. Add to Vercel: Settings → Domains → Add
3. Update DNS: CNAME record → `cname.vercel-dns.com`
4. SSL: Vercel provides Let's Encrypt automatically

---

## Acceptance Criteria

- [ ] `npm run dev` works from clean clone after `.env.local` setup
- [ ] Migrations run automatically on Vercel build
- [ ] PR preview environments deploy independently with preview DB branch
- [ ] Production rollback achievable in < 5 minutes
- [ ] All env vars documented in `.env.example` with descriptions

## Related Documents

- [26-environment-variables.md](26-environment-variables.md)
- [07-system-architecture.md](07-system-architecture.md)
- [24-testing-strategy.md](24-testing-strategy.md)
