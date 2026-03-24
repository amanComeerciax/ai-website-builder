## SECTION 10 — ITERATION RULES

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

## QUICK REFERENCE

### Two tracks only
```
"html"   → Track A → single index.html → iframe srcdoc preview
"nextjs" → Track B → Next.js 14 App Router → build → Netlify → iframe URL
```

### Phase injection map
```
Phase 1 (Mistral):         Section 2
Phase 2 (Mistral):         Sections 3 + 4 + 5
Phase 3 Track A (Qwen):    Section 6 + Section 8
Phase 3 Track B (Qwen):    Section 7 + Section 8 + Section 9
Validator:                  Section 8
Iteration (Mistral+Qwen):  Section 10 FIRST → then relevant sections
```

### Easing values
```
Spring   [0.34, 1.56, 0.64, 1.0]  → tooltips, badges, name tags, success pops
Ease-out [0.0,  0.0,  0.2,  1.0]  → things entering the screen
Ease-in  [0.4,  0.0,  1.0,  1.0]  → things leaving the screen
In-out   [0.4,  0.0,  0.2,  1.0]  → things moving within the screen
```

### Always forbidden
```
NEVER:  import/require in Track A
NEVER:  react-scroll (use scrollIntoView)
NEVER:  hex colors in component CSS (use var(--color-name))
NEVER:  spacing off the 4px scale
NEVER:  lorem ipsum
NEVER:  console.log in output
NEVER:  TODO/FIXME comments
NEVER:  transition: all
NEVER:  packages not in Section 7.2 or 7.3
NEVER:  more than one <h1> per page
NEVER:  <img> without alt
NEVER:  <input> without label
NEVER:  icon button without aria-label
NEVER:  inline style="" attributes
NEVER:  hardcoded copyright years
NEVER:  <link> tags for fonts in Next.js (use next/font/google)
NEVER:  a third output track — only "html" and "nextjs" exist
```

---

*StackForge AI Master Rulebook v2.0 — Next.js Edition*
*Two tracks: HTML (instant srcdoc preview) and Next.js (build + deploy)*
*Every rule exists because a real generation error occurred without it.*
