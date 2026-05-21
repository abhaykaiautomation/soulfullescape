# Skill: Neon PostgreSQL

## Purpose

Operational knowledge for configuring, connecting, and managing the Neon PostgreSQL database in the Soulfullescape platform.

## Business Goal

Ensure reliable, performant database operations in a serverless environment without connection exhaustion or slow cold starts.

## Scope

- Neon project and branch setup
- Connection string configuration (pooled vs direct)
- Serverless connection pooling
- Branching for environments
- Migration workflow

---

## Architecture Notes

Neon is a serverless PostgreSQL provider that offers:
1. **Branching** — isolated database branches per environment (like Git branches)
2. **Connection pooling** — PgBouncer built-in for serverless workloads
3. **Autoscaling** — scales to zero when idle; scales up on demand

The most important Neon concept for this project is **using the correct connection string**:
- **Pooled endpoint** → runtime (API routes, all queries)
- **Direct endpoint** → migrations only (`prisma migrate`)

---

## Implementation Details

### Project Structure in Neon

```
Neon Project: soulfullescape
├── Branch: main          → Production database
├── Branch: preview       → PR preview environments
└── Branch: dev           → Local development
```

### Connection Strings

```env
# Runtime — use this for all API queries (PgBouncer pooled)
DATABASE_URL="postgresql://user:pass@ep-pooled-xxx.us-east-1.aws.neon.tech/soulfullescape?sslmode=require&pgbouncer=true"

# Migrations only — direct connection (no PgBouncer)
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-direct-xxx.us-east-1.aws.neon.tech/soulfullescape?sslmode=require"
```

In `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

The `directUrl` tells Prisma to use the unpooled connection for migrations (`prisma migrate deploy`) while using the pooled URL for runtime queries.

### Prisma Client Singleton

Essential for serverless — prevents new connections on every function invocation:

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Folder Structure

```
prisma/
  schema.prisma         Database schema + datasource config
  seed.ts               Development seed data
  migrations/           Auto-generated migration files
lib/
  prisma.ts             Prisma client singleton
```

---

## Branch Management

### Create Branches (Neon CLI)

```bash
# Install CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List projects
neonctl projects list

# Create dev branch
neonctl branches create --name dev --project-id [project-id]

# Get connection string for a branch
neonctl connection-string --branch dev --project-id [project-id]
neonctl connection-string --branch dev --project-id [project-id] --pooled  # pooled
```

### Branch Per PR (Vercel Integration)

Neon + Vercel integration automatically:
1. Creates a Neon branch when a PR is opened
2. Sets `DATABASE_URL` on the Vercel preview deployment to that branch
3. Deletes the branch when the PR is merged/closed

Enable in: Neon Dashboard → Integrations → Vercel

---

## Migration Commands

```bash
# Create new migration (development only)
npx prisma migrate dev --name add_trip_slug

# Apply migrations in production/CI (non-interactive)
npx prisma migrate deploy

# Reset database (development only — destroys data)
npx prisma migrate reset

# Validate schema without applying
npx prisma validate

# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Seed database
npx prisma db seed
```

---

## Connection Limits (Neon Free Tier)

| Plan | Max Connections | Pooled Connections |
|---|---|---|
| Free | 100 direct | ~10,000 (via PgBouncer) |
| Launch | 500 direct | ~10,000 |

Vercel serverless functions each open their own connection. Without pooling, 100 concurrent requests would exhaust the direct connection limit. **Always use the pooled URL for runtime.**

---

## Database Dependencies

No external dependencies — Neon IS the database.

---

## Edge Cases

| Case | Handling |
|---|---|
| Connection string missing `pgbouncer=true` | Connection exhaustion under load |
| Using direct URL for runtime | Potential connection limit errors |
| Using pooled URL for migrations | Prisma migrate fails (PgBouncer doesn't support DDL in pooled mode) |
| Neon branch not created | Clear env var error on startup |
| SSL not required (`sslmode=require` missing) | Connection refused from Neon |

---

## Error Handling

| Error | Cause | Fix |
|---|---|---|
| `Can't reach database server` | Wrong host or SSL config | Verify connection string format |
| `P1001: Can't reach database server` | Neon branch is paused | Wait for wake-up or upgrade plan |
| `P2034: Serialization failure` | Concurrent write conflict | Catch and return 409 in API route |
| `Connection pool timeout` | Too many concurrent requests | Check pooled URL is being used |

---

## Acceptance Criteria

- [ ] `DATABASE_URL` uses pooled endpoint for runtime
- [ ] `DATABASE_URL_UNPOOLED` uses direct endpoint and configured in `schema.prisma` as `directUrl`
- [ ] Prisma client uses singleton pattern
- [ ] `prisma migrate deploy` runs in CI without interactive prompts
- [ ] Neon branching configured for preview environments

## Future Improvements

- Neon + Vercel automatic branch per PR (requires Neon paid plan)
- Query performance monitoring via `pg_stat_statements` extension
- Read replica for admin dashboard queries (Phase 3)

## Related Documents

- [docs/10-database-schema.md](../docs/10-database-schema.md)
- [skills/prisma-orm.md](prisma-orm.md)
- [docs/25-deployment-guide.md](../docs/25-deployment-guide.md)
