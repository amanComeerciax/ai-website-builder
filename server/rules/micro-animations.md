# THE MICRO-INTERACTIONS & ANIMATIONS GUIDE

### How to Build Interactions That Make Your UI Feel Alive

> Paste this into any AI alongside the Design Rulebook, Page Blueprints, and Dashboard Guide before asking it to build any interface. Every interaction here is described as code logic — not design theory.

---

## WHY MICRO-INTERACTIONS MATTER

Users don't consciously notice good micro-interactions. They just feel that the product is "polished" or "high-end" without knowing why. What they _do_ notice is their absence — clicking a button that gives no feedback, hovering over a nav item that doesn't respond, a form that just jumps from step to step. That feels cheap.

The goal is not to dazzle. It's to make every action feel acknowledged, every state transition feel intentional, and every interaction feel satisfying.

**The rule before all rules:** Micro-interactions serve the user, not the designer. Every animation must have a reason. If removing it makes the interface clearer, remove it.

---

## THE EASING DICTIONARY

Easing is what separates animations that feel real from animations that feel like PowerPoint. Before any specific interaction, understand these four easing types:

```css
/* 1. EASE OUT — things entering the screen */
/* Starts fast, slows to rest. Natural. Like something arriving. */
cubic-bezier(0.0, 0.0, 0.2, 1.0)
/* Use for: modals appearing, toasts sliding in, dropdowns opening,
   tooltips showing, cards revealing on scroll */

/* 2. EASE IN — things leaving the screen */
/* Starts slow, ends fast. Like something departing with purpose. */
cubic-bezier(0.4, 0.0, 1.0, 1.0)
/* Use for: modals closing, toasts dismissing, elements hiding */

/* 3. EASE IN-OUT — things moving within the screen */
/* Slow start, fast middle, slow end. Smooth repositioning. */
cubic-bezier(0.4, 0.0, 0.2, 1.0)
/* Use for: sidebar expanding/collapsing, tab transitions,
   progress bars filling, layout shifts */

/* 4. SPRING — things with personality */
/* Overshoots slightly then settles. Feels physical and alive. */
/* In CSS: approximate with cubic-bezier(0.34, 1.56, 0.64, 1.0) */
/* In JS (Framer Motion): type: "spring", stiffness: 636, damping: 24 */
/* Use for: name tags popping up, tooltips bouncing in,
   success states, anything that should feel satisfying */
```

**Duration reference:**

```
Instant feedback (hover bg, color change):    100–150ms
Short transitions (tooltips, badges):          200–300ms
Medium transitions (modals, dropdowns):        250–350ms
Long transitions (page elements, reveals):     400–600ms
Spring animations:                             400–500ms total
```

**Never** use `transition: all` — it animates properties you don't intend (width, padding, font-size) and causes jank. Always specify the property.

---

## INTERACTION 1 — BUTTON HOVER & PRESS

### The Pattern

Every button needs three states: default, hover, and press. Most AI implementations only do default.

**Text slide-up on hover** (high-end agencies do this):

```css
.btn {
  overflow: hidden;
  position: relative;
}

.btn .btn-text-default {
  display: block;
  transition:
    transform 0.3s cubic-bezier(0, 0, 0.2, 1),
    opacity 0.3s ease;
}

.btn .btn-text-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(100%);
  transition:
    transform 0.3s cubic-bezier(0, 0, 0.2, 1),
    opacity 0.3s ease;
}

.btn:hover .btn-text-default {
  transform: translateY(-100%);
  opacity: 0;
}

.btn:hover .btn-text-hover {
  transform: translateY(0);
}
```

**Simpler version — background + scale** (correct for most dashboards):

```css
.btn {
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
}

.btn:hover {
  background-color: [hover color];
}

.btn:active {
  transform: scale(0.97); /* the "press" — gives physical feedback */
  transition-duration: 0.08s; /* faster on press than on release */
}
```

### The Rules

- **Always implement `:active` scale.** The button pressing in is what makes it feel real. Without it, clicking feels like touching a wall.
- Scale on press: `0.97` for large buttons, `0.96` for small ones. Never go below `0.94` — looks broken.
- Background transition: `0.15s` on hover. Faster than you think is right.
- Never animate `width`, `height`, or `padding` on hover — use `transform` and `background` only.
- For icon-only buttons (close, collapse): use `opacity` + `scale` hover, not background color.

---

## INTERACTION 2 — KEYBOARD SHORTCUT BADGES

