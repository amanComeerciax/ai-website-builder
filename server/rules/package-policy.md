# Package Policy
# Applied to ALL code generation tasks — prevents missing dependency errors

## Track A — HTML/Vanilla JS (ZERO npm packages allowed)
Track A generates a single index.html file. There is NO npm. There is NO build step.
Everything loads via CDN script tags. No import statements. No require statements.

### Allowed CDN Libraries (load via <script> or <link> tags ONLY):
- Tailwind CSS: `<script src="https://cdn.tailwindcss.com"></script>`
- AOS animations: `<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">` + script
- Lucide icons: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`
- GSAP: `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>`
- Swiper: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">` + script
- Chart.js: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- Alpine.js: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
- GLightbox: CDN from jsdelivr
- Google Fonts: `<link href="https://fonts.googleapis.com/..." rel="stylesheet">` in head

### The EXACT fix for smooth scroll (the most common error):
WRONG: `import { Link } from 'react-scroll'` — THIS CAUSES THE RED ERROR SCREEN
CORRECT in Track A:
```html
<a href="#section" class="nav-link" onclick="smoothScroll(event, '#section')">Menu</a>
<script>
function smoothScroll(e, target) {
  e.preventDefault();
  document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
}
</script>
```

### Self-contained test for Track A:
"If I save this index.html to my desktop and open it in Chrome, does it work with zero errors?"
If NO → there is a dependency violation. Fix it before returning.

---

## Track B — React/Vite (restricted npm packages only)

### ALLOWED packages — ONLY these, nothing else:
```
react
react-dom
react-router-dom
react-hook-form
@tanstack/react-query
axios
lucide-react
clsx
tailwind-merge
date-fns
framer-motion
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-select
recharts
react-hot-toast
zustand
zod
@hookform/resolvers
```

### PERMANENTLY BLOCKED packages — NEVER import these:
```
react-scroll     (use scrollIntoView() instead)
react-slick      (use CSS scroll snap instead)
react-spring     (use framer-motion instead)
moment           (use date-fns instead)
lodash           (use native JS instead)
jquery           (never)
bootstrap        (use Tailwind instead)
material-ui      (not installed)
ant-design       (not installed)
chakra-ui        (not installed)
styled-components (not installed)
emotion          (not installed)
three.js         (not installed)
p5.js            (not installed)
```

### Rule: If a feature needs a blocked package, implement it natively.
If a user asks for a slider → use CSS scroll-snap, not react-slick.
If a user asks for smooth scroll → use `element.scrollIntoView({behavior:'smooth'})`.
If a user asks for date formatting → use `new Intl.DateTimeFormat()` or date-fns.
NEVER invent a package name. NEVER assume a package exists unless it's in the ALLOWED list.
