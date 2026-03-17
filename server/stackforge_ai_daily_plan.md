
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--font-sans);background:transparent;color:var(--color-text-primary)}
  .root{padding:1rem 0}
  .top-bar{display:flex;gap:10px;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center}
  .top-bar h2{font-size:16px;font-weight:500;flex:1;min-width:180px}
  .phase-tabs{display:flex;gap:6px;flex-wrap:wrap}
  .ptab{font-size:12px;padding:4px 12px;border-radius:20px;border:0.5px solid var(--color-border-secondary);cursor:pointer;background:transparent;color:var(--color-text-secondary);transition:all .15s}
  .ptab.active{background:var(--color-text-primary);color:var(--color-background-primary);border-color:var(--color-text-primary)}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1rem}
  @media(max-width:560px){.grid{grid-template-columns:1fr}}
  .card{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:1rem}
  .card-header{display:flex;align-items:center;gap:8px;margin-bottom:.75rem}
  .day-badge{font-size:11px;font-weight:500;padding:2px 8px;border-radius:12px}
  .card-title{font-size:13px;font-weight:500}
  .person-row{margin-bottom:8px}
  .person-label{font-size:11px;font-weight:500;margin-bottom:3px;display:flex;align-items:center;gap:4px}
  .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
  .task-text{font-size:12px;color:var(--color-text-secondary);line-height:1.5}
  .sync-card{border:0.5px solid var(--color-border-warning);background:var(--color-background-warning)}
  .sync-card .card-title{color:var(--color-text-warning)}
  .stack-section{margin-top:1.25rem}
  .stack-section h3{font-size:13px;font-weight:500;margin-bottom:.75rem;color:var(--color-text-secondary)}
  .stack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px}
  .stack-item{border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:.6rem .75rem;cursor:pointer;transition:background .12s}
  .stack-item:hover{background:var(--color-background-secondary)}
  .stack-item .si-label{font-size:11px;color:var(--color-text-secondary)}
  .stack-item .si-val{font-size:13px;font-weight:500;margin-top:2px}
  .progress-bar{height:3px;border-radius:2px;background:var(--color-border-tertiary);margin-top:.5rem;overflow:hidden}
  .progress-fill{height:100%;border-radius:2px;transition:width .3s}
  .milestone{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:.5rem .75rem;font-size:12px;color:var(--color-text-secondary);margin-top:.5rem;border-left:3px solid transparent}
  .setup-row{display:flex;gap:10px;margin-bottom:1.25rem;flex-wrap:wrap}
  .setup-card{flex:1;min-width:140px;background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:.75rem;border:0.5px solid var(--color-border-tertiary)}
  .setup-card .sc-num{font-size:22px;font-weight:500}
  .setup-card .sc-label{font-size:11px;color:var(--color-text-secondary);margin-top:2px}
  .setup-step{display:flex;gap:10px;padding:.6rem 0;border-bottom:0.5px solid var(--color-border-tertiary);align-items:flex-start}
  .setup-step:last-child{border-bottom:none}
  .step-num{width:22px;height:22px;border-radius:50%;border:0.5px solid var(--color-border-secondary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;flex-shrink:0;margin-top:1px}
  .step-info .st{font-size:13px;font-weight:500}
  .step-info .sd{font-size:12px;color:var(--color-text-secondary);margin-top:2px;line-height:1.5}
  .tag{display:inline-block;font-size:10px;padding:1px 7px;border-radius:10px;margin:2px 2px 2px 0}
  .tag-fe{background:var(--color-background-info);color:var(--color-text-info)}
  .tag-be{background:var(--color-background-success);color:var(--color-text-success)}
  .tag-shared{background:var(--color-background-warning);color:var(--color-text-warning)}
  .tag-free{background:var(--color-background-secondary);color:var(--color-text-secondary)}
  .bottom-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
  @media(max-width:560px){.bottom-row{grid-template-columns:1fr}}
  .git-cmd{font-family:var(--font-mono);font-size:11px;background:var(--color-background-secondary);padding:.5rem .75rem;border-radius:var(--border-radius-md);color:var(--color-text-secondary);margin-top:4px;line-height:1.7}
</style>
<div class="root">

<div class="top-bar">
  <h2>StackForge AI — Dev Command Center</h2>
  <div class="phase-tabs" id="phase-tabs">
    <button class="ptab active" onclick="showPhase('setup')">Setup</button>
    <button class="ptab" onclick="showPhase('w1')">Week 1</button>
    <button class="ptab" onclick="showPhase('w2')">Week 2</button>
    <button class="ptab" onclick="showPhase('w3')">Week 3</button>
    <button class="ptab" onclick="showPhase('w4')">Week 4</button>
    <button class="ptab" onclick="showPhase('stack')">Tech Stack</button>
  </div>
</div>

<div id="phase-setup">
  <div class="setup-row">
    <div class="setup-card"><div class="sc-num">6</div><div class="sc-label">Weeks total</div></div>
    <div class="setup-card"><div class="sc-num">2</div><div class="sc-label">Developers</div></div>
    <div class="setup-card"><div class="sc-num">$0</div><div class="sc-label">API cost (local model)</div></div>
    <div class="setup-card"><div class="sc-num">Day 14</div><div class="sc-label">Key milestone</div></div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Day 0 — Before you write any code</span></div>
    <div class="setup-step">
      <div class="step-num">1</div>
      <div class="step-info">
        <div class="st">Install Ollama + Qwen2.5-Coder <span class="tag tag-shared">Both devs</span></div>
        <div class="sd"><span class="git-cmd">curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5-coder:7b
ollama serve</span></div>
      </div>
    </div>
    <div class="setup-step">
      <div class="step-num">2</div>
      <div class="step-info">
        <div class="st">Creator: make GitHub repo <span class="tag tag-shared">Creator only</span></div>
        <div class="sd">New repo → "stackforge-ai" → Public → Add README. Settings → Branches → Protect main (require PR + 1 approval). Add collaborator via Settings → Collaborators.</div>
      </div>
    </div>
    <div class="setup-step">
      <div class="step-num">3</div>
      <div class="step-info">
        <div class="st">Both clone and set up monorepo structure <span class="tag tag-shared">Both devs</span></div>
        <div class="sd"><span class="git-cmd">git clone https://github.com/YOUR/stackforge-ai.git
mkdir -p apps/frontend apps/backend packages/shared</span></div>
      </div>
    </div>
    <div class="setup-step">
      <div class="step-num">4</div>
      <div class="step-info">
        <div class="st">Sign up for free services <span class="tag tag-shared">Both devs</span></div>
        <div class="sd">MongoDB Atlas (free 512MB) · Clerk.dev (free 10K MAU) · Upstash Redis (free 10K/day) · Cloudflare R2 (free 10GB) · Netlify (free tier) · Render.com (free 750hrs) · Vercel (free hobby) · Stripe (test mode)</div>
      </div>
    </div>
    <div class="setup-step">
      <div class="step-num">5</div>
      <div class="step-info">
        <div class="st">Create .env files — never commit these <span class="tag tag-shared">Both devs</span></div>
        <div class="sd">apps/backend/.env and apps/frontend/.env — add both to .gitignore before first push. Create .env.example with placeholder values for teammate.</div>
      </div>
    </div>
    <div class="setup-step">
      <div class="step-num">6</div>
      <div class="step-info">
        <div class="st">Daily Git ritual — paste this somewhere visible <span class="tag tag-shared">Both devs</span></div>
        <div class="sd"><span class="git-cmd">MORNING:  git checkout dev && git pull origin dev && git checkout -b feature/your-task
HOURLY:   git add . && git commit -m "feat: what you did"
END OF DAY: git push origin feature/your-task → open PR to dev on GitHub</span></div>
      </div>
    </div>
  </div>
</div>

<div id="phase-w1" style="display:none">
  <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:.75rem">Goal: Auth works end-to-end. User can sign in and see dashboard skeleton.</div>
  <div class="grid" id="w1-grid"></div>
</div>
<div id="phase-w2" style="display:none">
  <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:.75rem">Goal: User submits prompt → AI generates code → files appear in editor. This is your most critical milestone.</div>
  <div class="grid" id="w2-grid"></div>
</div>
<div id="phase-w3" style="display:none">
  <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:.75rem">Goal: Generated sites deploy live to Netlify. Users can edit files and download.</div>
  <div class="grid" id="w3-grid"></div>
</div>
<div id="phase-w4" style="display:none">
  <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:.75rem">Goal: Stripe payments work. Tier limits enforced. Free users hit limits and see upgrade flow.</div>
  <div class="grid" id="w4-grid"></div>
</div>

<div id="phase-stack" style="display:none">
  <div class="grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Frontend</span><span class="tag tag-fe">Person A</span></div>
      <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.8">
        <b>React + Vite</b> — fast SPA, no CRA<br>
        <b>Tailwind CSS + shadcn/ui</b> — production UI<br>
        <b>Zustand</b> — 4 stores: auth, project, generation, ui<br>
        <b>Monaco Editor</b> — VS Code in browser<br>
        <b>Clerk.dev</b> — auth UI components (free)<br>
        <b>React Router v6</b> — client routing<br>
        <b>Axios</b> — API client with interceptors<br>
        <b>Stripe.js</b> — checkout & portal<br>
        Deploy: <b>Vercel</b> (free hobby)
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Backend</span><span class="tag tag-be">Person B</span></div>
      <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.8">
        <b>Node.js + Express</b> — REST API server<br>
        <b>Clerk SDK</b> — JWT validation middleware<br>
        <b>BullMQ</b> — async job queue for generation<br>
        <b>Upstash Redis</b> — BullMQ broker (free 10K/day)<br>
        <b>MongoDB Atlas</b> — users, projects, subscriptions<br>
        <b>Mongoose</b> — ODM with schema validation<br>
        <b>Zod</b> — request body validation<br>
        <b>Winston</b> — structured JSON logging<br>
        Deploy: <b>Render.com</b> (free 750hrs/mo)
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">AI Engine</span><span class="tag tag-be">Person B builds</span></div>
      <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.8">
        <b>Qwen2.5-Coder 7B</b> — local, zero cost<br>
        <b>Ollama</b> — local model server<br>
        <b>4-phase pipeline:</b><br>
        → Phase 1: Prompt → site plan JSON<br>
        → Phase 2: Plan → full file tree<br>
        → Phase 3: Generate each file<br>
        → Phase 4: Validate + fix imports<br>
        <b>Groq API</b> — free cloud fallback<br>
        <b>WebSocket</b> — live generation progress
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Infrastructure</span><span class="tag tag-free">All free tier</span></div>
      <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.8">
        <b>Cloudflare R2</b> — file storage (10GB free)<br>
        <b>Netlify API</b> — deploy generated sites<br>
        <b>Stripe test mode</b> — subscriptions (free)<br>
        <b>cron-job.org</b> — ping Render every 14min<br>
        <b>UptimeRobot</b> — uptime monitoring (free)<br><br>
        <b>Rule:</b> Never store file content in MongoDB<br>Store paths in MongoDB, content in R2
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="card-header"><span class="card-title">Folder structure — one job per directory</span></div>
    <div style="font-size:11px;font-family:var(--font-mono);color:var(--color-text-secondary);line-height:1.9">
      stackforge-ai/<br>
      &nbsp;&nbsp;apps/frontend/src/<br>
      &nbsp;&nbsp;&nbsp;&nbsp;pages/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">Landing, Dashboard, Editor, Pricing, Settings</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;components/ &nbsp;<span style="color:var(--color-text-tertiary)">ChatUI, FileTree, Monaco, PreviewPane, SubscriptionGate</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;stores/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">authStore, projectStore, generationStore, uiStore</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;hooks/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">useWebSocket, useGeneration, useProject</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;lib/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">apiClient.js, constants.js</span><br>
      &nbsp;&nbsp;apps/backend/src/<br>
      &nbsp;&nbsp;&nbsp;&nbsp;routes/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">auth, projects, generate, subscriptions, webhooks</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;workers/ &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">aiWorker.js, deployWorker.js</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;services/ &nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">qwen.js, netlify.js, r2.js, stripe.js, websocket.js</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;models/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">User.js, Project.js, Subscription.js</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;middleware/ &nbsp;<span style="color:var(--color-text-tertiary)">requireAuth.js, requireTier.js, rateLimiter.js</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;validators/ &nbsp;<span style="color:var(--color-text-tertiary)">generateSchema.js (Zod schemas)</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;utils/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">promptBuilder.js, fileAssembler.js, codeValidator.js</span><br>
      &nbsp;&nbsp;packages/shared/ &nbsp;&nbsp;<span style="color:var(--color-text-tertiary)">types, TIER_LIMITS, error codes</span>
    </div>
  </div>
</div>

</div>
<script>
const weeks = {
  w1: {
    color: '#185FA5',
    days: [
      { day:'Day 1', fe:'Vite+React setup, Tailwind config, folder structure. Push: feature/frontend-setup', be:'Express setup, MongoDB Atlas connect, .env config. Push: feature/backend-setup', sync:false },
      { day:'Day 2', fe:'Install Clerk, wrap app in ClerkProvider, build Navbar with auth state', be:'Install Clerk SDK, build requireAuth middleware, test with curl', sync:false },
      { day:'Day 3', fe:'Build Login/Signup pages using Clerk components. Redirect to /dashboard after auth', be:'Build POST /api/auth/sync + GET /api/auth/me routes, User model', sync:false },
      { day:'Day 4', fe:'Build Dashboard layout: sidebar, header, empty project grid', be:'Build Project model, GET /api/projects + POST /api/projects routes', sync:false },
      { day:'Day 5', fe:'Connect Dashboard to backend: fetch real projects, show loading/empty states', be:'Test all routes, add Zod validation, add error handling middleware', sync:false },
      { day:'Day 6', fe:'Build Landing page: hero section, features, CTA buttons', be:'Install BullMQ + connect Upstash Redis, create bare job queue (no worker yet)', sync:false },
      { day:'Day 7', fe:'Review backend PRs. Test auth flow on merged dev branch.', be:'Review frontend PRs. Both merge to dev. Fix integration issues.', sync:true },
    ]
  },
  w2: {
    color: '#3B6D11',
    days: [
      { day:'Day 8', fe:'Build ChatPanel: message bubbles, prompt input, send button, message history', be:'Build qwen.js service: Ollama HTTP client, retry logic (max 3), 10min timeout', sync:false },
      { day:'Day 9', fe:'Wire ChatPanel to POST /api/generate. Show "job queued" confirmation state', be:'Build Phase 1 prompt (understand): prompt → structured site plan JSON', sync:false },
      { day:'Day 10', fe:'Build WebSocket hook: connect, subscribe to jobId, handle progress events', be:'Build WebSocket server: auth on connect, per-job channels, broadcast progress', sync:false },
      { day:'Day 11', fe:'Add progress indicator in Chat: phase names, progress bar, live log stream', be:'Build Phase 2 prompt (plan): site plan → full file tree with descriptions', sync:false },
      { day:'Day 12', fe:'Build Monaco Editor component with syntax highlighting, display generated code', be:'Build Phase 3 (generate files one by one) + project glossary injection', sync:false },
      { day:'Day 13', fe:'File tree sidebar: folders, file icons, click to open in Monaco', be:'Build codeValidator.js: parse imports, check broken syntax, fix obvious errors', sync:false },
      { day:'Day 14', fe:'MILESTONE: Full flow test — prompt → progress → files in editor', be:'MILESTONE: Same test. Both on a call. Document exactly what breaks.', sync:true },
    ]
  },
  w3: {
    color: '#854F0B',
    days: [
      { day:'Day 15', fe:'Build FileTree sidebar: collapsible folders, file icons, active file highlight', be:'Build r2.js service: uploadZip, downloadFile, deleteProject', sync:false },
      { day:'Day 16', fe:'Build PreviewPane: iframe with live Netlify URL, refresh, open-in-tab button', be:'Build deployWorker.js: zip assembly → R2 upload → Netlify API deploy', sync:false },
      { day:'Day 17', fe:'Deploy status UI: spinner → "deploying" → live URL appears', be:'Test full pipeline: generation → zip → R2 → Netlify → URL in MongoDB', sync:false },
      { day:'Day 18', fe:'"Iterate" chat UI: separate prompt mode, show what will change', be:'Build /api/generate/:id/iterate: pass existing code as context to Qwen', sync:false },
      { day:'Day 19', fe:'File editing in Monaco: save button, unsaved indicator (dot in tab)', be:'Build PUT /api/files: update file in R2, trigger Netlify redeploy', sync:false },
      { day:'Day 20', fe:'Download button: POST to /api/download, show loading, auto-download zip', be:'Build GET /api/download: fetch all project files from R2, zip, stream response', sync:false },
      { day:'Day 21', fe:'Test iterate feature. Polish editor UX. Fix preview iframe CSP issues.', be:'Verify deploy edge cases. Add retry logic to deploy worker (max 2 retries).', sync:true },
    ]
  },
  w4: {
    color: '#6D28D9',
    days: [
      { day:'Day 22', fe:'Build Pricing page: 3 tier cards, feature comparison, CTA buttons', be:'Set up Stripe test mode: create products + prices, install stripe-cli for webhooks', sync:false },
      { day:'Day 23', fe:'Checkout flow: click Upgrade → Stripe hosted checkout → redirect to /settings', be:'Build /api/subscriptions/checkout, webhook handler: update user.tier on payment', sync:false },
      { day:'Day 24', fe:'Build SubscriptionGate component: wraps Pro features, shows upgrade modal', be:'Build requireTier middleware, add to all protected routes, test limit enforcement', sync:false },
      { day:'Day 25', fe:'UsageMeter in dashboard: X/3 generations used, progress bar, resets on 1st', be:'Build /api/subscriptions/portal for Stripe customer portal (cancel/upgrade)', sync:false },
      { day:'Day 26', fe:'Settings page: profile, subscription status, cancel button, billing link', be:'Monthly usage reset cron job with node-cron. Test reset logic manually.', sync:false },
      { day:'Day 27', fe:'Test all tier limits in UI. Fix broken upgrade prompts. Verify gate components.', be:'Load test: 5 simultaneous generation jobs. Verify no crashes. Check Redis usage.', sync:false },
      { day:'Day 28', fe:'Full user journey: signup → free → 3 sites → hit limit → upgrade → generate more', be:'Verify DB state is correct at each step. Fix any data inconsistencies.', sync:true },
    ]
  }
};

function renderWeek(key) {
  const week = weeks[key];
  const grid = document.getElementById(key+'-grid');
  if (!grid || grid.children.length > 0) return;
  week.days.forEach(d => {
    const card = document.createElement('div');
    card.className = 'card' + (d.sync ? ' sync-card' : '');
    const tagStyle = d.sync ? 'background:var(--color-background-warning);color:var(--color-text-warning)' : `background:${week.color}22;color:${week.color}`;
    card.innerHTML = `
      <div class="card-header">
        <span class="day-badge" style="${tagStyle}">${d.day}</span>
        <span class="card-title">${d.sync ? '🔄 Sync day' : ''}</span>
      </div>
      <div class="person-row">
        <div class="person-label"><span class="dot" style="background:#185FA5"></span> Person A — Frontend</div>
        <div class="task-text">${d.fe}</div>
      </div>
      <div class="person-row" style="margin-top:8px">
        <div class="person-label"><span class="dot" style="background:#3B6D11"></span> Person B — Backend</div>
        <div class="task-text">${d.be}</div>
      </div>`;
    grid.appendChild(card);
  });
}

function showPhase(key) {
  document.querySelectorAll('[id^="phase-"]').forEach(el => el.style.display='none');
  document.getElementById('phase-'+key).style.display='block';
  document.querySelectorAll('.ptab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  if (weeks[key]) renderWeek(key);
}
</script>
