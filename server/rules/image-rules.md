# AUTONOMOUS IMAGE SYSTEM

> The AI must decide what each image should depict based on the user's prompt and page context.
> No hardcoded image libraries. Every image is generated dynamically to match the content.

---

## HOW IT WORKS

For every `<img>` tag in the generated website, the AI writes a **short, specific visual description** of what the image should show, then encodes it into a Pollinations AI URL:

```
https://image.pollinations.ai/prompt/{URL-ENCODED-DESCRIPTION}?width={W}&height={H}&nologo=true
```

The AI's job is to:
1. Understand the user's business/website context
2. For EACH image slot, decide exactly what it should depict
3. Write a concise visual description (3-8 words)
4. URL-encode the description and build the Pollinations URL

---

## URL FORMAT

### Hero / Banner images (large, wide)
```
https://image.pollinations.ai/prompt/{description}?width=1200&height=800&nologo=true
```

### Card / Feature images (medium)
```
https://image.pollinations.ai/prompt/{description}?width=800&height=600&nologo=true
```

### Thumbnail / Avatar images (small, square)
```
https://image.pollinations.ai/prompt/{description}?width=400&height=400&nologo=true
```

---

## DESCRIPTION WRITING RULES (CRITICAL)

1. **BE SPECIFIC TO THE ITEM:** The description MUST match the exact card/section content.
   - ✅ Menu card "Masala Chai" → `hot masala chai cup with spices on wooden table`
   - ✅ Menu card "Samosa" → `crispy golden samosa with green chutney`
   - ✅ Hero for gym → `modern gym interior with weights and treadmills`
   - ❌ WRONG: Using "food" for a samosa card — too generic
   - ❌ WRONG: Using the same description for different cards

2. **CONTEXT FROM USER PROMPT:** Derive the visual style from what the user asked for.
   - User says "luxury spa" → descriptions should include "elegant", "marble", "calm lighting"
   - User says "street food stall" → descriptions should include "vibrant", "busy street", "colorful"
   - User says "tech startup" → descriptions should include "modern", "minimal", "gradient", "laptop"

3. **UNIQUE PER CARD:** Every image on the page MUST use a DIFFERENT description. Never repeat.

4. **PROFESSIONAL PHOTOGRAPHY STYLE:** Append style keywords to improve quality:
   - Add `professional photography` for product/food shots
   - Add `modern interior design` for space/venue shots  
   - Add `minimal clean background` for product shots
   - Add `aerial view` for landscape/location shots

5. **KEEP DESCRIPTIONS SHORT:** 3-8 words is ideal. Too long = slow/unpredictable.
   - ✅ `hot latte art in ceramic cup`
   - ✅ `cozy cafe interior warm lighting`
   - ❌ `a beautiful photograph of a hot cup of latte with intricate art in a handmade ceramic cup sitting on a rustic wooden counter in a cozy cafe with warm ambient lighting` — TOO LONG

---

## EXAMPLES BY WEBSITE TYPE

### Chai / Tea Shop
```html
<img src="https://image.pollinations.ai/prompt/hot%20masala%20chai%20glass%20cup%20with%20cardamom?width=800&height=600&nologo=true" alt="Masala Chai">
<img src="https://image.pollinations.ai/prompt/crispy%20golden%20samosa%20with%20mint%20chutney?width=800&height=600&nologo=true" alt="Samosa">
<img src="https://image.pollinations.ai/prompt/indian%20chai%20stall%20street%20vendor?width=1200&height=800&nologo=true" alt="Our Chai Stall">
```

### Restaurant
```html
<img src="https://image.pollinations.ai/prompt/gourmet%20pasta%20dish%20professional%20photography?width=800&height=600&nologo=true" alt="Signature Pasta">
<img src="https://image.pollinations.ai/prompt/elegant%20restaurant%20interior%20candlelight?width=1200&height=800&nologo=true" alt="Restaurant Interior">
```

### SaaS / Tech
```html
<img src="https://image.pollinations.ai/prompt/modern%20saas%20dashboard%20analytics%20dark%20mode?width=1200&height=800&nologo=true" alt="Dashboard">
<img src="https://image.pollinations.ai/prompt/diverse%20team%20collaborating%20modern%20office?width=800&height=600&nologo=true" alt="Our Team">
```

### Fitness / Gym
```html
<img src="https://image.pollinations.ai/prompt/modern%20gym%20interior%20weights%20equipment?width=1200&height=800&nologo=true" alt="Gym Floor">
<img src="https://image.pollinations.ai/prompt/person%20doing%20yoga%20sunrise%20peaceful?width=800&height=600&nologo=true" alt="Yoga Class">
```

---

## BANNED PATTERNS

- ❌ `source.unsplash.com` — DEAD SERVICE, returns 503
- ❌ `images.unsplash.com/featured/?keywords` — UNRELIABLE, often broken
- ❌ `placehold.co` or `placeholder.com` — ugly grey boxes
- ❌ `src=""` — empty source, shows broken icon
- ❌ Same image URL used twice on the same page
- ❌ Generic descriptions that don't match the card content

## MANDATORY CSS FOR EVERY `<img>` (CRITICAL — THIS FIXES IMAGE MISALIGNMENT)

Every `<img>` tag MUST have the correct CSS to fill its container. Missing these styles is the #1 cause of broken layouts.

### Rule: Images inside fixed-height containers
```html
<!-- ✅ CORRECT — card/program/feature images -->
<div style="height:200px;overflow:hidden;border-radius:12px;">
  <img src="..." alt="..." style="width:100%;height:100%;object-fit:cover;display:block;">
</div>

<!-- ❌ WRONG — image overflows or collapses -->
<div style="height:200px;">
  <img src="..." alt="...">
</div>
```

### Rule: Images that fill absolute-position containers (gallery, hero bg)
```html
<!-- ✅ CORRECT -->
<div style="position:relative;height:300px;overflow:hidden;">
  <img src="..." alt="..." style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
</div>
```

### Rule: Avatar / circle images
```html
<!-- ✅ CORRECT -->
<div style="width:80px;height:80px;border-radius:50%;overflow:hidden;">
  <img src="..." alt="..." style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">
</div>
```

### Rule: Sponsor / logo grid images
```html
<!-- ✅ CORRECT -->
<div style="height:120px;overflow:hidden;">
  <img src="..." alt="..." style="width:100%;height:100%;object-fit:cover;display:block;">
</div>
```

## MANDATORY IMAGE ATTRIBUTES

- ✅ Every `<img>` must have a Pollinations URL with a context-specific description
- ✅ Every `<img>` must have a descriptive `alt` tag
- ✅ Every `<img>` inside a container MUST have `style="width:100%;height:100%;object-fit:cover;display:block;"`
- ✅ Hero images use `width=1200&height=800`
- ✅ Card images use `width=800&height=600`
- ✅ Thumbnails / avatars use `width=400&height=400`
- ❌ NEVER omit `object-fit:cover` on any `<img>` inside a box with explicit height/width
