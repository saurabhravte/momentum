<div align="center">

#  Momentum

### One calm home for all your work — email, calendar, Slack and GitHub, with an AI that does the busywork.

Momentum pulls Gmail, Google Calendar, Slack and GitHub into a single priority inbox,
tells you what actually needs you today, and lets you act in plain language —
*"reschedule my 3pm and tell Raj on Slack"* — with every action waiting for your approval.

[Live demo](#) · [Report a bug](https://github.com/saurabhravte/momentum/issues) · [Request a feature](https://github.com/saurabhravte/momentum/issues)

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=fff)
![Postgres](https://img.shields.io/badge/Postgres-pgvector-336791?logo=postgresql&logoColor=fff)
![Claude](https://img.shields.io/badge/AI-Claude-D97757)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## What it does

| | Feature | What it means for you |
|---|---|---|
| ☀️ | **Catch Me Up** | A plain-language digest of everything that happened while you were away. |
| 📥 | **Priority inbox** | Every message auto-sorted into Urgent · Needs reply · Waiting · FYI. |
| ⚡ | **⌘K command bar** | Type what you want in plain English; the agent proposes the steps, you approve. |
| 📅 | **Email → calendar** | Turn a thread into a meeting in one click. |
| 🔍 | **Instant search** | Sub-second semantic search across all your sources (pgvector). |
| ✅ | **Tasks board** | Drag-and-drop work surfaced from your inbox and chats. |
| 🎨 | **Built for everyone** | Colour tells you *which app* and *how urgent* — scannable without reading. |

> **Note on AI:** the AI features (classifier, drafting, agent) are wired for **demo purposes**.
> They run on Claude when an API key is present, and fall back to sample data so the
> experience always looks alive — see [Demo mode](#demo-mode).

---

## Tech stack

**Frontend** — Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Zustand · TanStack Query · Radix UI / shadcn · Framer Motion · Recharts · React Flow · dnd-kit

**Backend** — Node + Express 5 · Drizzle ORM · PostgreSQL 16 + **pgvector** · pg-boss (job queue) · Anthropic SDK + Claude Agent SDK · Corsair connectors (Gmail / Calendar / Slack / GitHub) · argon2 · helmet · zod

**Tooling** — pnpm workspaces (monorepo) · TypeScript · Vitest · Drizzle Kit · Docker Compose

---

## Project layout

```
momentum/
├── client/            Next.js app (the UI)
├── server/            Express API, AI agent, jobs, Corsair integrations
├── packages/
│   └── shared/        Types shared between client and server (@momentum/shared)
└── docker-compose.yml Local Postgres + pgvector
```

---

## Run it locally

### Prerequisites
- **Node 20+** and **pnpm 11+** (`corepack enable` will install pnpm for you)
- **Docker** (for the local Postgres + pgvector database)

### 1. Clone & install
```bash
git clone https://github.com/saurabhravte/momentum.git
cd momentum
corepack enable
pnpm install
```

### 2. Configure environment
```bash
cp .env.example server/.env
```
Open `server/.env` and fill in the required values. The two secrets can be generated with:
```bash
openssl rand -base64 32   # use once for CORSAIR_KEK, again for SESSION_SECRET
```
See the [Environment variables](#environment-variables) table for what each one does.

### 3. Start the database
```bash
docker compose up -d        # Postgres 16 + pgvector on :5432
```

### 4. Set up the schema
```bash
pnpm db:push                # create tables (Drizzle)
pnpm db:migrate:corsair     # set up Corsair's encrypted-credential storage
```

### 5. Run everything
```bash
pnpm dev                    # client on :3000, server on :4000 (parallel)
```
Open **http://localhost:3000**.

> The Next.js app proxies `/api/*` to the server, so you only ever visit the client URL.

---

## Deploy online for free

A free, production-ish setup uses three services that each have a real free tier:

| Layer | Service | Free tier (mid-2026) |
|---|---|---|
| **Database** | [Neon](https://neon.com) | 0.5 GB/project · 100 CU-hours/mo · pgvector · **no card, never expires** |
| **Backend API** | [Render](https://render.com) | 1 free web service · 750 hrs/mo · sleeps after 15 min idle |
| **Frontend** | [Vercel](https://vercel.com) | Hobby tier · free for personal / non-commercial use |

> ⚠️ **Don't** use Render's free Postgres — it's **deleted after 30 days**. Use Neon for the DB.

### Step 1 — Database on Neon
1. Create a project at [neon.com](https://neon.com) → copy the **pooled** connection string.
2. In the Neon SQL editor, enable the extension your search needs:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Keep this string — it's your `DATABASE_URL` (append `?sslmode=require` if not present).

> **pg-boss + Neon note:** pg-boss polls the database continuously, which prevents Neon's
> scale-to-zero from kicking in and slowly eats your 100 free CU-hours. For a demo it's fine;
> to stretch the free tier, raise pg-boss's poll interval, or only start the worker when needed.

### Step 2 — Backend on Render
1. **New → Web Service**, connect this repo. Set **Root Directory** to the repo root.
2. Apply this one-line fix first so the server binds to the port Render assigns
   (it currently reads only `API_PORT`):
   ```ts
   // server/src/common/config/env.ts
   API_PORT: z.coerce.number().default(Number(process.env.PORT) || 4000),
   ```
3. **Build command:**
   ```bash
   corepack enable && pnpm install --frozen-lockfile && pnpm --filter @momentum/server... build
   ```
   (the `...` also builds the shared package the server depends on)
4. **Start command:**
   ```bash
   pnpm --filter @momentum/server start
   ```
5. Add the environment variables from the table below. Then push the database schema once,
   from your machine, pointed at Neon:
   ```bash
   DATABASE_URL="<your-neon-url>" pnpm db:push && \
   DATABASE_URL="<your-neon-url>" pnpm db:migrate:corsair
   ```

### Step 3 — Frontend on Vercel
1. **Add New → Project**, import this repo. Set **Root Directory** to `client`.
   Vercel auto-detects Next.js and the pnpm workspace.
2. Add one env var: `NEXT_PUBLIC_API_URL` = your Render URL
   (e.g. `https://momentum-api.onrender.com`).
3. Deploy. Your app lives at `https://<your-app>.vercel.app`.

### Step 4 — Wire up Google OAuth (keeps auth first-party)
Because the Next.js app proxies `/api/*` to Render, point Google **at the Vercel domain** so
the whole flow stays first-party (this avoids cross-site cookie headaches):

In Google Cloud Console → Credentials → your OAuth client, add these **Authorized redirect URIs**:
```
https://<your-app>.vercel.app/api/auth/google/callback
https://<your-app>.vercel.app/api/connections/callback
```
Then set the matching backend env vars on Render:
```
WEB_ORIGIN=https://<your-app>.vercel.app
API_ORIGIN=https://<your-app>.vercel.app
GOOGLE_REDIRECT_URI=https://<your-app>.vercel.app/api/auth/google/callback
```

### Gotchas (read before your demo)
- **Cold start:** the Render free service sleeps after 15 min idle and takes ~1 min to wake.
  Open the app a minute before presenting to warm it up.
- **Cross-domain cookies:** routing OAuth through the Vercel domain (Step 4) keeps the session
  cookie first-party. If you ever hit the backend domain directly, the cookie must be
  `SameSite=None; Secure`.
- **Background jobs** only run while the web service is awake; queued work pauses during sleep.

---

## Demo mode

The AI is wired for demo use, so the app stays presentable without live API calls or real OAuth:

- Set `ANTHROPIC_API_KEY` to enable real classification, drafting and the agent.
- Without it, the app still boots and AI calls return a graceful sample response.
- The command bar ships with one-tap example prompts so a new user always has a successful
  first interaction.

---

## Environment variables

Set these on **Render** (the backend reads them). `NEXT_PUBLIC_API_URL` is set on **Vercel**.

| Variable | Required | What it's for |
|---|:---:|---|
| `NODE_ENV` | ✅ | `production` in deployment |
| `API_PORT` | ✅ | Port the API listens on (`PORT` on Render) |
| `WEB_ORIGIN` | ✅ | Frontend origin (your Vercel URL) |
| `API_ORIGIN` | ✅ | API origin used to build callback URLs |
| `DATABASE_URL` | ✅ | Neon Postgres connection string (`?sslmode=require`) |
| `CORSAIR_KEK` | ✅ | Key that encrypts stored OAuth tokens — `openssl rand -base64 32`. **Losing it = losing all stored credentials.** |
| `SESSION_SECRET` | ✅ | Signs the session cookie (min 32 chars) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth (login + Gmail + Calendar) |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth callback (your Vercel URL) |
| `ANTHROPIC_API_KEY` | ➖ | Enables AI features; app runs without it |
| `AI_CLASSIFIER_MODEL` / `AI_AGENT_MODEL` | ➖ | Model overrides (cheap for sorting, stronger for the agent) |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | ➖ | Optional Slack integration |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | ➖ | Optional GitHub integration |
| `NEXT_PUBLIC_API_URL` | ✅ | **(Vercel)** the Render API URL the client proxies to |

---

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Run client + server in parallel |
| `pnpm build` | Build every workspace |
| `pnpm db:push` | Push the Drizzle schema to the database |
| `pnpm db:migrate:corsair` | Set up Corsair credential storage |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm format` | Format with Prettier |

---

## Roadmap

- [ ] **Day One** — guided onboarding that lands non-developers on a plain-language Daily Briefing
- [ ] Source-identity colour system across the whole inbox (Gmail / Slack / GitHub / Calendar)
- [ ] Pre-meeting briefs and an end-of-day shutdown ritual
- [ ] Inbound Gmail push so the inbox updates in real time

---

## License

MIT — see [`LICENSE`](LICENSE).

<div align="center">
<sub>Built with ☕ by <a href="https://github.com/saurabhravte">@saurabhravte</a> · Momentum — one center for all your work.</sub>
</div>