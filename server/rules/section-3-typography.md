## SECTION 3 — TYPOGRAPHY RULES

> **Phase 2 only. Mistral receives this section.**

### 3.1 — Font Pairing

> CRITICAL: Always exactly 2 fonts. Never 1. Never 3.
> CRITICAL: Never use Arial, Times New Roman, Comic Sans, Inter alone, Roboto alone.
> CRITICAL: Never use serif/display fonts inside app UI or dashboards — only on landing/marketing pages.
> CRITICAL: Next.js — always load via `next/font/google` in `app/layout.tsx`. Never `<link>` tags.

| `fontMood` value | Heading Font | Body Font | Character |
|---|---|---|---|
| `"warm and artisanal"` | Fraunces | DM Sans | Organic, handcrafted, cozy |
| `"professional"` | Playfair Display | Plus Jakarta Sans | Authoritative, trustworthy |
| `"bold and modern"` | Archivo Black | Outfit | Strong, impactful |
| `"minimal"` | DM Serif Display | Figtree | Clean, editorial |
| `"playful"` | Syne | Nunito | Energetic, friendly |
| `"luxury"` | Cormorant Garamond | Lato | Elegant, refined |
| `"editorial"` | Clash Display | Source Sans 3 | Magazine-like |
| `"tech / SaaS"` | Cabinet Grotesk | Manrope | Sophisticated, functional |

**Next.js font loading (app/layout.tsx):**
```tsx
import { DM_Sans, Fraunces } from 'next/font/google'

const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const heading = Fraunces({ subsets: ['latin'], variable: '--font-heading' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**HTML font loading (Track A only):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=HEADING_FONT&family=BODY_FONT&display=swap" rel="stylesheet">
```

---

### 3.2 — Type Scale (strict — no values outside this list)

| Level | Size | Usage | Weight |
|---|---|---|---|
| xs | 12px | Labels, captions, metadata | 500 |
| sm | 14px | Secondary text, timestamps | 400 |
| base | 16px | Body copy — **never smaller on mobile** | 400 |
| md | 20px | Lead text, subtitles | 400–500 |
| lg | 28px | Section headings (H3) | 600–700 |
| xl | 36px | Page subheadings (H2) | 700 |
| 2xl | 48px | Page titles (H1) desktop | 700–800 |
| 3xl | 64–80px | Hero headlines only | 800 |

Forbidden sizes: 13px, 17px, 22px, 25px, 30px, 38px, 42px — any value not in the table above.

| Property | Rule |
|---|---|
| Line height — body | 1.65–1.75 |
| Line height — headings | 1.1–1.25 |
| Letter spacing — headings | -0.02em to -0.04em |
| Letter spacing — hero text (64px+) | -0.03em to -0.05em |
| Letter spacing — all caps labels | 0.08em to 0.12em |
| Max text column width | 680px |
| Font weights | 400, 500, 700 only |

### 3.3 — Typography Don'ts
- ❌ More than 3 font sizes on one screen
- ❌ Bold random words — only genuinely important labels
- ❌ Center-align paragraphs over 2 lines
- ❌ Thin weights (100–300) for readable text
- ❌ `line-height: 1` on anything except single icons

---
