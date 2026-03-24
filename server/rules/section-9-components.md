## SECTION 9 — NEXT.JS COMPONENT LIBRARY

> **Phase 3 Track B only. Injected alongside Section 7 + Section 8.**
> **These are the 11 animation components extracted from the animation reference file.**
> **When generating any component for a Next.js site, use THESE patterns exactly.**

### Component Map — User request to component

| Page needs / User asks for | Component to use |
|---|---|
| Any button, CTA, form submit | `Button` (C01) |
| Keyboard shortcut, ⌘K hint | `KbdShortcut` (C02) |
| Notification, alert, success/error message | `Toast` + `ToastProvider` (C03) |
| Team section, user avatars, contributors | `Avatar` with name tag (C04) |
| Loading state, data fetching | `Skeleton` / `SkeletonCard` (C05) |
| Icon toolbar, editor buttons | Icon buttons with `Tooltip` (C06) |
| Tech mentions, inline link previews | `HoverPreview` (C07) |
| Multi-step form, onboarding, checkout | `ProgressStepper` (C08) |
| Notification stack, task queue | `CardStack` (C09) |
| Nav search, header search | `SearchBar` (C10) |
| Pricing limits, plan comparison rows | `UpgradeRow` (C11) |
| Every content section, every card | Wrap with `RevealOnScroll` (C00) |

**NEVER replace these with alternatives:**
- ❌ `react-tooltip` → use C06 Tooltip
- ❌ `react-toastify` / `sonner` → use C03 Toast
- ❌ CSS `fadeIn` for reveals → use C00 RevealOnScroll
- ❌ Any slider/carousel library → use C09 CardStack or CSS scroll-snap

---

### C00 — RevealOnScroll (wrap every section)

```tsx
'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface RevealProps {
  children: React.ReactNode
  delay?: number   // milliseconds, for stagger
  className?: string
}

export function RevealOnScroll({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px', amount: 0.12 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1.0], delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger pattern for card grids:
// <RevealOnScroll delay={0}>  <Card /></RevealOnScroll>
// <RevealOnScroll delay={60}> <Card /></RevealOnScroll>
// <RevealOnScroll delay={120}><Card /></RevealOnScroll>
// Stagger: 60ms per element — never 30ms (too fast) or 100ms (too slow)
```

---

### C01 — Button

```tsx
'use client'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'brand' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-[#111827] text-white hover:bg-[#1f2937]',
  secondary: 'bg-white text-[#374151] border border-[#e5e7eb] hover:bg-[#f9fafb]',
  brand:     'bg-[#2899d2] text-white hover:bg-[#1979b0]',
  danger:    'bg-[#991b1b] text-white hover:bg-[#7f1d1d]',
}

export function Button({
  variant = 'primary', children, onClick, className, disabled, type = 'button'
}: {
  variant?: ButtonVariant; children: React.ReactNode; onClick?: () => void
  className?: string; disabled?: boolean; type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}                        // press — mandatory
      transition={{ duration: 0.08 }}
      className={clsx(
        'inline-flex items-center justify-center gap-[7px]',
        'px-[18px] py-[10px] rounded-lg',
        'text-[13.5px] font-semibold cursor-pointer',
        'transition-[background-color,border-color] duration-150', // never transition:all
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], className
      )}
    >
      {children}
    </motion.button>
  )
}
```

**Slide-up text button (dual layer hover):**
```tsx
'use client'
import { motion } from 'framer-motion'

export function SlideButton({ label, hoverLabel }: { label: string; hoverLabel: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className="group relative h-10 px-[18px] overflow-hidden rounded-lg bg-[#111827] text-white text-[13.5px] font-semibold cursor-pointer inline-flex items-center justify-center"
    >
      {/* Default text slides up on hover */}
      <span className="block transition-[transform,opacity] duration-300 ease-[cubic-bezier(0,0,0.2,1)] group-hover:-translate-y-full group-hover:opacity-0">
        {label}
      </span>
      {/* Hover text slides in from below */}
      <span className="absolute inset-0 flex items-center justify-center translate-y-full opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0,0,0.2,1)] group-hover:translate-y-0 group-hover:opacity-100">
        {hoverLabel}
      </span>
    </motion.button>
  )
}
```

---