### The Pattern

When showing keyboard shortcuts (⌘K, Ctrl+S, etc.), animate them to build memory — a static badge gets ignored.

```css
.shortcut-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
  background: #f9fafb;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

/* When the shortcut is triggered: */
.shortcut-badge.active {
  transform: scale(0.92);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}
```

**Success state after trigger:**

```css
.shortcut-success {
  animation: shortcutPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes shortcutPop {
  0% {
    opacity: 0;
    transform: scale(0.7) translateY(4px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### The Rule

The animation makes shortcuts memorable. A shortcut badge that presses down when triggered and shows a success state teaches users muscle memory. Without it, shortcuts feel like undiscoverable features.

---

## INTERACTION 3 — TOAST NOTIFICATIONS

### The Pattern

Toasts slide in, stay, then slide out. The slide direction depends on where they appear:

- Bottom-right corner: slide up from below
- Top-right corner: slide down from above
- Center: scale up from center

```css
/* Container */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 999;
}

/* Toast base */
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #111827;
  color: white;
  border-radius: 10px;
  font-size: 13.5px;
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);

  /* Enter: starts below, invisible */
  animation: toastIn 0.35s cubic-bezier(0, 0, 0.2, 1) forwards;
}

/* Exit class added by JS before removal */
.toast.exiting {
  animation: toastOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
}
```

**Loading state inside toast:**

```css
.toast-progress {
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 99px;
  overflow: hidden;
  margin-top: 8px;
}

.toast-progress-bar {
  height: 100%;
  background: white;
  border-radius: 99px;
  animation: progressFill 3s linear forwards;
}

@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
```

**Success/celebration state:**

```css
.toast.success {
  background: #16a34a;
}

/* Particle/confetti effect: use canvas-confetti library */
/* import confetti from 'canvas-confetti'; */
/* confetti({ particleCount: 40, spread: 60, origin: { y: 0.9 } }); */
```

### The Rules

- **Always animate out, not just in.** A toast that disappears instantly feels like a bug. Add `exiting` class 250ms before removing the DOM element.
- Auto-dismiss timing: 4 seconds for info/success, persistent for errors (require manual dismiss).
- Never stack more than 3 toasts. Remove oldest when 4th arrives.
- Include a close (×) button on every toast — users may want to dismiss early.
- Error toasts should be a different color (dark red `#7f1d1d` bg) and never auto-dismiss.

---

## INTERACTION 4 — NAME TAG ON HOVER (Tooltip with personality)

### The Pattern

When hovering over a small avatar or icon, a styled name tag pops up with a spring animation:

```css
.avatar-container {
  position: relative;
  display: inline-flex;
}

.name-tag {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  opacity: 0;
  pointer-events: none;

  /* Style */
  background: #111827;
  color: white;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  /* Animation */
  transition:
    opacity 0.2s ease,
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* spring easing: overshoots slightly, bounces to rest */
}

/* Optional: slight tilt for personality */
.name-tag {
  rotate: -2deg;
}

.avatar-container:hover .name-tag {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

**With a small arrow pointing down:**

```css
.name-tag::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #111827;
}
```

### The Rules

- The spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1.0)`) is what makes it feel like a physical object, not a CSS transition. Without it, it's just a tooltip.
- Duration 400–500ms — long enough for the spring to complete.
- For a group of avatars, stagger the name tag appearance by 30ms each.
- The slight tilt (`rotate: -2deg`) adds personality — use for creative/agency contexts. Remove for enterprise/data-heavy products.

---

## INTERACTION 5 — SHIMMER LOADING STATE

### The Pattern

Shimmer (skeleton loading) replaces content placeholders. It's the difference between "loading..." and a product that feels fast.

```css
/* Skeleton container */
.skeleton {
  background: #e5e7eb;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

/* The shimmer sweep */
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

/* Dark mode shimmer */
.dark .skeleton {
  background: #2a2d3e;
}

.dark .skeleton::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}
```

**Usage — match the shape of real content:**

```html
<!-- For a card title -->
<div
  class="skeleton"
  style="height: 14px; width: 60%; border-radius: 4px;"
></div>

<!-- For a line of body text -->
<div
  class="skeleton"
  style="height: 12px; width: 90%; border-radius: 4px;"
></div>

<!-- For a chart -->
<div
  class="skeleton"
  style="height: 140px; width: 100%; border-radius: 8px;"
></div>

<!-- For a KPI number -->
<div
  class="skeleton"
  style="height: 32px; width: 80px; border-radius: 6px;"
></div>
```

