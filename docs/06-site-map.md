# 06 — Site Map

## Purpose

Define every route in the application, its access level, and its primary responsibility.

## Business Goal

Ensure the information architecture is logical, complete, and avoids any orphaned or unreachable pages.

---

## Route Structure

```
/ (Public)
├── /                            Landing page — hero, experience, trip listings
├── /trips                       All upcoming trips (alias / or standalone)
├── /trips/[tripId]              Trip detail page
├── /login                       Authentication page (Google + Email)
├── /register                    Registration page
├── /forgot-password             Password reset
│
├── /book/[tripId]               Booking form — requires auth
├── /booking/confirmation/[id]   Booking success screen — requires auth
│
├── /account                     Guest account page — requires auth
│   └── /account/bookings        Guest's booking history
│
└── /admin                       Admin area — requires ADMIN role
    ├── /admin                   Dashboard summary
    ├── /admin/trips             Trip list
    ├── /admin/trips/new         Create trip form
    ├── /admin/trips/[tripId]    Edit trip form
    ├── /admin/bookings          All bookings (filterable by trip)
    └── /admin/bookings/[id]     Individual booking detail
```

---

## Route Access Matrix

| Route | Public | Guest (Auth) | Admin |
|---|---|---|---|
| `/` | ✓ | ✓ | ✓ |
| `/trips` | ✓ | ✓ | ✓ |
| `/trips/[tripId]` | ✓ | ✓ | ✓ |
| `/login` | ✓ | redirect `/` | redirect `/admin` |
| `/register` | ✓ | redirect `/` | redirect `/admin` |
| `/book/[tripId]` | redirect `/login` | ✓ | ✓ |
| `/booking/confirmation/[id]` | redirect `/login` | ✓ (own bookings only) | ✓ |
| `/account` | redirect `/login` | ✓ | ✓ |
| `/account/bookings` | redirect `/login` | ✓ | ✓ |
| `/admin` | redirect `/` | redirect `/` | ✓ |
| `/admin/trips` | redirect `/` | redirect `/` | ✓ |
| `/admin/trips/new` | redirect `/` | redirect `/` | ✓ |
| `/admin/trips/[tripId]` | redirect `/` | redirect `/` | ✓ |
| `/admin/bookings` | redirect `/` | redirect `/` | ✓ |
| `/admin/bookings/[id]` | redirect `/` | redirect `/` | ✓ |

---

## Next.js App Router File Map

```
app/
├── layout.tsx                    Root layout (nav, footer, providers)
├── page.tsx                      Landing page
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── forgot-password/
│   └── page.tsx
├── trips/
│   ├── page.tsx                  All trips listing
│   └── [tripId]/
│       └── page.tsx              Trip detail
├── book/
│   └── [tripId]/
│       └── page.tsx              Booking form (protected)
├── booking/
│   └── confirmation/
│       └── [bookingId]/
│           └── page.tsx          Confirmation screen
├── account/
│   ├── page.tsx                  Account overview (protected)
│   └── bookings/
│       └── page.tsx              My bookings (protected)
└── admin/
    ├── layout.tsx                Admin layout (sidebar nav)
    ├── page.tsx                  Admin dashboard
    ├── trips/
    │   ├── page.tsx              Trip list
    │   ├── new/
    │   │   └── page.tsx          Create trip
    │   └── [tripId]/
    │       └── page.tsx          Edit trip
    └── bookings/
        ├── page.tsx              All bookings
        └── [bookingId]/
            └── page.tsx          Booking detail
```

---

## Navigation Components

### Public Navigation (Header)
- Logo (links to `/`)
- "Upcoming Trips" (links to `/trips` or scrolls to section)
- "Sign In" button (if unauthenticated)
- "My Account" dropdown (if authenticated)

### Admin Navigation (Sidebar)
- Dashboard
- Trips
- Bookings
- (Future: Analytics, Settings)

### Footer
- About Soulfullescape
- Contact / WhatsApp link
- Instagram link
- Privacy Policy link

---

## SEO Considerations

| Route | Page Title | Meta Description |
|---|---|---|
| `/` | "Soulfullescape — Escape. Connect. Recharge." | "Private day trips in Puerto Rico. Nature, music, food, and adventure in a hidden gem destination." |
| `/trips/[tripId]` | `[Trip Title] — Soulfullescape` | Dynamic from trip description |
| `/login` | "Sign In — Soulfullescape" | noindex |
| `/admin/*` | "Admin — Soulfullescape" | noindex |

---

## Edge Cases

- `/book/[tripId]` where trip is cancelled → redirect to `/trips/[tripId]` with toast
- `/booking/confirmation/[id]` where ID doesn't belong to current user → 403 response
- Any admin route where user has no role or `role !== 'ADMIN'` → redirect to `/` with toast

## Related Documents

- [05-user-flows.md](05-user-flows.md)
- [17-role-based-access.md](17-role-based-access.md)
- [15-api-design.md](15-api-design.md)