### C02 — KbdShortcut

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function KbdShortcut({ keys, label }: { keys: string[]; label: string }) {
  const [firing, setFiring] = useState(false)
  const [success, setSuccess] = useState(false)

  const fire = () => {
    setFiring(true)
    setTimeout(() => {
      setFiring(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }, 300)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[#374151]">{label}</span>
      <div
        onClick={fire}
        className="flex items-center gap-[6px] px-[14px] py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg cursor-pointer hover:border-[#2899d2] transition-[border-color] duration-150"
      >
        {keys.map((k, i) => (
          <motion.kbd
            key={i}
            animate={firing
              ? { scale: 0.88, borderColor: '#2899d2', boxShadow: '0 0 0 3px rgba(40,153,210,0.10)' }
              : { scale: 1,    borderColor: '#d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
            }
            transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="px-[7px] py-[2px] bg-white border rounded-[5px] font-mono text-[11px] text-[#374151]"
          >
            {k}
          </motion.kbd>
        ))}
      </div>
      <AnimatePresence>
        {success && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] }} // spring
            className="text-[12px] font-semibold text-[#16a34a] flex items-center gap-1"
          >
            ✓ Done
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### C03 — Toast Notifications

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { createContext, useContext } from 'react'

type ToastType = 'info' | 'success' | 'error'
interface Toast { id: string; type: ToastType; title: string; message: string }

const ToastContext = createContext<{ show: (type: ToastType, title: string, message: string) => void }>({ show: () => {} })
export const useToast = () => useContext(ToastContext)

const bgMap = { info: 'bg-[#111827]', success: 'bg-[#15803d]', error: 'bg-[#991b1b]' }
const autoMap = { info: true, success: true, error: false }  // error = manual dismiss only

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => {
      const next = [...prev, { id, type, title, message }]
      return next.length > 3 ? next.slice(-3) : next  // max 3 toasts
    })
    if (autoMap[type]) setTimeout(() => remove(id), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{
                enter: { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] },
                exit:  { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] }
              }}
              className={`flex items-start gap-[10px] px-4 py-[13px] rounded-[10px] text-white min-w-[280px] max-w-[360px] shadow-[0_4px_20px_rgba(0,0,0,0.18)] pointer-events-auto relative overflow-hidden ${bgMap[t.type]}`}
            >
              <div className="flex-1">
                <div className="font-semibold text-[13px]">{t.title}</div>
                <div className="text-[12px] opacity-80 mt-[2px]">{t.message}</div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-white/60 hover:text-white text-[16px] bg-transparent border-0 cursor-pointer"
                aria-label="Close notification"
              >
                ×
              </button>
              {autoMap[t.type] && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
                  <div className="h-full bg-white/50 animate-[progressFill_4s_linear_forwards]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
// Usage: wrap app/layout.tsx children with <ToastProvider>
// In component: const { show } = useToast(); show('success', 'Saved!', 'Your changes are live.')
```

---

### C04 — Avatar with Name Tag

```tsx
'use client'
import { motion } from 'framer-motion'

export function Avatar({ initials, color, name }: { initials: string; color: string; name: string }) {
  return (
    <div className="relative inline-flex cursor-pointer group">
      {/* Name tag — spring animation, slight tilt */}
      <motion.div
        initial={{ opacity: 0, y: 8, x: '-50%', rotate: -2 }}
        whileHover={{ opacity: 1, y: 0, x: '-50%', rotate: -2 }}
        transition={{ opacity: { duration: 0.2 }, y: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1.0] } }}
        className="absolute bottom-[calc(100%+10px)] left-1/2 bg-[#111827] text-white px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap pointer-events-none z-10"
        style={{ translateX: '-50%' }}
      >
        {name}
        {/* Arrow pointing down */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#111827]" />
      </motion.div>

      {/* Avatar circle */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.2 }}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white border-2 border-[#e5e7eb]"
        style={{ background: color }}
      >
        {initials}
      </motion.div>
    </div>
  )
}

