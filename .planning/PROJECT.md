# STACKFORGE AI — MASTER PROJECT PLAN V3.0
# Version 3.0 | Complete Rebuild Plan

## THE PRODUCT IN ONE SENTENCE
StackForge AI is a website builder where non-technical users type a plain prompt, answer a few questions, and receive a professional working website — with real UI components, version history, live preview, and the ability to refine it through chat — without ever touching code.

## THE CORE PROBLEM THIS PLAN SOLVES
- LLM generates generic boilerplate with bland Tailwind components.
- No context about the business (name, colors, tone).
- Output looks AI-generated and amateur.
- Import errors break the preview.
- User has no way to refine it iteratively.
- No version history.

## THE 6 LAYERS OF EVERY PROJECT
1.  **Context Collection**: Chat agent asks clarifying questions (Mistral/Groq).
2.  **Dynamic Code Generation with Agentic Loop**: Template-referenced or Fully dynamic modes.
3.  **Model Selection and Planning**:
    - Mistral: Code generation (Phase 3), Logic fixes.
    - Groq: Reasoning, Planning, Chat, Context analysis.
    - Qwen 2.5 Coder (Local): Fallback for all tasks.
4.  **Creation and Preview**: CLI agent for Next.js (npm install, next dev, localtunnel).
5.  **Agentic Refinement Loop**: Auto-fix build errors (max 3 iterations).
6.  **Professional UI Components**: Library of polished components injected into prompts.

## TECH STACK
### Builder App
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Zustand, Monaco Editor, Clerk, Axios, WebSocket, Stripe.js
- **Backend**: Node.js + Express, MongoDB Atlas, BullMQ + Upstash Redis, Clerk SDK, Zod, Winston, ws (Socket.IO used currently), archiver, jsdiff, child_process

### AI Models
- **Mistral API**: code generation, fixing.
- **Groq API**: reasoning, planning, fallback.
- **Qwen 2.5 Coder (Ollama)**: fallback for all.

### Generated Website Stack
- **HTML**: index.html + Tailwind CDN + AOS.
- **Next.js**: Next.js 14 App Router + Tailwind + framer-motion + lucide-react.

## INFRASTRUCTURE
- MongoDB Atlas (Free), Upstash Redis, Cloudflare R2, Netlify API, Clerk, Stripe (Test), Render.com, Vercel, Mistral, Groq, Ollama (Local).

---
*Last updated: March 24, 2026 based on Master Plan V3.0*
