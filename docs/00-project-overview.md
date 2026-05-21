# 00 — Project Overview

## Purpose

This document is the single source of truth for the Soulfullescape platform. It exists so that any engineer, designer, or product stakeholder can understand what this project is, why it exists, and how every decision traces back to the core business goal.

## Business Goal

Soulfullescape monetises a hidden private destination in Puerto Rico by selling curated group day-trips. The platform must make discovery, booking, and communication effortless for guests while giving the operator a simple admin surface for trip management.

## Scope

| In Scope | Out of Scope |
|---|---|
| Customer discovery & booking | Multi-vendor marketplace |
| Admin trip management | Third-party tour operators |
| WhatsApp booking notifications | In-app payment processing (Phase 1) |
| Role-based access control | Mobile native app (Phase 1) |
| Neon PostgreSQL persistence | Multi-destination support (Phase 1) |
| Firebase Authentication | |

## Tagline

> **Escape. Connect. Recharge.**

## Experience Pillars

- Nature — untouched jungle and freshwater lake
- Music — curated DJ experiences
- Food — locally sourced communal meals
- Adventure — kayaking, swimming, exploration
- Social Connection — group games, communal spaces
- Relaxation — hammocks, quiet zones, sunset views

## High-Level Architecture Summary

```
Browser / Device
      │
      ▼
 Next.js App (Vercel)
      │
      ├── Firebase Auth (identity)
      ├── Next.js API Routes (business logic)
      │       │
      │       └── Prisma ORM → Neon PostgreSQL
      └── Twilio / Meta Cloud API (WhatsApp)
```

## Key Constraints

- No double-booking: database transactions + overbooking guard enforce seat integrity.
- Admin-only trip creation: RBAC enforced on both client route and API layer.
- WhatsApp-first communication: all booking confirmations delivered via WhatsApp.
- Mobile-first design: >60% of guests expected to book from mobile.

## Related Documents

- [01-vision.md](01-vision.md) — Strategic direction and success metrics
- [07-system-architecture.md](07-system-architecture.md) — Technical system design
- [03-product-requirements.md](03-product-requirements.md) — Functional requirements
