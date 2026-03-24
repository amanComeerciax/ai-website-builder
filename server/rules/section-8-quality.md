## SECTION 8 — CODE QUALITY RULES

> **Phase 3 always — injected alongside Section 6 or Section 7.**
> **Also used by the post-generation validator for every file.**

### 8.1 — Master Rules Table

| # | Severity | Rule | Detail |
|---|---|---|---|
| 1 | **CRITICAL** | No inline styles | Never `style=""` on elements. All styles in CSS or `<style>` tag. |
| 2 | **CRITICAL** | No hardcoded hex in components | All colors via `var(--color-name)`. Hex outside `:root` = violation. |
| 3 | **CRITICAL** | No off-scale spacing | Allowed: 4,8,12,16,20,24,32,40,48,64,80,96px only. |
| 4 | **CRITICAL** | No forbidden packages | Track B: only packages from Section 7.2 and 7.3. |
| 5 | **CRITICAL** | No lorem ipsum | All text contextually appropriate for the site type. |
| 6 | **CRITICAL** | No `console.log` | Remove all `console.log`, `.error`, `.warn`. |
| 7 | **CRITICAL** | No TODO/FIXME | No `TODO`, `FIXME`, `HACK`, `XXX` comments. |
| 8 | **CRITICAL** | No commented-out code | Remove all dead code. Explanatory comments allowed. |
| 9 | **MUST** | One `<h1>` per page | Exactly one H1. Never zero. Never two. |
| 10 | **MUST** | Sequential headings | H1→H2→H3 only. Never skip levels. |
| 11 | **MUST** | All `<img>` have `alt` | Decorative: `alt=""`. Meaningful: describe the image. |
| 12 | **MUST** | All inputs have labels | `<label for="id">` or `aria-label`. Placeholder ≠ label. |
| 13 | **MUST** | Icon buttons have `aria-label` | `<button aria-label="Close modal">` — never icon alone. |
| 14 | **MUST** | Focus states on all interactive | `box-shadow: 0 0 0 3px var(--color-accent)` at 40% opacity. |
| 15 | **MUST** | Escape closes modals | Every modal/dropdown closes on Escape key. |
| 16 | **MUST** | Semantic HTML | `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`. |
| 17 | **MUST** | Copyright year via JS | `new Date().getFullYear()` — never hardcode. |
| 18 | **MUST** | Images use placehold.co | `https://placehold.co/WxH` — never Lorem Picsum. |
| 19 | **MUST** | Reduced motion override | All keyframes inside `@media (prefers-reduced-motion: no-preference)`. |
| 20 | **MUST** | Body font min 16px | Never below 16px at any breakpoint. 14px for secondary text only. |
| 21 | **MUST** | Mobile tap targets 44px | `min-height: 44px; min-width: 44px` for all clickable elements. |
| 22 | **MUST** | No `transition: all` | Always name specific properties. |
| 23 | **MUST** | No `!important` in components | Only in utility class definitions. |
| 24 | **MUST** | No manual vendor prefixes | Never `-webkit-`, `-moz-`, `-ms-`. |

### 8.2 — Pre-Output Self-Check

Before outputting any file, verify every item:

```
[ ] All colors use var(--color-name)? No hex outside :root?
[ ] All spacing on 4px scale? (4,8,12,16,20,24,32,40,48,64,80,96)
[ ] All imports in allowed package list? (Track B only)
[ ] Zero console.log, TODO, FIXME, commented-out code?
[ ] Every <img> has alt attribute?
[ ] Every input has label or aria-label?
[ ] Every icon-only button has aria-label?
[ ] Exactly one <h1> on the page?
[ ] Heading levels sequential (no skips)?
[ ] Every button has active press state (scale 0.97)?
[ ] transition: all used anywhere? (Remove it)
[ ] Any inline style="" attributes? (Remove them)
[ ] Lorem ipsum anywhere? (Replace it)
[ ] Track A: any import statements? (Must be zero)
[ ] Track B: 'use client' on all interactive components?
[ ] Iteration: only touched files listed in filesToTouch?
```

### 8.3 — Validator Fix Prompts

| Violation | Fix prompt to send | Max retries |
|---|---|---|
| `FORBIDDEN_PACKAGE` | "Remove import of `[pkg]`. Implement with vanilla JS instead. Return ONLY the corrected file." | 2 |
| `HARDCODED_COLOR` | "Replace all hardcoded hex with CSS custom properties from `:root`. Return ONLY the corrected file." | 2 |
| `INVALID_SPACING` | "Replace all off-scale spacing values with nearest allowed: 4,8,12,16,20,24,32,40,48,64,80,96. Return ONLY the corrected file." | 2 |
| `CONSOLE_LOG` | "Remove all console.log/error/warn. Return ONLY the corrected file." | 1 |
| `LOREM_IPSUM` | "Replace lorem ipsum with contextually appropriate content for a `[siteType]`. Return ONLY the corrected file." | 1 |
| `MISSING_ALT` | "Add alt attributes to all img tags. Decorative: alt=\"\". Meaningful: describe the image. Return ONLY the corrected file." | 1 |
| `INLINE_STYLE` | "Move all inline style attributes to CSS. Return ONLY the corrected file." | 2 |

---
