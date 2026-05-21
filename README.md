# Soulfullescape

> **Escape. Connect. Recharge.**

A private day-trip booking platform for a hidden destination in Puerto Rico — combining nature, music, food, kayaking, and curated group experiences.

---

## Quick Start

```bash
git clone https://github.com/[org]/soulfullescape.git
cd soulfullescape
npm install
cp .env.example .env.local
# Fill in .env.local — see docs/26-environment-variables.md
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Documentation

All project documentation lives in [`/docs`](./docs/). Start here:

| Doc | Purpose |
|---|---|
| [00-project-overview.md](docs/00-project-overview.md) | What this project is and why |
| [01-vision.md](docs/01-vision.md) | Strategic goals and success metrics |
| [07-system-architecture.md](docs/07-system-architecture.md) | How every layer connects |
| [10-database-schema.md](docs/10-database-schema.md) | Tables, columns, indexes |
| [12-booking-engine.md](docs/12-booking-engine.md) | Core booking logic + overbooking prevention |
| [15-api-design.md](docs/15-api-design.md) | Full API reference |
| [25-deployment-guide.md](docs/25-deployment-guide.md) | How to deploy |
| [26-environment-variables.md](docs/26-environment-variables.md) | Every env var explained |

## Reusable Skills

Implementation guides live in [`/skills`](./skills/):

| Skill | Purpose |
|---|---|
| [booking-system.md](skills/booking-system.md) | End-to-end booking engine |
| [firebase-authentication.md](skills/firebase-authentication.md) | Auth setup and patterns |
| [neon-postgres.md](skills/neon-postgres.md) | Database setup and branching |
| [overbooking-protection.md](skills/overbooking-protection.md) | Concurrency protection |
| [whatsapp-integration.md](skills/whatsapp-integration.md) | Twilio WhatsApp messages |
| [csv-export-system.md](skills/csv-export-system.md) | Admin CSV download |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Auth | Firebase Authentication |
| Hosting | Vercel |
| Notifications | Twilio WhatsApp API |

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production (includes migrations)
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Vitest unit + integration tests
npm run test:e2e     # Playwright end-to-end tests
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed development database
npm run db:migrate   # Create new migration
```

---

## Brand

- **Colors**: Deep navy, tropical teal, sunset orange, golden yellow, warm cream
- **Fonts**: Playfair Display (headings) + Inter (body)
- **Style**: Premium tropical luxury

See [docs/02-brand-guidelines.md](docs/02-brand-guidelines.md) for the full design system.
