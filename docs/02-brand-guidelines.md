# 02 — Brand Guidelines

## Purpose

Define the visual and verbal identity of Soulfullescape so that every UI component, copywriting decision, and marketing asset feels cohesive.

## Business Goal

Build a brand that communicates premium tropical luxury — exclusive but welcoming, adventurous but safe, curated but spontaneous.

## Tagline

> **Escape. Connect. Recharge.**

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|---|---|---|
| Deep Navy | `#0D1B2A` | Primary backgrounds, headers, dark sections |
| Tropical Teal | `#1A9E96` | Primary CTAs, links, active states, accents |
| Lake Blue | `#2EC4B6` | Secondary accents, hover states, badges |

### Secondary Colors

| Name | Hex | Usage |
|---|---|---|
| Sunset Orange | `#F4631E` | Highlights, urgency indicators, secondary CTAs |
| Golden Yellow | `#F9C846` | Stars, badges, premium labels, warmth accents |
| Warm Cream | `#FDF6EC` | Page backgrounds, card surfaces, light sections |

### Semantic Colors

| Name | Hex | Usage |
|---|---|---|
| Success Green | `#22C55E` | Confirmations, available status |
| Error Red | `#EF4444` | Errors, full-capacity warnings |
| Warning Amber | `#F59E0B` | Low-availability indicators (≤3 spots) |
| Neutral Gray | `#6B7280` | Body text, secondary labels |

### Tailwind Config Extension

```js
colors: {
  navy: {
    DEFAULT: '#0D1B2A',
    light: '#1C2E42',
    dark: '#060F18',
  },
  teal: {
    DEFAULT: '#1A9E96',
    light: '#2EC4B6',
    dark: '#127A74',
  },
  orange: {
    DEFAULT: '#F4631E',
    light: '#F8885A',
    dark: '#C04D17',
  },
  gold: {
    DEFAULT: '#F9C846',
    light: '#FBD878',
    dark: '#C49A2E',
  },
  cream: {
    DEFAULT: '#FDF6EC',
    dark: '#F5E8D0',
  },
}
```

---

## Typography

### Font Stack

| Role | Font | Weight | Tailwind Class |
|---|---|---|---|
| Display / Hero | `Playfair Display` | 700, 800 | `font-display` |
| Headings (h1–h3) | `Playfair Display` | 600 | `font-display` |
| Body / UI text | `Inter` | 400, 500 | `font-sans` |
| Captions / Labels | `Inter` | 400 | `font-sans text-sm` |
| Monospace | `JetBrains Mono` | 400 | `font-mono` |

### Scale

| Token | Size | Line Height |
|---|---|---|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |
| `text-5xl` | 48px | 48px |
| `text-7xl` | 72px | 72px |

---

## Spacing & Layout

- Base unit: `4px` (Tailwind default)
- Max content width: `1280px` (`max-w-7xl`)
- Section padding: `py-16 md:py-24`
- Card padding: `p-6 md:p-8`
- Border radius: `rounded-2xl` for cards, `rounded-full` for pills/badges

---

## Iconography

- Icon library: **Lucide React** (consistent stroke style)
- Size: `16px` inline, `24px` standalone, `48px` feature icons
- Color: inherits from text color or explicit brand color

---

## Photography & Imagery

- Style: Natural light, candid moments, lush green and water
- Avoid: Stock-photo aesthetics, over-saturated filters
- Aspect ratios: `16:9` hero, `4:3` cards, `1:1` avatars
- Lazy-load all images with `next/image` blur placeholder

---

## Voice & Tone

| Context | Tone | Example |
|---|---|---|
| Hero copy | Aspirational, poetic | "Lose yourself in the jungle, find yourself at the lake." |
| Booking flow | Clear, confident | "Reserve your 2 spots for July 19." |
| Confirmations | Warm, personal | "You're in! We'll see you at the gate." |
| Error messages | Honest, helpful | "Those spots just filled up. Try a different date." |
| Admin UI | Direct, professional | "Trip created. 12 spots available." |

---

## Logo Usage

- Primary logo: horizontal lockup on light backgrounds
- Reversed logo: on navy or dark backgrounds
- Minimum size: 120px wide
- Clear space: equal to the height of the "S" letterform on all sides
- Never: stretch, recolor, or add effects to the logo

---

## Animation & Motion

- Duration: `150ms` micro-interactions, `300ms` transitions, `500ms` page elements
- Easing: `ease-out` for entering elements, `ease-in` for exiting
- Principle: motion should feel natural, never distracting
- Reduced motion: respect `prefers-reduced-motion` media query

---

## Acceptance Criteria

- [ ] All brand colors present in Tailwind config
- [ ] Google Fonts loaded with `display=swap`
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Consistent border-radius across all card components
- [ ] Voice and tone guidelines reviewed before UI copy is finalised

## Related Documents

- [18-ui-design-system.md](18-ui-design-system.md)
- [19-component-library.md](19-component-library.md)
- [29-accessibility.md](29-accessibility.md)