### The Rules

- Skeletons must match the shape of the real content exactly. A wide rectangle where 3 lines of text will appear is wrong. Three narrow stacked lines is right.
- Animation duration: 1.5s, infinite. Faster (1s) feels frantic. Slower (2s) feels broken.
- Transition from skeleton to real content: fade in the real content over 200ms (`opacity: 0 → 1`). Never just swap instantly.
- For dark mode: use a darker base with even subtler shimmer — the contrast should be minimal.

---

## INTERACTION 6 — DELAYED TOOLTIP (Contextual help)

### The Pattern

A tooltip that only appears if the user hovers for 800–1000ms. This prevents tooltips from appearing accidentally during mouse movement, while still helping users who genuinely pause to understand an icon.

```javascript
// JS implementation (cleaner than pure CSS)

function addDelayedTooltip(triggerEl, tooltipEl, delay = 800) {
  let showTimer = null;

  triggerEl.addEventListener("mouseenter", () => {
    showTimer = setTimeout(() => {
      showTooltip(tooltipEl);
    }, delay);
  });

  triggerEl.addEventListener("mouseleave", () => {
    clearTimeout(showTimer);
    hideTooltip(tooltipEl);
  });
}

function showTooltip(el) {
  el.style.opacity = "0";
  el.style.transform = "translateY(6px) scale(0.95)";
  el.style.display = "block";

  requestAnimationFrame(() => {
    el.style.transition =
      "opacity 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1.0)";
    el.style.opacity = "1";
    el.style.transform = "translateY(0) scale(1)";
  });
}

function hideTooltip(el) {
  el.style.transition = "opacity 0.15s ease";
  el.style.opacity = "0";
  setTimeout(() => {
    el.style.display = "none";
  }, 150);
}
```

```css
.tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);

  background: #111827;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
}
```

### The Rules

- Delay: 800ms minimum. Anything under 500ms triggers accidentally during normal mouse movement.
- On `mouseleave`, cancel the timer immediately — never show a tooltip after the user has moved away.
- Apply to: icon-only buttons in toolbars, nav items without labels, action icons in tables/lists.
- Do NOT apply to: primary CTA buttons (they should be self-explanatory), anything with a visible label.

---

## INTERACTION 7 — TEXT HOVER POP-OUT (Image or card preview)

### The Pattern

Hovering over a word/link reveals a floating card with an image or preview. Used by Figma's community page and agency sites.

```css
.hover-preview-trigger {
  position: relative;
  display: inline-block;
  cursor: default;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
}

.hover-preview-card {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.95);
  opacity: 0;
  pointer-events: none;
  z-index: 200;

  /* Card style */
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  width: 200px;

  transition:
    opacity 0.2s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hover-preview-trigger:hover .hover-preview-card {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
```

**With a staggered entrance for card contents:**

```css
.hover-preview-card img {
  width: 100%;
  display: block;
}

.hover-preview-card .preview-label {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}
```

### The Rules

- Use this for: portfolio links, team member names, product feature mentions, technology references.
- Card width: 160–240px. Not wider — it shouldn't dominate the reading experience.
- Always position above the trigger by default. If near the top of the page, position below instead (use JS to detect viewport position).
- The spring on the card (`cubic-bezier(0.34, 1.56, 0.64, 1.0)`) is what makes it feel playful vs flat.

---

## INTERACTION 8 — PROGRESS BAR (Multi-step forms)

### The Pattern

A progress bar that fills smoothly as users move through steps. The key: animate the fill with `ease-in-out` over 400ms — not instantly.

```css
.progress-track {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* ease-in-out: smooth deceleration gives weight to the progression */
}

/* Step indicator dots */
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.progress-step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  transition:
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-step-dot.completed {
  background: var(--primary);
  transform: scale(1.15);
}

.progress-step-dot.active {
  background: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
}
```

**Animate step content transitions:**

```css
.step-content {
  animation: stepIn 0.35s cubic-bezier(0, 0, 0.2, 1) forwards;
}

.step-content.exiting {
  animation: stepOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes stepIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes stepOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
```

### The Rules

- Width transition: `0.4s ease-in-out`. Instant width changes destroy the progress metaphor.
- Animate step dots independently with the spring — each dot "pops" as it becomes active.
- Content slides in from the right (forward) or from the left (backward). Always respect direction.
- At 100%, show a completion animation (scale the fill, confetti, green check) — don't just end silently.

