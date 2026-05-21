# Skill: Responsive Design

## Purpose

Implementation guide for building mobile-first, responsive layouts across all Soulfullescape pages.

## Business Goal

Ensure the booking experience is flawless on a 375px iPhone screen — where the majority of guests will book.

## Scope

- Breakpoint system
- Mobile-first CSS approach
- Responsive typography
- Layout grid patterns
- Component responsiveness

---

## Architecture Notes

Tailwind CSS with mobile-first utility classes. Design at the smallest breakpoint first, then add overrides at larger breakpoints using `sm:`, `md:`, `lg:`, `xl:` prefixes.

```
Design order: 375px → 640px → 768px → 1024px → 1280px
Tailwind code: default → sm:   → md:   → lg:   → xl:
```

---

## Implementation Details

### Breakpoint Reference

| Prefix | Min Width | Target Devices |
|---|---|---|
| (none) | 0px | Small phones (375px iPhone SE) |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets, landscape phones |
| `lg:` | 1024px | Laptops, large tablets |
| `xl:` | 1280px | Desktops |

### Page Layout Template

```tsx
// Mobile-first page wrapper
<div className="min-h-screen bg-cream">
  <Navbar />

  {/* Hero: full viewport on mobile, constrained on desktop */}
  <section className="relative h-[80vh] md:h-[70vh] lg:h-[85vh]">
    {/* hero content */}
  </section>

  {/* Content sections: comfortable padding scaling up */}
  <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 xl:py-24">
    <div className="max-w-7xl mx-auto">
      {/* content */}
    </div>
  </section>

  <Footer />
</div>
```

### Trip Grid

```tsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
</div>
```

### Responsive Typography

```tsx
{/* Hero heading: grows from 36px → 48px → 72px */}
<h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-navy">
  Escape. Connect. Recharge.
</h1>

{/* Section heading */}
<h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold">
  Upcoming Experiences
</h2>

{/* Body: consistent, readable on all screens */}
<p className="text-base md:text-lg text-gray-600 leading-relaxed">
  A hidden destination in Puerto Rico...
</p>
```

### Responsive Navigation

```tsx
// components/layout/Navbar.tsx
<nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">

      {/* Logo — always visible */}
      <Logo />

      {/* Desktop nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-8">
        <NavLink href="/trips">Upcoming Trips</NavLink>
      </div>

      {/* Desktop auth — hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        <AuthButton />
      </div>

      {/* Mobile hamburger — visible only on mobile */}
      <button className="md:hidden" aria-label="Open menu">
        <Menu size={24} />
      </button>

    </div>
  </div>

  {/* Mobile drawer — slides in from right */}
  <MobileMenuDrawer />
</nav>
```

### Booking Form (Mobile Optimised)

```tsx
// Full-width on mobile, constrained on desktop
<div className="px-4 py-8 sm:px-6 md:max-w-lg md:mx-auto md:py-12">
  <BookingForm />
</div>
```

Form inputs must be `h-12 md:h-11` — slightly taller on mobile for better touch targets.

### Admin Dashboard (Responsive Table)

On mobile, tables become card-lists:

```tsx
{/* Desktop: table */}
<div className="hidden md:block">
  <TripTable trips={trips} />
</div>

{/* Mobile: card list */}
<div className="md:hidden space-y-4">
  {trips.map(trip => <TripMobileCard key={trip.id} trip={trip} />)}
</div>
```

### Responsive Spacing Pattern

```tsx
// Section padding: compact mobile, spacious desktop
<section className="py-12 md:py-16 xl:py-24">

// Horizontal padding: comfortable on all screens
<div className="px-4 sm:px-6 lg:px-8">

// Card padding
<div className="p-4 sm:p-6 md:p-8">

// Stack to side-by-side
<div className="flex flex-col md:flex-row gap-6">
```

---

## Folder Structure

```
src/
  app/
    globals.css             Base styles + custom properties
  components/
    layout/
      Navbar.tsx            Includes mobile drawer
      Footer.tsx
```

---

## Touch Target Rules

All interactive elements must be at minimum 44×44px:

```tsx
// Buttons
<button className="min-h-[44px] px-6">

// Icon buttons
<button className="w-11 h-11 flex items-center justify-center">

// Table action buttons (small)
<button className="h-9 px-3 text-sm">  // OK in desktop-only table
```

---

## Edge Cases

| Case | Handling |
|---|---|
| 375px iPhone SE (small) | All content readable, no horizontal scroll |
| iPad landscape | Two-column layout activates at `md:` |
| High-DPI screens | Images served at correct resolution via `next/image` |
| Font scaling (browser zoom) | Use `rem`-based sizes (Tailwind default) |
| Landscape phone | Nav collapses, content scrolls vertically |

---

## Acceptance Criteria

- [ ] No horizontal scroll on any page at 375px width
- [ ] Trip grid: 1 col mobile, 2 col tablet (768px+), 3 col desktop (1024px+)
- [ ] Navigation hamburger visible on mobile; links visible on desktop
- [ ] Booking form inputs: minimum 44px tall on mobile
- [ ] Admin table replaced by card list on mobile screens
- [ ] All text legible (min 16px body text) on mobile

## Future Improvements

- Container queries for more granular component responsiveness
- CSS Grid template areas for complex layouts
- Native mobile app (Phase 3)

## Related Documents

- [docs/18-ui-design-system.md](../docs/18-ui-design-system.md)
- [docs/29-accessibility.md](../docs/29-accessibility.md)
- [docs/02-brand-guidelines.md](../docs/02-brand-guidelines.md)
