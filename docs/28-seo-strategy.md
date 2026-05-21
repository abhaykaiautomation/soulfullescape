# 28 — SEO Strategy

## Purpose

Define the SEO strategy for Soulfullescape — how the platform will be discovered organically and how every page is optimised for search engines.

## Business Goal

Drive organic discovery from travellers searching for unique Puerto Rico day trips, reducing dependence on Instagram referrals for new guests.

---

## Target Keywords

### Primary
- "private day trip Puerto Rico"
- "hidden gem Puerto Rico"
- "unique day trip Puerto Rico"
- "lake kayaking Puerto Rico"

### Secondary
- "things to do Puerto Rico weekend"
- "group trip Puerto Rico"
- "nature experience Puerto Rico"
- "off the beaten path Puerto Rico"

### Long-tail
- "private lake kayaking Puerto Rico"
- "DJ experience nature Puerto Rico"
- "exclusive day trip Puerto Rico jungle"

---

## Page-Level SEO

### Landing Page (`/`)

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Soulfullescape — Escape. Connect. Recharge.',
  description:
    'Private day trips to a hidden gem destination in Puerto Rico. Nature, music, kayaking, food, and unforgettable group experiences.',
  keywords: 'Puerto Rico day trip, private lake, kayaking, hidden gem, group experience',
  openGraph: {
    title: 'Soulfullescape — Escape. Connect. Recharge.',
    description: 'Private day trips to a hidden gem in Puerto Rico.',
    url: 'https://soulfullescape.com',
    siteName: 'Soulfullescape',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soulfullescape — Escape. Connect. Recharge.',
    description: 'Private day trips to a hidden gem in Puerto Rico.',
    images: ['/og-image.jpg'],
  },
}
```

### Trip Detail Pages (`/trips/[tripId]`)

```tsx
// app/trips/[tripId]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const trip = await getTrip(params.tripId)
  return {
    title: `${trip.title} — Soulfullescape`,
    description: trip.description.slice(0, 160),
    openGraph: {
      title: `${trip.title} — Soulfullescape`,
      description: trip.description.slice(0, 160),
    },
  }
}
```

### Admin / Auth Pages

```tsx
// app/admin/layout.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },   // noindex admin pages
}

// app/login/page.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },   // noindex auth pages
}
```

---

## Structured Data

### Organization Schema (Landing Page)

```tsx
// components/seo/OrganizationSchema.tsx
const schema = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: 'Soulfullescape',
  description: 'Private day trips to a hidden gem destination in Puerto Rico',
  url: 'https://soulfullescape.com',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'PR',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'reservations',
    availableLanguage: ['English', 'Spanish'],
  },
}

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Event Schema (Trip Detail Page)

```tsx
const eventSchema = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: trip.title,
  startDate: trip.tripDate,
  endDate: trip.tripDate,
  description: trip.description,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: 'Soulfullescape',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'PR',
      addressCountry: 'US',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'Soulfullescape',
    url: 'https://soulfullescape.com',
  },
  offers: {
    '@type': 'Offer',
    price: trip.pricePerPerson,
    priceCurrency: 'USD',
    availability: trip.status === 'FULL'
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    validFrom: trip.createdAt,
  },
}
```

---

## Sitemap

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await prisma.trip.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
  })

  return [
    {
      url: 'https://soulfullescape.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://soulfullescape.com/trips',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...trips.map(trip => ({
      url: `https://soulfullescape.com/trips/${trip.id}`,
      lastModified: trip.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
```

---

## robots.txt

```tsx
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/api/'],
    },
    sitemap: 'https://soulfullescape.com/sitemap.xml',
  }
}
```

---

## Content SEO

### Landing Page Copy Priorities

1. **H1**: Contains primary keyword naturally — "Private Day Trips in Puerto Rico"
2. **H2 sections**: Break up experience pillars with keyword-rich headings
3. **Trip descriptions**: Admin writes 150–300 word descriptions per trip — target long-tail keywords
4. **Alt text**: All images have descriptive alt text (not keyword-stuffed)

### URL Structure

- Short, readable slugs via trip ID: `/trips/clxxx` (Phase 1)
- Phase 2: human-readable slugs `/trips/lake-day-july-2025`

---

## Technical SEO Checklist

| Item | Implementation | Status |
|---|---|---|
| HTTPS | Vercel (automatic) | ✓ |
| Mobile-friendly | Tailwind responsive design | ✓ |
| Page speed | ISR + image optimisation | ✓ |
| Canonical URLs | Next.js `alternates.canonical` | ✓ |
| OG image | Static `/og-image.jpg` + dynamic per trip (Phase 2) | Partial |
| Structured data | TouristAttraction + Event schemas | ✓ |
| Sitemap | Dynamic from DB | ✓ |
| robots.txt | Blocks admin/api | ✓ |
| Noindex on auth/admin | `robots: false` in metadata | ✓ |

---

## Google Search Console

1. Verify ownership via Vercel (`google-site-verification` meta tag in `layout.tsx`)
2. Submit sitemap: `https://soulfullescape.com/sitemap.xml`
3. Monitor: Core Web Vitals, index coverage, keyword performance

---

## Acceptance Criteria

- [ ] Lighthouse SEO score ≥ 95 on landing page
- [ ] All published trips appear in sitemap
- [ ] Admin, login, API routes excluded from sitemap and robots.txt
- [ ] OG image renders correctly in WhatsApp and Twitter link previews
- [ ] Structured data validates in Google's Rich Results Test

## Related Documents

- [27-performance-optimization.md](27-performance-optimization.md)
- [29-accessibility.md](29-accessibility.md)
- [06-site-map.md](06-site-map.md)
