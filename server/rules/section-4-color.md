## SECTION 4 — COLOR SYSTEM RULES

> **Phase 2 only. Mistral receives this section.**

### 4.1 — Mandatory CSS Custom Properties

Define ALL of these in `:root` before any other CSS. In Next.js: in `app/globals.css`.

```css
:root {
  --color-bg:            /* main page background */;
  --color-surface:       /* cards, panels, elevated elements */;
  --color-surface-2:     /* modals, popovers */;
  --color-border:        /* dividers, card borders */;
  --color-text:          /* primary text */;
  --color-text-muted:    /* secondary text */;
  --color-text-hint:     /* placeholder, disabled */;
  --color-accent:        /* ONE brand color — buttons, links, highlights */;
  --color-accent-hover:  /* 10-15% darker than accent */;
  --color-accent-light:  /* very light tint of accent */;
}
```

CRITICAL: Every color in component CSS must use `var(--color-name)`. Hardcoded hex in components = CRITICAL violation.

---

### 4.2 — Color Rules

| Rule | Constraint |
|---|---|
| 60-30-10 | 60% backgrounds, 30% surfaces, 10% accent. Never invert. |
| One accent | ONE accent color. Never two. Never a gradient on buttons. |
| Dark backgrounds | Never `#000000`. Use `#0f0f0f`, `#111111`, `#141414`. |
| Light backgrounds | `#f8f8f6` or `#f5f4f0`. Never pure `#ffffff` as outer background. |
| Card borders light | `rgba(0,0,0,0.08)`. Never solid black border on cards. |
| Text contrast | Body on bg: min 4.5:1 (WCAG AA). Large text 18px+: min 3:1. |
| Dark text | Never `#ffffff`. Use `#e8e8e8` or `#f0f0f0`. |

### 4.3 — Preset Palettes

| `colorPreference` | `--color-bg` | `--color-surface` | `--color-text` | `--color-accent` |
|---|---|---|---|---|
| `"light"` | `#f8f8f6` | `#ffffff` | `#111827` | `#2563eb` |
| `"dark"` | `#0f0f0f` | `#1a1a1a` | `#e8e8e8` | `#3b82f6` |
| `"warm"` | `#faf7f2` | `#ffffff` | `#1a1209` | `#c84b31` |
| `"earthy"` | `#f5f0e8` | `#ffffff` | `#1c1309` | `#3d6b4f` |
| `"luxury"` | `#0d0b08` | `#1a1712` | `#f0ede8` | `#c9a84c` |
| `"minimal"` | `#ffffff` | `#f9f9f7` | `#111111` | `#111111` |
| `"vibrant"` | `#f0f4ff` | `#ffffff` | `#0f172a` | `#6366f1` |

---
