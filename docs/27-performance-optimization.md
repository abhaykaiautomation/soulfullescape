# 27 — Performance Optimization

## Purpose

Define the performance targets for Soulfullescape and document the strategies used to achieve them.

## Business Goal

Ensure fast load times on mobile connections — the majority of guests book from phones, often on mobile data.

---

## Performance Targets (Core Web Vitals)

| Metric | Target | Tool |
|---|---|---|
| Largest Contentful Paint (LCP) | < 2.5 s | Lighthouse / PageSpeed |
| First Input Delay (FID) / INP | < 100 ms | CrUX |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Time to First Byte (TTFB) | < 600 ms | Vercel Analytics |
| Total Page Weight (landing) | < 400 KB (gzipped) | Bundle Analyser |
| API p95 response time | < 500 ms | Vercel Function logs |

---

## Image Optimisation

All images served through `next/image`:

```tsx
import Image from 'next/image'

<Image
  src="/images/lake-hero.jpg"
  alt="The lake at Soulfullescape"
  width={1920}
  height={1080}
  priority          // for above-the-fold hero image
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

- Format: WebP (Next.js converts automatically)
- Lazy loading: default for all below-fold images
- `priority` only on hero/LCP image
- Always provide `width`, `height` to prevent CLS
- CDN: Vercel Image Optimisation (built-in)

---

## Font Optimisation

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['600', '700', '800'],
})
```

- `display: 'swap'` prevents invisible text during font load (FOIT)
- Fonts self-hosted by Next.js from Google Fonts (no third-party DNS lookup)
- Only include weights actually used

---

## Bundle Size Management

```bash
# Analyse bundle
ANALYZE=true npm run build
```

Targets:
- Landing page JS: < 150 KB (gzipped)
- Admin dashboard: < 250 KB (gzipped)
- No unused library imports

### Lazy Loading Heavy Components

```tsx
// Admin CSV export — only loaded on admin pages
const CSVExportButton = dynamic(() => import('@/components/admin/CSVExportButton'), {
  loading: () => <Spinner />,
})

// Rich text editor (Phase 2) — only load when needed
const TripDescriptionEditor = dynamic(
  () => import('@/components/admin/TripDescriptionEditor'),
  { ssr: false }
)
```

---

## Rendering Strategy by Route

| Route | Strategy | Cache | Reason |
|---|---|---|---|
| `/` | ISR (60s revalidation) | 60s stale | Trip data changes infrequently |
| `/trips` | ISR (30s) | 30s | Slightly more time-sensitive |
| `/trips/[tripId]` | SSR (no cache) | none | Spot count must be real-time |
| `/admin/*` | CSR | none | Auth-gated, always fresh |
| `/book/*` | CSR | none | Auth-gated, form |

ISR configuration:
```tsx
// app/page.tsx
export const revalidate = 60 // seconds
```

---

## Database Query Optimisation

### Index Usage

All frequently filtered queries hit indexed columns:
- `trips.status` — filter by PUBLISHED
- `trips.tripDate` — sort/filter upcoming
- `bookings.trip_id` — filter bookings per trip
- `users.firebase_uid` — auth lookup (most frequent DB query)

### Projection (Select Only Needed Fields)

```ts
// Don't SELECT * when only a subset is needed for trip cards
const trips = await prisma.trip.findMany({
  select: {
    id: true,
    title: true,
    tripDate: true,
    startTime: true,
    endTime: true,
    capacity: true,
    spotsBooked: true,
    pricePerPerson: true,
    status: true,
  },
  where: { status: 'PUBLISHED', tripDate: { gte: new Date() } },
  orderBy: { tripDate: 'asc' },
})
```

### Connection Pooling

Use Neon's pooled endpoint for all runtime queries. Direct endpoint only for migrations.

```
# Runtime (pooled — critical for serverless)
postgresql://user:pass@ep-pooled.neon.tech/db?pgbouncer=true

# Migrations (direct)
postgresql://user:pass@ep-direct.neon.tech/db
```

---

## Vercel Edge Config

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## Tailwind CSS Purging

Tailwind's JIT mode automatically tree-shakes unused classes. Verify content paths are correct:

```js
// tailwind.config.ts
content: [
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
]
```

---

## Performance Budget Alerts

Phase 2: Add Lighthouse CI to GitHub Actions:

```yaml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      ${{ env.PREVIEW_URL }}
    budgetPath: ./lighthouse-budget.json
```

```json
// lighthouse-budget.json
[{
  "path": "/",
  "timings": [
    { "metric": "interactive", "budget": 5000 },
    { "metric": "first-contentful-paint", "budget": 2000 }
  ],
  "resourceSizes": [
    { "resourceType": "script", "budget": 150 }
  ]
}]
```

---

## Acceptance Criteria

- [ ] Landing page Lighthouse score ≥ 90 on mobile
- [ ] LCP < 2.5s on 4G simulated mobile
- [ ] CLS = 0 (all images have explicit dimensions)
- [ ] No render-blocking resources (fonts use `display: swap`)
- [ ] Vercel Analytics configured and tracking Core Web Vitals

## Related Documents

- [08-frontend-architecture.md](08-frontend-architecture.md)
- [28-seo-strategy.md](28-seo-strategy.md)
- [25-deployment-guide.md](25-deployment-guide.md)