// Avatar group (overlapping):
// <div className="flex">
//   <Avatar initials="AJ" color="linear-gradient(135deg,#667eea,#764ba2)" name="Alex Johnson" />
//   <div className="-ml-[10px]"><Avatar ... /></div>
// </div>
```

---

### C05 — Skeleton Loader

```tsx
import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded bg-[#e5e7eb]',
        'after:absolute after:inset-0 after:animate-shimmer',
        'after:bg-[length:200%_100%]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-4 w-full">
      <div className="flex items-center gap-[10px] mb-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-[6px]">
          <Skeleton className="h-3 w-[55%]" />
          <Skeleton className="h-[10px] w-[35%]" />
        </div>
      </div>
      <Skeleton className="h-[10px] w-[90%] mb-[6px]" />
      <Skeleton className="h-[10px] w-[75%] mb-3" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  )
}
// Skeleton shapes must EXACTLY match the real content they replace
// Transition from skeleton to content: opacity 0→1 over 250ms — never instant swap
```

---

### C06 — Delayed Tooltip (800ms delay)

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'

export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 800) }} // 800ms delay
      onMouseLeave={() => { clearTimeout(timer.current); setVisible(false) }}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.93 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1.0] }, y: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1.0] } }}
            className="absolute bottom-[calc(100%+8px)] left-1/2 bg-[#111827] text-white px-[10px] py-[5px] rounded-md text-[11.5px] whitespace-nowrap pointer-events-none z-[100]"
            style={{ translateX: '-50%' }}
          >
            {label}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#111827]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### C07 — HoverPreview Card

```tsx
'use client'
import { motion } from 'framer-motion'

