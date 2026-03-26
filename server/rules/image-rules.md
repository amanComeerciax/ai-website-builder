# HIGH-QUALITY IMAGE LIBRARY

### Guidelines for AI Generation

> Use this library to select visually stunning, professional images for every website section. Never use generic placeholders (`placehold.co`) if a high-quality alternative exists here.

---

## SECTION 1 — QUALITY STANDARDS

- **Resolution:** Use `w=1200&q=80` for hero sections, `w=800&q=60` for feature cards.
- **Aspect Ratio:** Hero images should be `landscape` (16:9 or 21:9). Feature thumbnails should be `square` (1:1) or `portrait` (4:5).
- **Overlay:** Always ensure text on top of images is readable. Use `bg-black/40` or CSS `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))` if the image is a background.

---

## SECTION 2 — IMAGE REPOSITORY (UNSPLASH)

### 2.1 Coffee Shop / Bakery / Cafe
- **Main Hero:** `https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200` (Modern cafe interior)
- **Latte Art:** `https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800`
- **Pastries:** `https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800`
- **Barista at work:** `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800`

### 2.2 Restaurant / Fine Dining / Food
- **Hero Plate:** `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200`
- **Kitchen/Chef:** `https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800`
- **Table Setting:** `https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800`
- **Dessert:** `https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800`

### 2.3 SaaS / Tech / Dashboard / Business
- **Abstract Tech Hero:** `https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200`
- **Modern Office/Team:** `https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200`
- **Data/Analytics Visual:** `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200`
- **Laptop on Desk:** `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800`

### 2.4 Portfolio / Creative / Photography
- **Architectural Minimalism:** `https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&q=80&w=1200`
- **Studio Setup:** `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200`
- **Abstract Art Background:** `https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200`

### 2.5 Fitness / Gym / Wellness
- **Gym Interior:** `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200`
- **Yoga/Wellness:** `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200`
- **Fresh Smoothies:** `https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800`

---

## SECTION 3 — FALLBACK PATTERNS

If a specific category is NOT listed above, use the following dynamic keyword-based Unsplash pattern:

`https://images.unsplash.com/featured/?<KEYWORD1>,<KEYWORD2>&w=1200&q=80`

**Examples:**
- For a **Pet Shop**: `https://images.unsplash.com/featured/?dog,cat&w=1200&q=80`
- For a **Law Firm**: `https://images.unsplash.com/featured/?office,lawyer&w=1200&q=80`
- For a **Travel Agency**: `https://images.unsplash.com/featured/?mountains,beach&w=1200&q=80`

**MANDATORY:** Always include high-quality, descriptive `alt` tags (e.g., `alt="Premium espresso machine making coffee"`).