---

## INTERACTION 9 — CARD STACK / SWIPE DISMISS

### The Pattern

Stacked notification cards that can be dismissed. The top card slides away, cards below scale up and move forward.

```css
.card-stack {
  position: relative;
  width: 320px;
  height: 120px; /* height of one card */
}

.stack-card {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s ease;
}

/* Card positioning by index */
.stack-card:nth-child(1) {
  transform: translateY(0) scale(1);
  z-index: 3;
}
.stack-card:nth-child(2) {
  transform: translateY(8px) scale(0.96);
  z-index: 2;
}
.stack-card:nth-child(3) {
  transform: translateY(16px) scale(0.92);
  z-index: 1;
}
```

**Dismiss animation:**

```css
.stack-card.dismissing {
  transform: translateX(110%) rotate(8deg) !important;
  opacity: 0;
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.3s ease;
}
```

**After dismissing, advance the remaining cards:**

```javascript
function dismissTopCard() {
  const cards = document.querySelectorAll(".stack-card");

  // Animate top card out
  cards[0].classList.add("dismissing");

  // Advance remaining cards forward
  setTimeout(() => {
    cards[0].remove();
    // Recalculate positions — cards 2 and 3 move to positions 1 and 2
    updateCardPositions();
  }, 350);
}
```

### The Rules

- The cards behind must move forward as the top card leaves. This is what completes the effect — without it, it looks like the card just flies away, not like items moving up a queue.
- Rotation on dismiss (`rotate(8deg)`) makes it feel physical, like flicking a card. Without rotation, it just slides sideways.
- Max 3 cards visible in the stack. More than 3 loses the visual metaphor.

---

## INTERACTION 10 — SEARCH BAR EXPANSION

### The Pattern

A collapsed search icon that expands into a full search bar on click:

```css
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 0;
  padding: 0;
  opacity: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  transition:
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.35s ease,
    opacity 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
}

.search-wrapper.expanded .search-input {
  width: 220px;
  padding: 7px 12px 7px 32px;
  opacity: 1;
  border-color: #e5e7eb;
  background: #f3f4f6;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #9ca3af;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* Icon merges into the expanding input */
.search-wrapper.expanded .search-icon {
  opacity: 0.5;
}
```

```javascript
// Click the search icon to expand
searchIcon.addEventListener("click", () => {
  wrapper.classList.add("expanded");
  input.focus();
});

// Click outside to collapse (if empty)
document.addEventListener("click", (e) => {
  if (!wrapper.contains(e.target) && input.value === "") {
    wrapper.classList.remove("expanded");
  }
});
```

### The Rules

- Focus the input immediately after expanding. The user clicked to type — don't make them click again.
- Collapse on click-outside only if the input is empty. Never collapse while there's a query in it.
- `width` transition: `0.35s ease-in-out`. Fast enough to feel snappy, slow enough to see the shape forming.
- The icon should remain visible inside the expanded input as a prefix — don't make it disappear completely.

---

## INTERACTION 11 — UPGRADE / LIMIT REVEAL

### The Pattern

When a user hovers a usage limit, slide in the upgraded limit to show what they'd get by upgrading:

```css
.limit-display {
  position: relative;
  overflow: hidden;
  height: 1.5em; /* matches one line of text */
}

.limit-current {
  display: block;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
}

.limit-upgraded {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  transform: translateY(100%);
  opacity: 0;
  color: var(--primary);
  font-weight: 600;
  transition:
    transform 0.25s cubic-bezier(0, 0, 0.2, 1),
    opacity 0.2s ease;
}

.limit-container:hover .limit-current {
  transform: translateY(-100%);
  opacity: 0;
}

.limit-container:hover .limit-upgraded {
  transform: translateY(0);
  opacity: 1;
}
```

### The Rule

This converts awareness into intent. The user was looking at their current limit, then they see what's possible. That's a sales moment disguised as a UI moment. Keep the animation subtle — slide in, not zoom in. The information is the hero, not the animation.

---

## SCROLL REVEAL — CARDS ENTERING THE VIEWPORT

### The Pattern

Cards and sections animate in as the user scrolls to them:

