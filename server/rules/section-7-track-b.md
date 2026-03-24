## SECTION 7 — TRACK B: NEXT.JS GENERATION RULES

> **Phase 3 only. Qwen receives this section + Section 8 + Section 9.**
> **Used when `outputTrack = "nextjs"` from Phase 1 JSON.**

### Track B Definition
- Framework: **Next.js 14+ with App Router**
- Files generated **one at a time** — one Qwen call per file
- Maximum **300 lines per file** — split if approaching limit
- Preview: server-side `npm install && npm run build` → Netlify deploy → iframe URL
- Every interactive component file: **`'use client'` at the top — no exceptions**

### 7.1 — Required File Structure

```
app/
  layout.tsx          ← Root layout with fonts (next/font/google) + metadata
  globals.css         ← :root custom properties + keyframes + reduced-motion
  page.tsx            ← Home page (server component, no 'use client')
  [route]/
    page.tsx          ← Additional pages

components/
  ui/                 ← All reusable UI components (see Section 9)
  sections/           ← Page-level sections (HeroSection, FeaturesSection, etc.)

public/               ← Static assets only
tailwind.config.ts    ← Extended with custom animation tokens
next.config.ts        ← Basic Next.js config
package.json          ← Only allowed packages
```

### 7.2 — Required package.json (EXACT — add nothing else)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

### 7.3 — Allowed packages for complex apps (add only when needed)

| Package | Use for |
|---|---|
| `react-hook-form` | Form state |
| `@tanstack/react-query` | Data fetching |
| `axios` | HTTP requests |
| `date-fns` | Date formatting |
| `recharts` | Data charts |
| `react-hot-toast` | Toast (only if not using Section 9 component) |
| `zustand` | Global state |
| `zod` | Data validation |
| `@hookform/resolvers` | Zod + react-hook-form bridge |
| `@radix-ui/react-dialog` | Accessible modals |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-select` | Select inputs |

### 7.4 — Permanently Blocked Packages

| Blocked | Use instead |
|---|---|
| `react-scroll` | `element.scrollIntoView({behavior:'smooth'})` |
| `react-slick` | `framer-motion` or CSS scroll-snap |
| `moment` | `date-fns` |
| `lodash` | Native Array/Object methods |
| `jquery` | Never |
| `styled-components` | Tailwind CSS |
| `emotion` | Tailwind CSS |
| `bootstrap` | Tailwind CSS |
| `@mui`, `ant-design`, `chakra-ui` | Tailwind + Radix UI |
| `react-spring` | `framer-motion` |
| `three.js` | CSS 3D transforms |

### 7.5 — Next.js File Rules

- `app/layout.tsx`: load fonts via `next/font/google`, set `<html>` className, add `<meta>` tags
- `app/globals.css`: all `:root` custom properties + keyframes + reduced-motion reset
- `app/page.tsx`: server component by default — no `'use client'` unless directly using hooks
- `components/ui/*.tsx`: all have `'use client'` — all use framer-motion + Tailwind
- `tailwind.config.ts`: must include all animation tokens from Section 9

### 7.6 — Required tailwind.config.ts

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2899d2',
        'primary-hover': '#1979b0',
        canvas: '#f7f8f9',
        surface: '#ffffff',
        border: '#e5e7eb',
        't1': '#111827',
        't2': '#374151',
        't3': '#6b7280',
        't4': '#9ca3af',
      },
      transitionTimingFunction: {
        spring:    'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
        'ease-out-motion': 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
        'ease-in-motion':  'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
        'ease-inout-motion': 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
      },
      keyframes: {
        shimmer:  { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        toastIn:  { from: { opacity: '0', transform: 'translateY(16px) scale(0.95)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        toastOut: { from: { opacity: '1', transform: 'translateY(0) scale(1)' }, to: { opacity: '0', transform: 'translateY(-8px) scale(0.95)' } },
        popIn:    { '0%': { opacity: '0', transform: 'scale(0.7) translateY(4px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        stepIn:   { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        stepOut:  { from: { opacity: '1', transform: 'translateX(0)' }, to: { opacity: '0', transform: 'translateX(-16px)' } },
      },
      animation: {
        shimmer:  'shimmer 1.5s infinite',
        toastIn:  'toastIn 0.35s cubic-bezier(0.0,0.0,0.2,1.0) forwards',
        toastOut: 'toastOut 0.25s cubic-bezier(0.4,0.0,1.0,1.0) forwards',
        popIn:    'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1.0) forwards',
        stepIn:   'stepIn 0.35s cubic-bezier(0.0,0.0,0.2,1.0) forwards',
        stepOut:  'stepOut 0.2s cubic-bezier(0.4,0.0,1.0,1.0) forwards',
      },
    },
  },
  plugins: [],
}
export default config
```

### 7.7 — Required globals.css additions

```css
/* Reduced motion override — always include */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* Shimmer progress bar */
@keyframes progressFill {
  from { width: 100%; }
  to   { width: 0%; }
}
```

### 7.8 — Project Glossary (injected into every Phase 3 file prompt)

Built during Phase 2. Injected into every Qwen call. Use EXACTLY these names — never invent alternatives.

```json
{
  "primaryComponent": "App",
  "apiBaseUrl": "/api",
  "primaryColor": "value from --color-accent",
  "modelNames": {},
  "routePaths": { "home": "/" },
  "componentNames": {}
}
```

---
