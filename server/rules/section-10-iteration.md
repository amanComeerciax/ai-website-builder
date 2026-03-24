## SECTION 10 — ITERATION & REFINEMENT RULES

> **ALWAYS inject this section FIRST for follow-up prompts in an existing workspace.**

### 10.1 — Required Classification Output

Before touching any file, output this JSON:

```json
{
  "editScope": "scoped",
  "editType": "color_change",
  "filesToTouch": ["app/globals.css"],
  "specificChange": "Change --color-accent from #2563eb to #dc2626 in :root",
  "doNotTouch": "all other files",
  "requiresFullRegeneration": false
}
```

### 10.2 — Scope Definitions

| Scope | Use when | Max files |
|---|---|---|
| SCOPED | Color, font, single text, single component style | 1–2 files |
| MEDIUM | New section, new feature, new route | 2–4 files |
| FULL | User says "redesign", "start over", "change the whole layout" | All files |

### 10.3 — Change Type to File Map

| User says | Scope | Files to touch | What to change |
|---|---|---|---|
| "Change the color to X" | SCOPED | `app/globals.css` `:root` block only | `--color-accent` value only |
| "Change the font" | SCOPED | `app/globals.css` + `app/layout.tsx` | `next/font` import + CSS variable |
| "Change the hero text" | SCOPED | `components/sections/HeroSection.tsx` | Only the specific text string |
| "Make it dark mode" | SCOPED | `app/globals.css` `:root` block only | All `--color-*` values |
| "Add a contact form" | MEDIUM | New component + page update | Add section, styles, validation |
| "Add pricing section" | MEDIUM | New component + page update | Add section after features |
| "Make it responsive" | MEDIUM | `app/globals.css` only | Add media queries |
| "Add animations" | MEDIUM | Component files + globals | Add framer-motion variants |

### 10.4 — Iteration Don'ts
- ❌ Change files not listed in `filesToTouch`
- ❌ Restructure HTML the user didn't ask to change
- ❌ "Improve" other things while making a specific change
- ❌ Add unrequested features
- ❌ Change variable names in files you're editing for another reason

---