```javascript
// Setup IntersectionObserver
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target); // Fire once only
      }
    });
  },
  {
    threshold: 0.12, // 12% of element must be visible
    rootMargin: "0px 0px -40px 0px", // trigger slightly before fully in view
  },
);

// Apply to all cards
document.querySelectorAll(".card, .section, [data-reveal]").forEach((el, i) => {
  el.style.setProperty("--reveal-delay", `${i * 60}ms`); // 60ms stagger
  observer.observe(el);
});
```

```css
/* Initial state */
.card,
[data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.45s ease var(--reveal-delay, 0ms),
    transform 0.45s cubic-bezier(0, 0, 0.2, 1) var(--reveal-delay, 0ms);
}

/* Revealed state */
.card.revealed,
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}
```

### The Rules

- **Fire once only.** `observer.unobserve(el)` after the element reveals. Do not re-hide on scroll up — that's annoying.
- Stagger: 60ms between cards in the same row. Not 100ms (too dramatic) and not 30ms (too fast to perceive).
- Translate distance: 16px. Not 40px (overdramatic) and not 8px (barely noticeable).
- Duration: 0.45s. Longer feels sluggish on a fast scroll.
- Threshold: 0.12 (12% visible). Triggering at 0.5 (fully in view) feels late.
- **Skip this animation for users who prefer reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  .card,
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

---

## SIDEBAR EXPAND/COLLAPSE

```css
.sidebar {
  width: 185px;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
}

/* Labels fade out faster than width collapses */
.sidebar-label {
  opacity: 1;
  transition: opacity 0.15s ease;
  white-space: nowrap;
}

.sidebar.collapsed .sidebar-label {
  opacity: 0;
}

/* Toggle icon rotates */
.collapse-toggle {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .collapse-toggle {
  transform: rotate(180deg);
}
```

### The Rules

- Width transition: `0.22s` — fast. Sidebar toggle should feel instant, not cinematic.
- Labels fade out faster than the width collapses. If they fade at the same rate, text gets clipped during the transition (ugly).
- The chevron rotates 180° to signal "it can be expanded." Never remove the toggle icon when collapsed.

---

## DARK MODE TRANSITION

When switching between light and dark:

```css
/* Apply to root to transition all colors */
:root {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Target specific properties — not 'all' */
.card,
.sidebar,
header {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* Exclude transitions for elements where it would look wrong */
.btn,
input,
[role="button"] {
  /* Buttons should NOT transition with the theme — jarring */
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
  /* Their hover behavior takes priority */
}
```

---

## THE ANIMATION QUALITY CHECKLIST

Before shipping any interface with animations, check:

**Correctness**

- [ ] All hover states use `transition` with explicit property names (not `all`)
- [ ] Duration: hover states 100–150ms, short transitions 200–300ms, entrances 350–500ms
- [ ] Easing: entering elements use ease-out, exiting use ease-in, spatial transitions use ease-in-out

**Craft**

- [ ] Every button has `:active { transform: scale(0.97) }` press feedback
- [ ] Toasts animate both in AND out before DOM removal
- [ ] Scroll reveals fire once only (unobserve after trigger)
- [ ] Scroll reveals are staggered by 60ms per element
- [ ] Skeleton loaders match the shape of the real content

**Quality**

- [ ] Spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1.0)`) used for anything that should feel satisfying (tooltips, badges, success states)
- [ ] No `transition: all` anywhere in the codebase
- [ ] `prefers-reduced-motion` media query disables all scroll reveals and entrance animations
- [ ] Sidebar collapse is ≤0.25s — snappy, not cinematic

**Don'ts**

- [ ] No rotation/bounce on primary CTA buttons — reserve physics for secondary delight moments
- [ ] No animation on page title or main headers — they should feel stable
- [ ] No looping animations on content the user needs to read (distracting)
- [ ] No 3D transforms (rotateX, rotateY) unless the entire design concept demands it

---

## HOW TO USE THIS GUIDE

```
Follow the Micro-interactions Guide I've provided.

When building any interactive element:
1. Check the relevant interaction section (button = Section 1,
   toast = Section 3, search = Section 10, etc.)
2. Use the exact easing values from the Easing Dictionary
3. Before finishing, run through the Animation Quality Checklist

Additional context:
- Theme: [light / dark]
- Framework: [React / Vue / vanilla JS]
- What I'm building: [description]
```

---

_Micro-interactions & Animations Guide v1.0 — companion to Design Rulebook v1.9, Page Blueprints v2.0, Dashboard Guide v1.0, Frontend UI Guide v1.0_
