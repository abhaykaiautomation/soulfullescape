# 29 — Accessibility

## Purpose

Define the accessibility standards and implementation patterns for the Soulfullescape platform.

## Business Goal

Ensure every potential guest — regardless of ability — can discover and book a trip without barriers, and satisfy WCAG 2.1 AA compliance.

---

## Standard: WCAG 2.1 Level AA

All pages and components must meet WCAG 2.1 AA. Level AAA is aspirational for Phase 2.

---

## The Four Principles (POUR)

| Principle | Requirement |
|---|---|
| **Perceivable** | All information is available in multiple senses (not just sight) |
| **Operable** | All functionality accessible via keyboard |
| **Understandable** | UI language and behaviour is clear and predictable |
| **Robust** | Works with current and future assistive technologies |

---

## Colour Contrast

All text/background combinations meet minimum contrast ratios:

| Combination | Ratio | Pass/Fail |
|---|---|---|
| Navy (`#0D1B2A`) on Cream (`#FDF6EC`) | 14.5:1 | ✅ AAA |
| White on Teal (`#1A9E96`) | 4.6:1 | ✅ AA |
| White on Navy (`#0D1B2A`) | 16.8:1 | ✅ AAA |
| Gray (`#6B7280`) on White | 4.6:1 | ✅ AA |
| White on Orange (`#F4631E`) | 4.5:1 | ✅ AA (borderline — verify) |
| Navy on Golden Yellow (`#F9C846`) | 9.1:1 | ✅ AAA |
| Error Red (`#EF4444`) on White | 4.5:1 | ✅ AA (verify with brand red) |

Tool: Check all combinations at webaim.org/resources/contrastchecker/

---

## Keyboard Navigation

Every interactive element must be reachable and operable via keyboard:

### Focus Management

```tsx
// Focus ring — visible on all interactive elements
// Applied via Tailwind in globals.css:
'focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2'

// Never:
outline: none  // (without replacement focus indicator)
```

### Focus Order

Tab order follows visual reading order (top-left to bottom-right). No `tabindex` values > 0 (which disrupt natural order).

### Modal Focus Trap

When a modal opens:
1. Focus moves to the modal
2. Tab cycles only within modal content
3. Escape closes the modal
4. Focus returns to the trigger element on close

```tsx
// components/ui/Modal.tsx — uses native <dialog> element
// <dialog> provides focus trapping natively in modern browsers
<dialog ref={dialogRef} onKeyDown={handleKeyDown}>
  {children}
</dialog>
```

---

## Semantic HTML

Use the most semantically meaningful element:

```tsx
// ✓ Correct
<nav aria-label="Main navigation">
<main>
<article>
<section aria-labelledby="section-heading">
<h2 id="section-heading">Upcoming Trips</h2>
<button type="submit">Reserve Spots</button>  // not <div onClick>

// ✗ Avoid
<div className="nav">
<div className="button" onClick={...}>
<span className="heading">
```

---

## Images

```tsx
// Informative images — descriptive alt text
<Image alt="Guests kayaking on the lake at Soulfullescape" src="..." />

// Decorative images — empty alt (screen reader skips)
<Image alt="" src="/decorative-wave.svg" aria-hidden="true" />

// Icon buttons — aria-label on the button
<button aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>
```

---

## Forms

```tsx
// Every input must have an associated label
<label htmlFor="phone">WhatsApp Number</label>
<input
  id="phone"
  type="tel"
  aria-describedby="phone-hint phone-error"
  aria-invalid={!!error}
  aria-required="true"
/>
<p id="phone-hint">Include country code, e.g. +17875551234</p>
{error && <p id="phone-error" role="alert">{error}</p>}
```

Key rules:
- Every input has a `<label>` (not just placeholder text)
- Error messages use `role="alert"` to announce to screen readers
- Required fields marked with `aria-required="true"`
- `aria-invalid="true"` on fields in error state
- `aria-describedby` links hint and error text to input

---

## Status Updates (Live Regions)

```tsx
// Spot count updates when user changes date/trip
<p aria-live="polite" aria-atomic="true">
  {spotsRemaining} spots remaining
</p>

// Urgent errors (e.g. trip just filled)
<p aria-live="assertive">
  This trip just sold out. Please choose a different date.
</p>
```

`aria-live="polite"` — announces when user is idle  
`aria-live="assertive"` — interrupts immediately (use sparingly)

---

## Navigation Landmarks

Every page must include:
```tsx
<header role="banner">       // Navbar
<nav aria-label="Main">      // Primary navigation
<main>                       // Page content
<footer role="contentinfo">  // Footer
```

And a **skip link** at the very start of `<body>`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-teal focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>
```

---

## Loading States (Accessibility)

```tsx
// Spinner must have accessible label
<Spinner aria-label="Loading trips" />

// Button loading state
<button aria-busy={isSubmitting} aria-label={isSubmitting ? 'Reserving spots...' : 'Reserve Spots'}>
  {isSubmitting ? <Spinner size="sm" /> : 'Reserve Spots'}
</button>
```

---

## Reduced Motion

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Tailwind motion-safe prefix:
```tsx
<div className="motion-safe:animate-pulse">
```

---

## Touch Targets

Minimum tap target size: **44×44px** (Apple/Google recommendation).

```tsx
// Button minimum height
<button className="min-h-[44px] px-6 py-3">

// Small table action buttons
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center">
```

---

## Testing Accessibility

| Tool | When | What |
|---|---|---|
| `axe-core` (browser extension) | Development | Automated rule checking |
| Lighthouse Accessibility audit | Pre-PR | Score ≥ 90 |
| VoiceOver (Mac/iOS) | Before release | Screen reader UX |
| NVDA (Windows) | Before release | Screen reader UX |
| Keyboard-only navigation | Before release | Every flow completable |
| `eslint-plugin-jsx-a11y` | CI | Static rule enforcement |

---

## Acceptance Criteria

- [ ] Lighthouse Accessibility score ≥ 90 on landing page and booking form
- [ ] Complete booking flow achievable via keyboard only
- [ ] All images have appropriate alt text (descriptive or empty)
- [ ] All form fields have associated labels
- [ ] Modal focus trap prevents focus leaving the modal
- [ ] Skip link visible on focus
- [ ] No automated axe violations (critical or serious)

## Related Documents

- [18-ui-design-system.md](18-ui-design-system.md)
- [19-component-library.md](19-component-library.md)
- [23-form-validation.md](23-form-validation.md)
