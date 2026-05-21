# Skill: Deployment

## Purpose

Step-by-step operational guide for deploying Soulfullescape to Vercel, including environment setup, migration, and rollback.

## Business Goal

Any authorised developer can deploy a working production environment in under 30 minutes.

## Scope

- Vercel project setup
- Environment variable configuration
- Database migration in deployment
- Preview deployments
- Rollback

---

## Architecture Notes

Deployment is fully managed by Vercel connected to a GitHub repository. Pushing to `main` triggers a production deploy. PRs trigger preview deploys. No manual server management required.

```
GitHub PR merge to main
  └── Vercel builds project
        ├── npm ci
        ├── prisma generate
        ├── prisma migrate deploy (via build script)
        └── next build
              └── Deploys to Vercel edge network
```

---

## Implementation Details

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:migrate": "prisma migrate dev"
  }
}
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### First-Time Setup Commands

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link project
vercel link

# 3. Set each environment variable
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_WHATSAPP_FROM production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# ... all remaining NEXT_PUBLIC_ vars

# 4. Deploy
vercel --prod
```

### Preview Environment Variables

For preview deployments, use a different `DATABASE_URL` pointing to a Neon preview branch. Set with:

```bash
vercel env add DATABASE_URL preview
# Enter the pooled connection string for the preview Neon branch
```

---

## Deployment Checklist

Before every production deployment:
- [ ] `npm run type-check` — no TypeScript errors
- [ ] `npm run lint` — no ESLint errors
- [ ] `npm run test` — all tests pass
- [ ] Migrations in `prisma/migrations/` committed to repo
- [ ] No `.env.local` changes needed (all env vars set in Vercel)

After every production deployment:
- [ ] Landing page loads
- [ ] One test booking end-to-end
- [ ] Admin dashboard accessible
- [ ] No errors in Vercel Function logs (check within 5 minutes)

---

## Rollback

### Instant Rollback (Vercel Dashboard)
1. Vercel Dashboard → Project → Deployments
2. Find last working deployment
3. Click "..." menu → "Promote to Production"
4. Vercel re-routes production traffic instantly

### Git Revert
```bash
git revert HEAD --no-edit
git push origin main
```

### Database Rollback (Emergency Only)
If a migration caused data issues:
```bash
# Mark migration as rolled back (does NOT restore data)
npx prisma migrate resolve --rolled-back [migration_name]

# Then fix the schema and create a corrective migration
npx prisma migrate dev --name fix_migration_issue
```

**Warning:** Never roll back a migration that removed columns — the data is already gone. Always add-only in Phase 1.

---

## Folder Structure

```
.
├── vercel.json             Vercel project config
├── next.config.js          Next.js build config
├── prisma/
│   ├── schema.prisma       DB schema
│   ├── seed.ts
│   └── migrations/         Committed migration files
├── .env.example            Variable template (committed)
├── .env.local              Local config (gitignored)
└── .gitignore
```

---

## Related Components

- `prisma/migrations/` — must be committed to repo for `migrate deploy` to work
- `.env.example` — template for all required variables

---

## Database Dependencies

- Neon PostgreSQL — requires `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct)
- Migrations run during Vercel build via `prisma migrate deploy`

---

## Edge Cases

| Case | Handling |
|---|---|
| Migration fails during build | Build fails; Vercel does not deploy; fix migration and retry |
| Missing env var | `validateEnv()` throws on first API request; clear error in logs |
| Neon branch paused (free tier) | Connection refused; upgrade plan or manually resume |
| Preview deploy with wrong DB | Set preview env var to correct Neon branch |

---

## Error Handling

| Error | Cause | Fix |
|---|---|---|
| `P1001` in production | DATABASE_URL wrong or Neon paused | Verify connection string; check Neon dashboard |
| Build fails at `prisma migrate deploy` | Migration file missing from repo | Commit migration files |
| 401 on all API routes | FIREBASE_PRIVATE_KEY missing or malformed | Check `\n` conversion in config.ts |
| WhatsApp send fails | TWILIO vars missing in env | Add to Vercel environment variables |

---

## Acceptance Criteria

- [ ] `npm run build` succeeds locally before pushing
- [ ] All env vars set in Vercel for Production AND Preview environments
- [ ] Migration files committed to Git
- [ ] Production rollback achievable in < 5 minutes via Vercel dashboard
- [ ] Post-deploy checklist completed after every production deploy

## Future Improvements

- GitHub Actions CI gate before Vercel deployment
- Automated post-deploy health check URL ping
- Slack notification on deployment success/failure
- Separate staging environment (Vercel project)

## Related Documents

- [docs/25-deployment-guide.md](../docs/25-deployment-guide.md)
- [docs/26-environment-variables.md](../docs/26-environment-variables.md)
- [skills/neon-postgres.md](neon-postgres.md)
