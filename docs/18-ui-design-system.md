# 18 — UI Design System

## Purpose

Define the complete design system: tokens, patterns, and rules that ensure visual consistency across every screen of the platform.

## Business Goal

Enable fast, consistent UI development by establishing a shared vocabulary of visual primitives.

---

## Design Principles

1. **Tropical luxury** — premium feel without being cold or corporate
2. **Mobile-first** — every element designed at 375px first, then scaled up
3. **Clarity over decoration** — every visual element serves a purpose
4. **Urgency is honest** — scarcity indicators (low spots) reflect reality, not manufactured pressure

---

## Spacing System

Based on Tailwind's 4px base unit.

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Icon padding |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section dividers |
| `space-12` | 48px | Major section gaps |
| `space-16` | 64px | Section padding (mobile) |
| `space-24` | 96px | Section padding (desktop) |

---

## Color Tokens (Semantic)

| Token | Color | Hex |
|---|---|---|
| `bg-page` | Warm cream | `#FDF6EC` |
| `bg-surface` | White | `#FFFFFF` |
| `bg-surface-dark` | Navy light | `#1C2E42` |
| `bg-primary` | Deep navy | `#0D1B2A` |
| `text-primary` | Deep navy | `#0D1B2A` |
| `text-secondary` | Neutral gray | `#6B7280` |
| `text-inverse` | White | `#FFFFFF` |
| `border-default` | `gray-200` | `#E5E7EB` |
| `accent-cta` | Tropical teal | `#1A9E96` |
| `accent-highlight` | Sunset orange | `#F4631E` |
| `accent-warm` | Golden yellow | `#F9C846` |
| `status-available` | Success green | `#22C55E` |
| `status-full` | Error red | `#EF4444` |
| `status-low` | Warning amber | `#F59E0B` |

---

## Elevation (Shadows)

| Level | Class | Use |
|---|---|---|
| 0 | `shadow-none` | Flat elements |
| 1 | `shadow-sm` | Subtle card lift |
| 2 | `shadow-md` | Cards, dropdowns |
| 3 | `shadow-lg` | Modals, popovers |
| 4 | `shadow-xl` | Hero overlays |

---

## Border Radius

| Context | Class | Value |
|---|---|---|
| Inputs, small elements | `rounded-lg` | 8px |
| Cards | `rounded-2xl` | 16px |
| Buttons | `rounded-full` | 9999px |
| Badges / pills | `rounded-full` | 9999px |
| Modals | `rounded-3xl` | 24px |

---

## Typography Scale

| Element | Tailwind | Font | Weight |
|---|---|---|---|
| Hero heading | `text-5xl md:text-7xl` | Playfair Display | 800 |
| Section heading | `text-3xl md:text-4xl` | Playfair Display | 700 |
| Card title | `text-xl` | Playfair Display | 600 |
| Body large | `text-lg` | Inter | 400 |
| Body default | `text-base` | Inter | 400 |
| Label | `text-sm font-medium` | Inter | 500 |
| Caption | `text-xs` | Inter | 400 |

---

## Interactive States

### Buttons
```
default:  bg-teal text-white
hover:    bg-teal-dark (scale-[1.02] transform)
active:   bg-teal-dark scale-[0.98]
focus:    ring-2 ring-teal ring-offset-2
disabled: opacity-50 cursor-not-allowed
loading:  opacity-75 cursor-wait (spinner visible)
```

### Inputs
```
default:  border-gray-200 bg-white
focus:    border-teal ring-1 ring-teal
error:    border-red-400 ring-1 ring-red-400
disabled: bg-gray-50 text-gray-400
```

### Links
```
default:  text-teal
hover:    text-teal-dark underline
visited:  text-teal (no visited style change — prevents history sniffing)
```

---

## Status Badge System

| Status | Background | Text | Border |
|---|---|---|---|
| PUBLISHED | `bg-green-100` | `text-green-700` | — |
| DRAFT | `bg-gray-100` | `text-gray-600` | — |
| FULL | `bg-red-100` | `text-red-700` | — |
| CANCELLED | `bg-gray-100` | `text-gray-400 line-through` | — |
| CONFIRMED | `bg-teal-100` | `text-teal-700` | — |

### Spot Availability Indicators

| Spots Remaining | Indicator |
|---|---|
| > 5 | Green dot + "X spots left" |
| 2–5 | Amber dot + "Only X spots left!" |
| 1 | Red dot + "Last spot!" |
| 0 | Red badge "Sold Out" |

---

## Layout Grid

```
Mobile:  1 column, px-4
Tablet:  2 columns, px-6
Desktop: 3 columns, px-8 (trips grid)
Wide:    4 columns (admin tables)

Max width: max-w-7xl (1280px) centered
```

---

## Icon System

- Library: **Lucide React**
- Sizes: 16 (inline text), 20 (buttons), 24 (standalone UI), 48 (feature/empty state)
- Stroke width: 1.5 (default Lucide)
- Color: inherits from parent text color

Common icons:
| Context | Icon |
|---|---|
| Calendar/date | `Calendar` |
| Clock/time | `Clock` |
| Users/capacity | `Users` |
| Location | `MapPin` |
| Check/confirmed | `CheckCircle` |
| Warning | `AlertTriangle` |
| Close/cancel | `X` |
| Edit | `Pencil` |
| Download/export | `Download` |
| Loading | `Loader2` (with `animate-spin`) |

---

## Responsive Breakpoints

| Name | Min Width | Tailwind Prefix |
|---|---|---|
| Mobile | 0px | (default) |
| Small | 640px | `sm:` |
| Medium | 768px | `md:` |
| Large | 1024px | `lg:` |
| Extra Large | 1280px | `xl:` |

---

## Accessibility Tokens

- Minimum tap target: 44×44px
- Focus ring: `ring-2 ring-teal ring-offset-2`
- Skip link: `"Skip to main content"` at top of every page
- Color contrast: all text meets WCAG AA (4.5:1 minimum)

---

## Animation Tokens

```css
/* Use sparingly — only where motion aids comprehension */
transition-colors: 150ms ease-out
transition-transform: 200ms ease-out
transition-opacity: 200ms ease-out
transition-all: 300ms ease-out
```

Always wrap in `@media (prefers-reduced-motion: no-preference)`.

---

## Acceptance Criteria

- [ ] All colors sourced from Tailwind config tokens (no arbitrary hex values in components)
- [ ] All font sizes use defined scale classes
- [ ] All interactive elements have focus styles
- [ ] No hardcoded colours in component files — always via Tailwind classes
- [ ] Spot availability indicator colours correctly mapped to remaining count

## Related Documents

- [02-brand-guidelines.md](02-brand-guidelines.md)
- [19-component-library.md](19-component-library.md)
- [29-accessibility.md](29-accessibility.md)
