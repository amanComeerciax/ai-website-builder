## SECTION 6 — TRACK A: HTML GENERATION RULES

> **Phase 3 only. Qwen receives this section + Section 8.**
> **Used when `outputTrack = "html"` from Phase 1 JSON.**

### Track A Definition
- Output: **ONE file** — `index.html`. Nothing else.
- No npm. No `import`. No JSX. No build step.
- Preview: `iframe.srcdoc = htmlContent` — instant, zero infrastructure.
- Must work when opened directly in Chrome.

### 6.1 — File Structure Order
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- actual site name --></title>
  <!-- 1. Google Fonts preconnect + link tag -->
  <!-- 2. Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- 3. Other CDN CSS (AOS, Swiper) -->
  <!-- 4. Custom <style> with :root custom properties -->
</head>
<body>
  <!-- 5. Semantic HTML: nav, main, sections, footer -->
  <!-- 6. CDN JS scripts -->
  <script>/* All vanilla JS here */</script>
</body>
</html>
```

### 6.2 — Allowed CDN Libraries

| Library | CDN URL | Use for |
|---|---|---|
| Tailwind CSS | `https://cdn.tailwindcss.com` | All utility classes |
| AOS | `https://unpkg.com/aos@2.3.1/dist/aos.css` + js | Scroll animations |
| Lucide | `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js` | Icons |
| Swiper | `https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js` | Sliders |
| GSAP | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js` | Advanced animation |
| Chart.js | `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js` | Charts |
| Alpine.js | `https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js` | Reactive UI |

### 6.3 — Track A Forbidden Patterns
- ❌ Any `import` or `require` statement — zero npm packages
- ❌ `react-scroll` — use `scrollIntoView({behavior:'smooth'})` instead
- ❌ `fetch()` for data — all content must be static
- ❌ `<script type="module">` — plain `<script>` tags only
- ❌ References to files that don't exist — 100% self-contained

### 6.4 — Smooth Scroll (replaces react-scroll forever)
```html
<a href="#section-id">Link</a>

<script>
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault()
    document.querySelector(link.getAttribute('href'))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})
</script>
```

### 6.5 — Section Order by Site Type

| Type | Section order |
|---|---|
| Landing / SaaS | nav → hero → logo-bar → problem → features → how-it-works → testimonials → pricing → cta → footer |
| Restaurant / Cafe | nav → hero → about → menu → gallery → testimonials → location → contact → footer |
| Portfolio | nav → hero → about → work → skills → testimonials → contact → footer |
| Agency | nav → hero → services → process → portfolio → team → testimonials → contact → footer |
| Event | nav → hero → details → speakers → schedule → venue → tickets → footer |

---
