## SECTION 5 — SPACING, LAYOUT & ANIMATION RULES

> **Phase 2 only. Mistral receives this section.**

### 5.1 — Spacing System (4px base — STRICT)

> CRITICAL: ALL spacing must be multiples of 4px.
> Allowed: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
> Forbidden: 5, 7, 10, 15, 17, 22, 25, 30px — and anything not in the allowed list

| Context | Value |
|---|---|
| Badge padding, icon gaps | 8–12px |
| Button padding | 10px top/bottom, 18px left/right |
| Input padding | 10px top/bottom, 14px left/right |
| Card padding | 24px |
| Modal padding | 32px |
| Page content padding | 32px desktop / 16px mobile |
| Between cards in grid | 20px |
| Between page sections | 80px desktop / 48px mobile |
| Heading to body gap | 12px |
| Body to CTA gap | 24px |
| Max content width | 1200px |
| Max text column | 680px |

### 5.2 — Component Size Standards

| Component | Height | Border Radius | Notes |
|---|---|---|---|
| Button default | 40px | 8px | `font-weight: 600`, padding 10/18px |
| Button small | 32px | 6px | `font-size: 14px`, padding 6/12px |
| Button large | 48px | 10px | padding 14/24px |
| Input / Select | 40px | 8px | padding 10/14px |
| Card | auto | 12px | padding 24px, border `rgba(0,0,0,0.08)` |
| Modal | auto | 16px | max-width 520px, padding 32px |
| Badge / Pill | 22px | 99px | padding 2/10px, font-size 12px |
| Icon button | 36×36px | 6px | tap target min 44×44px on mobile |

### 5.3 — Responsive Breakpoints (3 only)

| Name | Width | Changes |
|---|---|---|
| Mobile | ≤ 640px | 1-column, sidebar→bottom tabs, hero stacks, padding 48px |
| Tablet | 641–1024px | 2-column, cards 2 per row |
| Desktop | ≥ 1025px | Full layout, 3-column grids, padding 80px |

- Body font: **NEVER below 16px** at any breakpoint
- Tap targets: **minimum 44×44px** on mobile
- CTA button: **always visible** — never hidden in collapsed nav

### 5.4 — Easing Dictionary (exact values — never substitute)

| Name | CSS / framer-motion value | Use for |
|---|---|---|
| Spring | `[0.34, 1.56, 0.64, 1.0]` | Tooltips, badges, name tags, success pops — satisfying moments |
| Ease-out | `[0.0, 0.0, 0.2, 1.0]` | Elements **entering** screen: modals open, toast in, scroll reveal |
| Ease-in | `[0.4, 0.0, 1.0, 1.0]` | Elements **leaving** screen: modals close, toast out, card dismiss |
| Ease-in-out | `[0.4, 0.0, 0.2, 1.0]` | Elements **moving** on screen: progress bar, search expand, sidebar |

**CRITICAL: Never use `transition: all`. Always name specific properties.**

### 5.5 — Timing Reference

| Interaction | Duration |
|---|---|
| Button hover/color | 150ms |
| Button press (scale) | 80ms |
| Tooltip show (after 800ms delay) | 200ms |
| Tooltip hide | 150ms |
| Toast enter | 350ms |
| Toast exit | 250ms |
| Scroll reveal | 450ms |
| Progress bar fill | 450ms |
| Card stack advance | 400ms |
| Search expand | 350ms |
| Shimmer sweep | 1500ms infinite |
| Name tag spring | 450ms |

---