export function HoverPreview({ text, previewContent, previewLabel }: {
  text: string; previewContent: React.ReactNode; previewLabel: string
}) {
  return (
    <span className="relative inline-block cursor-default underline decoration-dotted underline-offset-[3px] text-[#2899d2] font-medium group">
      {text}
      <motion.div
        initial={{ opacity: 0, y: 10, x: '-50%', scale: 0.93 }}
        whileHover={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
        transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] }, y: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1.0] } }}
        className="absolute bottom-[calc(100%+12px)] left-1/2 w-[180px] rounded-xl overflow-hidden bg-white border border-[#e5e7eb] shadow-[0_8px_32px_rgba(0,0,0,0.13)] pointer-events-none z-[200]"
        style={{ translateX: '-50%' }}
      >
        <div className="w-full h-[90px] flex items-center justify-center">{previewContent}</div>
        <div className="px-3 py-2 text-[12px] font-medium text-[#374151]">{previewLabel}</div>
      </motion.div>
    </span>
  )
}
```

---

### C08 — ProgressStepper

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function ProgressStepper({ steps }: { steps: string[] }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, current + dir))
    if (next === current) return
    setDirection(dir)
    setCurrent(next)
  }

  return (
    <div className="w-full">
      {/* Progress track */}
      <div className="w-full h-[5px] bg-[#e5e7eb] rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-[#2899d2] rounded-full"
          animate={{ width: `${(current / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.4, 0.0, 0.2, 1.0] }} // ease-in-out
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mb-4">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i <= current ? '#2899d2' : '#e5e7eb',
              scale: i === current ? 1.2 : i < current ? 1.2 : 1,
              boxShadow: i === current ? '0 0 0 3px rgba(40,153,210,0.10)' : '0 0 0 0 transparent'
            }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1.0] }} // spring on dots
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>

      {/* Step content with directional slide */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter: (d) => ({ x: d > 0 ? 16 : -16, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d) => ({ x: d > 0 ? -16 : 16, opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="text-[13px] text-[#374151] text-center py-2"
          >
            {steps[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mt-3">
        <button onClick={() => go(-1)} className="text-[12px] px-3 py-[7px] rounded-lg bg-white border border-[#e5e7eb] hover:bg-[#f9fafb]">← Back</button>
        <button onClick={() => go(1)}  className="text-[12px] px-3 py-[7px] rounded-lg bg-[#111827] text-white hover:bg-[#1f2937]">Next →</button>
      </div>
    </div>
  )
}
```

---

### C09 — CardStack

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface StackCard { icon: string; title: string; subtitle: string }

const positions = [
  { y: 0,  scale: 1,    zIndex: 3, bg: 'bg-white border-[#e5e7eb] shadow-[0_4px_16px_rgba(0,0,0,0.08)]' },
  { y: 8,  scale: 0.96, zIndex: 2, bg: 'bg-[#f3f4f6] border-[#e5e7eb]' },
  { y: 16, scale: 0.92, zIndex: 1, bg: 'bg-[#e9ebee] border-[#e0e2e6]' },
]

export function CardStack({ cards }: { cards: StackCard[] }) {
  const [stack, setStack] = useState(cards)

  const dismiss = () => {
    setStack(prev => prev.slice(1))
  }

  if (stack.length === 0) {
    return <div className="text-center text-[#9ca3af] text-[13px] py-5">All caught up! 🎉</div>
  }

  return (
    <div className="relative w-[260px] h-[100px] cursor-pointer mx-auto" onClick={dismiss}>
      <AnimatePresence>
        {stack.slice(0, 3).map((card, i) => {
          const pos = positions[i]
          return (
            <motion.div
              key={card.title}
              layout
              initial={i === 0 ? { x: '120%', rotate: 8, opacity: 0 } : false}
              animate={{ y: pos.y, scale: pos.scale, x: 0, rotate: 0, opacity: 1, zIndex: pos.zIndex }}
              exit={{ x: '120%', rotate: 8, opacity: 0, zIndex: 10 }}
              transition={{
                x: { duration: 0.35, ease: [0.4, 0.0, 1.0, 1.0] }, // ease-in for exit
                y: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1.0] },   // ease-in-out for advance
                scale: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1.0] }
              }}
              className={`absolute inset-0 rounded-xl flex items-center px-4 py-[14px] gap-[10px] border ${pos.bg}`}
            >
              <span className="text-[20px]">{card.icon}</span>
              <div>
                <div className="font-semibold text-[12.5px] text-[#111827]">{card.title}</div>
                <div className="text-[11px] text-[#9ca3af]">{card.subtitle}</div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
// Rotation on dismiss (rotate: 8) is mandatory — makes it feel physical
```

---

### C10 — SearchBar

```tsx
'use client'
import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

export function SearchBar() {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const expand = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50) // focus immediately
  }

  const collapse = () => {
    setQuery('')
    setExpanded(false)
  }

  // Collapse on click outside — only if empty
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-search]') && query === '') {
        setExpanded(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [query])

  return (
    <div data-search className="relative flex items-center">
      {/* Search icon button — hides when expanded */}
      <motion.button
        animate={{ opacity: expanded ? 0 : 1, pointerEvents: expanded ? 'none' : 'auto' }}
        transition={{ duration: 0.2 }}
        onClick={expand}
        className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-[#f3f4f6] border border-[#e5e7eb] text-[#6b7280] hover:bg-white hover:text-[#111827] transition-[background,color] duration-150"
        aria-label="Open search"
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </motion.button>

      {/* Expandable input */}
      <motion.div
        animate={{ width: expanded ? 200 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0.0, 0.2, 1.0] }} // ease-in-out
        className="overflow-hidden"
        style={{ marginLeft: expanded ? -28 : 0 }}
      >
        <div className="relative">
          <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-[34px] pl-8 pr-8 bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg text-[13px] text-[#111827] outline-none"
          />
          {expanded && (
            <button
              onClick={collapse}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#d1d5db] hover:bg-[#9ca3af] hover:text-white text-[#6b7280] text-[10px]"
              aria-label="Close search"
            >
              ×
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

---

### C11 — UpgradeRow

```tsx
'use client'
import { motion } from 'framer-motion'

export function UpgradeRow({ feature, current, upgraded }: {
  feature: string; current: string; upgraded: string
}) {
  return (
    <motion.div
      className="flex items-center justify-between px-[14px] py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-lg mb-2 cursor-default gap-2"
      initial="rest"
      whileHover="hover"
    >
      <span className="text-[13px] text-[#374151] font-medium flex-shrink-0">{feature}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sliding text container */}
        <div className="relative overflow-hidden h-5 min-w-[60px] flex items-center justify-end">
          {/* Current limit slides out upward */}
          <motion.span
            variants={{ rest: { y: 0, opacity: 1 }, hover: { y: '-110%', opacity: 0 } }}
            transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1.0] }}
            className="text-[13px] text-[#6b7280] whitespace-nowrap"
          >
            {current}
          </motion.span>
          {/* Upgraded limit slides in from below */}
          <motion.span
            variants={{ rest: { y: '110%', opacity: 0 }, hover: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] }}
            className="absolute right-0 text-[13px] font-semibold text-[#2899d2] whitespace-nowrap"
          >
            {upgraded}
          </motion.span>
        </div>
        {/* PRO badge — OUTSIDE sliding container, never moves */}
        <span className="inline-flex items-center px-2 py-[2px] rounded-full text-white text-[10px] font-bold tracking-[0.04em] bg-gradient-to-br from-[#2899d2] to-[#6366f1] flex-shrink-0">
          PRO
        </span>
      </div>
    </motion.div>
  )
}
```

---
