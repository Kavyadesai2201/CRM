# TechCRM — Complete Project Summary
> Generated from full codebase read. Every detail is sourced from actual code — no assumptions.

---

## 1. PROJECT OVERVIEW

### What It Is
TechCRM is a full-stack Customer Relationship Management (CRM) web application designed for sales teams that acquire leads primarily through social messaging channels — WhatsApp and Instagram. It captures every inbound message as a tracked lead automatically, provides a real-time pipeline to manage those leads through a deal cycle, and uses AI to help agents respond faster.

### Problem It Solves
Small and medium-sized businesses that use WhatsApp and Instagram for sales lose leads constantly — a DM gets overlooked in a personal WhatsApp, a conversation happens and is never followed up, no one tracks whether a deal was won or lost. TechCRM converts those conversations into structured CRM records with zero manual entry.

### Target User
Sales teams and solo agents at small businesses who sell via WhatsApp (phone number–based) and Instagram DMs, and who need visibility into their pipeline without a heavy enterprise CRM setup.

### What Makes It Different
- Webhooks from WhatsApp Cloud API and Instagram Graph API automatically create lead records when someone messages for the first time — no form fill, no import
- The entire UI updates in real time when messages arrive (SSE, not polling)
- AI (Gemini 2.0 Flash) can summarize a lead's entire conversation history or draft a channel-appropriate reply in one click

### Core Value Proposition
A sales agent can open the Inbox, see every WhatsApp and Instagram conversation sorted by last activity, click any lead, read a 2-line AI summary of the relationship, and send a reply — all without leaving the browser. New leads from WhatsApp appear on the Dashboard within one second of the message being sent.

---

## 2. TECH STACK

### Frontend
| Technology | Version | Role |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.2.10 | Build tool and dev server (port 5173) |
| @vitejs/plugin-react | 4.3.0 | Vite–React integration |
| React Router DOM | 6.22.3 | Client-side routing |
| @tanstack/react-query | 5.28.0 | Server state management and caching |
| @tanstack/react-query-devtools | 5.28.0 | Dev-only cache inspector |
| Axios | 1.6.8 | HTTP client |
| Zustand | 4.5.2 | Auth state (global client state) |
| Recharts | 2.12.3 | AreaChart (revenue), PieChart (lead sources) |
| @dnd-kit/core | 6.3.1 | Drag-and-drop Kanban on Pipeline page |
| Tailwind CSS | 3.4.3 | Utility-first styling |
| Inter | Google Fonts | Typography |

**Styling system:** Tailwind CSS v3 with a `@layer components` block in `client/src/index.css` defining reusable classes: `.glass` (frosted glass card), `.btn-primary` (brand-colored CTA), `.btn-ghost` (transparent bordered button), `.nav-item` + `.nav-item.active`, `.badge`, `.badge-blue/green/yellow/red/purple`, `.stat-card`, `.custom-scrollbar`, `.gradient-text`, `.dot-grid`, and keyframe animations (`fade-up`, `float`, `hero-glow`, `orb-drift`, `spin-slow`, `spin-reverse`).

**Brand color:** `brand-500 = #4f6ef7` (indigo-blue), defined in `client/tailwind.config.js` as a custom color scale from `brand-50` to `brand-900`.

### Backend
| Technology | Version | Role |
|---|---|---|
| Node.js | (ESM modules via `"type": "module"`) | Runtime |
| Express | 4.19.2 | HTTP framework |
| jsonwebtoken | 9.0.2 | JWT signing and verification |
| bcryptjs | 2.4.3 | Password hashing (12 salt rounds) |
| morgan | 1.10.0 | HTTP request logging |
| helmet | 7.1.0 | Security response headers |
| cors | 2.8.5 | CORS configuration |
| uuid | 9.0.1 | UUID generation |
| axios | 1.18.0 | Outbound HTTP (Meta Graph API calls) |
| pg | 8.11.5 | PostgreSQL client (node-postgres) |
| dotenv | 16.4.5 | Environment variable loading |
| @google/generative-ai | 0.24.1 | Gemini AI SDK (actively used) |
| @anthropic-ai/sdk | 0.104.1 | Anthropic SDK (installed but not used in `aiService.js`) |
| nodemon | 3.1.0 | Dev hot reload |

### Database
- **Provider:** Supabase (managed PostgreSQL)
- **Connection:** `pg` Pool with `connectionString: process.env.DATABASE_URL`, `ssl: { rejectUnauthorized: false }` (Supabase requires SSL)
- **Pool config:** `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`
- **ORM:** None — raw parameterized SQL queries throughout
- **Migrations:** `server/db/migrate.js` — idempotent `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, wrapped in a single transaction with `ROLLBACK` on error
- **Note:** The `notifications` table is referenced in `notificationService.js` but was created directly in Supabase, not in `migrate.js`

### Authentication
- **Method:** JWT (JSON Web Tokens), HS256 algorithm
- **Library:** `jsonwebtoken` 9.0.2
- **Token payload:** `{ id: <uuid>, role: <string> }`
- **Expiry:** 7 days (`process.env.JWT_EXPIRES_IN` or `"7d"` default)
- **Storage:** `localStorage` keys `crm_token` and `crm_user`
- **Delivery:** `Authorization: Bearer <token>` header on all API requests (injected by Axios interceptor in `api.js`)
- **Password hashing:** `bcrypt.hash(password, 12)` on register, `bcrypt.compare` on login

### Real-Time
- **Protocol:** Server-Sent Events (SSE) — not WebSockets
- **Endpoint:** `GET /api/stream?token=<jwt>`
- **Server mechanism:** Node.js `EventEmitter` singleton (`server/events.js`) — all server code that needs to push events calls `bus.emit('event', payload)`, and the SSE controller subscribes each connected client to the bus
- **Heartbeat:** `: ping\n\n` every 25 seconds to keep connections alive through proxies
- **Client:** Native browser `EventSource` API in `useEventStream` hook

### AI Integration
- **Provider:** Google Generative AI (Gemini)
- **Model:** `gemini-2.0-flash` (overrideable via `process.env.AI_MODEL`)
- **SDK:** `@google/generative-ai` 0.24.1
- **Modes:** `summary` and `suggest_reply`
- **Note on discrepancy:** The `@anthropic-ai/sdk` is listed as a dependency in `server/package.json` and the Landing page hero copy says "Claude AI reads your conversation history" — but `server/services/aiService.js` uses `@google/generative-ai` exclusively. The Anthropic SDK is installed but unused.

### External APIs
- **WhatsApp Business Cloud API** — `https://graph.facebook.com/v19.0` — used for both receiving inbound messages (webhook POST) and sending outbound messages (Axios POST from `/api/whatsapp/send`)
- **Instagram Graph API** — `https://graph.facebook.com/v19.0` — used for receiving DMs (webhook POST) and replying to comments (`/api/instagram/reply`)
- **ngrok** — local tunnel on port 4040 that exposes the Express server to the internet so Meta can POST webhooks during development

### Dev Tools
- **Vite dev proxy:** all `/api` requests proxied to `http://localhost:5000` (eliminates CORS in dev, configured in `client/vite.config.js`)
- **`@` alias:** `import X from "@/..."` maps to `client/src/` (configured via `vite.config.js` resolve alias)
- **concurrently:** root `package.json` runs `npm run dev` in both `client/` and `server/` simultaneously
- **Playwright:** end-to-end browser tests in a separate directory `C:\Users\KAVYA\Desktop\pw_test\`

### Deployment (Current State)
- Local development only: Express on port 5000, Vite dev server on port 5173
- ngrok tunnel for webhook testing: `ngrok http 5000`
- Supabase cloud PostgreSQL (always-on)
- **What production would require:** Replace Vite dev server with `vite build` + static hosting (Vercel/Netlify), deploy Express to a cloud server (Railway, Render, EC2), configure environment-specific CORS origin, set `WHATSAPP_APP_SECRET` to enable HMAC verification, add a process manager (PM2) or containerize with Docker, update Meta webhook URL from ngrok to production domain

---

## 3. SYSTEM ARCHITECTURE

### Repository Structure (Monorepo)
```
CRM/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/             # Route-level page components
│   │   │   ├── Landing.jsx    # Public marketing page
│   │   │   ├── Login.jsx      # Auth
│   │   │   ├── Register.jsx   # Auth
│   │   │   ├── Dashboard.jsx  # Live feed + stats + charts
│   │   │   ├── Inbox.jsx      # Two-column messaging UI
│   │   │   ├── Leads.jsx      # Paginated lead list + CRUD
│   │   │   ├── Pipeline.jsx   # Drag-and-drop Kanban
│   │   │   ├── Analytics.jsx  # Charts and conversion funnel
│   │   │   └── NotFound.jsx   # 404
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, Topbar, MainLayout, ProtectedRoute, NotificationPanel
│   │   │   ├── dashboard/     # StatsRow, PipelineMini, LiveFeed
│   │   │   ├── ui/            # RevenueChart, LeadSourceChart
│   │   │   ├── AddLeadModal.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── hooks/             # React Query hooks
│   │   │   ├── useDashboard.js, useLeads.js, useInbox.js
│   │   │   ├── useEventStream.js, useNotifications.js
│   │   ├── services/
│   │   │   └── api.js         # Axios instance + all API functions
│   │   ├── store/
│   │   │   └── authStore.js   # Zustand auth store
│   │   ├── App.jsx            # Router + ErrorBoundary
│   │   ├── main.jsx           # React root + QueryClientProvider
│   │   └── index.css          # Tailwind + @layer components
├── server/                    # Express backend
│   ├── controllers/           # Request handlers
│   ├── routes/                # Express routers (one per domain)
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── services/
│   │   ├── aiService.js       # Gemini AI integration
│   │   ├── leadService.js     # upsertLead (webhook entry point)
│   │   └── notificationService.js
│   ├── db/
│   │   ├── pool.js            # pg Pool singleton
│   │   ├── migrate.js         # Schema migrations
│   │   └── schema.sql         # Schema documentation (not executed directly)
│   ├── events.js              # EventEmitter singleton (SSE bus)
│   └── index.js               # Express app entry point
└── package.json               # Root workspace (concurrently)
```

### How Frontend and Backend Communicate
- In development: Vite dev server on `:5173` proxies all `/api/*` requests to Express on `:5000` — from the browser's perspective there is one origin, no CORS required
- All requests carry `Authorization: Bearer <token>` injected by the Axios request interceptor in `api.js`
- Axios response interceptor: on any `401` response, clears localStorage and redirects to `/login`
- The Axios instance uses `baseURL: "/api"` so every call like `http.get("/leads")` becomes `GET /api/leads`
- The SSE stream is a persistent `EventSource` connection opened by `useEventStream`, mounted once inside `MainLayout` so it covers all protected pages

### Webhook Flow End-to-End (WhatsApp Message → UI)

1. Person sends a WhatsApp message to the business test number
2. Meta Cloud API POSTs to `https://<ngrok-url>/api/webhooks/whatsapp`
3. `handleWhatsAppWebhook` in `webhookController.js` runs:
   a. Calls `verifyHmac(process.env.WHATSAPP_APP_SECRET, req.headers['x-hub-signature-256'], req.rawBody)`
   b. `req.rawBody` was captured by the `express.json` `verify` callback in `index.js`
   c. HMAC computed: `'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`
   d. Compared using `crypto.timingSafeEqual` (prevents timing side-channel attacks)
   e. **Immediately sends `res.sendStatus(200)`** — Meta requires acknowledgment before ~20s or it retries
4. Navigates JSON: `body.entry[].changes[].value.messages[]`
5. Skips non-text messages (`msg.type !== 'text'`)
6. Extracts: `phone = msg.from`, `messageText = msg.text.body`, `sentAt = new Date(Number(msg.timestamp) * 1000)`, `senderName` from `contacts[]`
7. Calls `upsertLead({ phone, name: senderName, lastMessage: messageText, source: 'whatsapp', sentAt })`
8. `upsertLead` in `leadService.js`:
   - `SELECT * FROM leads WHERE phone = $1 LIMIT 1`
   - If found: `UPDATE leads SET last_message=$1, last_activity_at=NOW(), phone=COALESCE($2, phone)... WHERE id=$4 RETURNING *`
   - If not found: `INSERT INTO leads (name, phone, ..., stage='new') VALUES (...) RETURNING *`
9. `INSERT INTO messages (lead_id, direction, channel, content, sent_at) VALUES (...) RETURNING *`
10. For new leads: sends auto-reply via Meta API, persists it as outbound message, calls `createNotification({ type: 'new_lead', ... })`
11. `bus.emit('event', { type: 'message', payload: { ...msgRow, lead_name, phone } })`
12. `streamController.sseStream` has `bus.on('event', send)` for every connected client
13. `send` writes `data: ${JSON.stringify(event)}\n\n` to the response stream
14. Browser's `EventSource.onmessage` fires in `useEventStream`
15. `qc.setQueryData(['messages', 'recent'], old => { messages: [msg, ...old.messages].slice(0, 50) })`
16. `qc.setQueryData(['messages', 'conversation', msg.lead_id], ...)` — updates open Inbox conversation
17. `qc.invalidateQueries({ queryKey: ['inbox-leads'] })` — refreshes Inbox lead list preview
18. React re-renders: LiveFeed shows new message, Inbox conversation shows new bubble, notification bell increments

### SSE Real-Time Stream Architecture

```
[Webhook / Pipeline action / Note add]
        ↓
   bus.emit('event', payload)          // server/events.js EventEmitter
        ↓
   All registered listeners fire       // one per connected SSE client
        ↓
   res.write(`data: ${JSON.stringify(event)}\n\n`)
        ↓
   Browser EventSource.onmessage()     // useEventStream.js
        ↓
   React Query setQueryData / invalidateQueries
        ↓
   React re-render                     // zero polling, instant update
```

**Three event types:**
- `message` — inbound message arrived; updates live feed, open conversation, inbox lead list
- `stage` — lead moved to new stage; invalidates leads and pipeline caches
- `notification` — new notification created; prepends to notification cache, badge re-renders

### Authentication Flow

```
User submits email+password
    ↓ POST /api/auth/login
authController.login:
    SELECT * FROM users WHERE email=$1
    bcrypt.compare(password, password_hash)  // 12 salt rounds
    jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })
    ↓ { user, token }
useAuthStore.setAuth(user, token):
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
    Zustand store: { user, token }
    ↓
navigate('/dashboard')
    ↓
ProtectedRoute (reads Zustand): token exists → render children
    ↓
Every API call: Axios interceptor adds Authorization: Bearer <token>
    ↓
authenticate middleware: jwt.verify(token, JWT_SECRET) → req.user = { id, role }
    ↓
On 401: Axios interceptor clears localStorage → window.location.href = '/login'
```

---

## 4. FEATURES

### Implemented and Fully Tested

| Feature | Technical Implementation |
|---|---|
| **Landing page** | `Landing.jsx` — animated hero with `HeroMockup` component (mock dashboard stats), feature cards grid, CTA buttons, conditional "Go to Dashboard" if JWT exists |
| **User registration** | `POST /api/auth/register` — bcrypt hash (12 rounds), UUID PK, returns JWT; frontend validates email regex and password match before submit |
| **User login** | `POST /api/auth/login` — bcrypt.compare, JWT sign; Axios interceptor auto-logouts on 401 |
| **Persistent sessions** | JWT + user in `localStorage`; `useAuthStore` reads from localStorage on init; 7-day expiry |
| **Protected routing** | `ProtectedRoute` component renders `<Navigate to="/login" />` if Zustand store has no token |
| **Dashboard — stats row** | `StatsRow.jsx` + `useDashboardStats` — total leads, new today with real % trend vs yesterday (`calcTrend(today, yesterday)`), WhatsApp count, Instagram count |
| **Dashboard — live feed** | `LiveFeed.jsx` + `useRecentMessages` — cursor-based pagination, SSE updates, reply button opens compose box for WhatsApp reply |
| **Dashboard — pipeline mini** | `PipelineMini.jsx` — bar chart of all 7 stages from `analyticsApi.getDashboardStats()` |
| **Dashboard — revenue chart** | `RevenueChart.jsx` (self-fetching) — `useQuery(['revenue'])` calling `analyticsApi.getRevenueTimeline()`; Recharts `AreaChart` with gradient fill |
| **Dashboard — lead source chart** | `LeadSourceChart.jsx` (self-fetching) — `useQuery(['lead-sources'])`; Recharts `PieChart` with custom legend |
| **Leads list** | `Leads.jsx` + `useLeads` — paginated table, filter by stage/source, debounced search (name, email, phone), source badge icons |
| **Lead creation** | `AddLeadModal.jsx` — form with client-side validation, `POST /api/leads`, invalidates `['leads']` cache |
| **Lead edit/delete** | Inline edit via `PUT /api/leads/:id`, delete via `DELETE /api/leads/:id` |
| **AI — Summarize** | `POST /api/leads/:id/ai { mode: 'summary' }` — fetches last 30 messages, Gemini prompt, returns 2-3 lines |
| **AI — Suggest Reply** | Same endpoint, `mode: 'suggest_reply'` — channel-aware tone, populates Inbox reply textarea |
| **Pipeline Kanban** | `Pipeline.jsx` — 7-stage columns, `@dnd-kit/core` with `PointerSensor` (8px activation), optimistic stage move, rollback on error, `DragOverlay` floating clone |
| **Pipeline SSE sync** | Stage move emits `bus.emit('event', { type: 'stage' })` → `useEventStream` invalidates `['leads-all']` and `['pipeline-stages']` |
| **Analytics** | `Analytics.jsx` — revenue chart, source pie chart (both self-fetching, React Query cache deduplication), conversion funnel table with window function percentages |
| **Inbox — lead list** | `Inbox.jsx` `useLeadList` — ordered by `last_activity_at` (LATERAL JOIN), search, filter tabs (All / Unread / WhatsApp / Instagram), skeleton loader, unread dot indicator |
| **Inbox — conversation** | `ConversationView` — `useConversation(leadId)` with `staleTime: Infinity`, date separators, avatar grouping (consecutive same-direction messages share avatar), auto-scroll to bottom |
| **Inbox — send message** | `useSendMessage` — optimistic append (temp message with `id: temp-${Date.now()}`), rollback on error, invalidate on success to replace temp row |
| **Inbox — AI suggest reply** | `useLeadAI` mutation calling `leadsApi.ai(id, 'suggest_reply')`, populates textarea |
| **WhatsApp inbound** | `handleWhatsAppWebhook` — HMAC verify, upsertLead, auto-reply to new leads only |
| **WhatsApp outbound** | `POST /api/whatsapp/send` (JWT required) → Meta Graph API → persists outbound message |
| **Notifications bell** | `useNotifications` — `staleTime: Infinity`, SSE keeps fresh; unread count badge; `NotificationPanel` slide-in; `useMarkAllRead` optimistic update |
| **Notes** | `GET/POST /DELETE /api/notes/:leadId` — paginated, author attribution, role-based delete (admin or author) |
| **ErrorBoundary** | `ErrorBoundary` class component + `RouteErrorBoundary` functional wrapper; `key={pathname}` auto-resets on navigation; `import.meta.env.DEV`-gated error details |
| **Webhook verification** | GET `/api/webhooks/whatsapp|instagram` — echoes `hub.challenge` on token match |
| **HMAC verification** | `verifyHmac()` with `timingSafeEqual` — active on both WhatsApp and Instagram POST webhooks |

### Built but Partially Tested / Not Fully Verified

| Feature | Status |
|---|---|
| **Instagram DM webhooks** | Webhook handler code is complete in `webhookController.js`, webhook subscription was configured; but end-to-end testing with real Instagram DMs was not completed |
| **Instagram comment replies** | `POST /api/instagram/reply` exists in `instagramController.js`, legacy route preserved; not wired to Inbox UI |
| **Activity log** | `activities` table exists and is migrated; `notesController.js` fires `createNotification` on note add; but no code writes to `activities` table on stage changes — it exists as schema only |
| **Revenue analytics** | `getRevenueTimeline` groups by `updated_at AT TIME ZONE 'Asia/Kolkata'` — this ties revenue date to when the lead was last updated rather than when the deal was marked won, which may be off by days |

### Planned / Not Yet Built

- Email channel integration (send/receive via SMTP / SendGrid)
- Role-based access control enforcement in the UI (role field exists, only delete-note uses it for access control)
- Rate limiting on auth routes (no `express-rate-limit` installed)
- Lead assignment workflow (the `assigned_to` column exists, `updateLead` accepts it, but no UI for team assignment)
- Read receipts and message status (Meta sends delivery/read status webhooks, not currently processed)
- Multi-tenant / workspace isolation

---

## 5. API ENDPOINTS

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Create user — body: `{ name, email, password, role? }` → `{ user, token }` |
| `POST` | `/api/auth/login` | None | Login — body: `{ email, password }` → `{ user, token }` |
| `GET` | `/api/auth/me` | JWT | Current user — → `{ id, name, email, role, created_at }` |

### Leads
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leads` | JWT | All leads. Query params: `stage`, `source`, `search` (ILIKE name/email/phone), `page`, `limit`, `orderBy` (whitelisted: `last_activity_at`). LATERAL JOIN for last message. → `{ data: [...], page, limit }` |
| `GET` | `/api/leads/:id` | JWT | Single lead by UUID → lead row |
| `POST` | `/api/leads` | JWT | Create lead — body: `{ name*, phone*, email?, company?, stage?, source?, notes?, deal_value? }`. Validates email regex, deal_value ≥ 0. → lead row |
| `PUT` | `/api/leads/:id` | JWT | Update lead — body: any lead fields → updated lead row |
| `DELETE` | `/api/leads/:id` | JWT | Delete lead → 204 |
| `GET` | `/api/leads/:id/messages` | JWT | Message thread — params: `page`, `limit` (max 500). → `{ data: [...], pagination }` |
| `POST` | `/api/leads/:id/ai` | JWT | AI feature — body: `{ mode: 'summary' \| 'suggest_reply' }` → `{ result: '...' }` |

### Notes
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notes/:leadId` | JWT | All notes for lead — params: `page`, `limit` → `{ data: [...], pagination }` |
| `POST` | `/api/notes/:leadId` | JWT | Add note — body: `{ body }` (max 10,000 chars) → note row with `author_name` |
| `DELETE` | `/api/notes/:leadId/:noteId` | JWT | Delete note (admin or author only) → `{ message: 'Note deleted' }` |

### Messages
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/recent` | JWT | Recent messages across all leads — params: `limit` (max 100), `before` (ISO cursor). Joins `leads` for `lead_name`, `phone`, `instagram_id`. → `{ messages: [...], nextCursor }` |

### Pipeline
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/pipeline/stages` | JWT | Stage counts and deal totals — returns all 7 stages in order even if count is 0 → `[{ stage, count, total_value }]` |
| `GET` | `/api/pipeline/stats` | JWT | Aggregate: total leads, won revenue, pipeline value → `{ total_leads, revenue, pipeline_value }` |
| `PATCH` | `/api/pipeline/:leadId/stage` | JWT | Move lead — body: `{ stage }` (validated against `STAGES` array). Emits SSE `stage` event. Creates `stage_change` notification. → updated lead row |

### Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | JWT | Dashboard stats — `totalLeads`, `newToday`, `newYesterday`, `bySource`, `byStage`, `new_leads_30d`, `total_won`, `total_lost`, `total_revenue`, `pipeline_value`. Uses IST (`Asia/Kolkata`) timezone for today/yesterday calculation. |
| `GET` | `/api/analytics/leads-by-source` | JWT | `[{ source, count }]` |
| `GET` | `/api/analytics/conversion` | JWT | `[{ stage, count, percentage }]` — uses `SUM(COUNT(*)) OVER ()` window function for % |
| `GET` | `/api/analytics/revenue` | JWT | `[{ month, revenue }]` — monthly revenue for `closed_won` leads, grouped by `updated_at` |

### WhatsApp
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/whatsapp/send` | JWT | Send message — body: `{ to: '<phone>', message: '<text>' }`. Calls Meta Graph API, persists outbound message in DB. → `{ success: true, data: { messages: [{ id: '<wamid>' }] } }` |

### Instagram
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/instagram/reply` | JWT | Reply to comment (legacy) — body: `{ commentId, message, leadId? }`. Calls Graph API `/{commentId}/replies`. → Graph API response |

### Webhooks (No JWT — verified by Meta HMAC or token)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/webhooks/whatsapp` | None | Meta verify handshake — echoes `hub.challenge` if `hub.verify_token` matches env var |
| `POST` | `/api/webhooks/whatsapp` | HMAC | Inbound messages — HMAC-SHA256 verified, auto-creates/updates leads, emits SSE |
| `GET` | `/api/webhooks/instagram` | None | Meta verify handshake for Instagram |
| `POST` | `/api/webhooks/instagram` | HMAC | Inbound DMs — same upsert flow as WhatsApp |

### Stream & Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/stream` | JWT (query param `?token=`) | SSE stream — sets `Content-Type: text/event-stream`, heartbeats every 25s |
| `GET` | `/api/notifications` | JWT | Last 20 notifications DESC → array of `{ id, type, message, lead_id, read, created_at }` |
| `PATCH` | `/api/notifications/read` | JWT | Mark all notifications read → `{ ok: true }` |
| `GET` | `/api/health` | None | Service health → `{ status: 'ok', timestamp, service, version }` |

---

## 6. DATABASE SCHEMA

### `users`
Stores CRM team members and agents.

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(150)` | `UNIQUE NOT NULL` |
| `password_hash` | `TEXT` | `NOT NULL` — bcrypt output |
| `role` | `VARCHAR(30)` | `DEFAULT 'agent'` — currently used only for note deletion authorization |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Indexes:** `idx_users_email` (schema.sql), `idx_users_role` (schema.sql)
**Relationships:** Referenced by `leads.assigned_to`, `notes.author_id`, `activities.user_id`

---

### `leads`
Core CRM entity. One row per prospect or customer.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` |
| `name` | `VARCHAR(150)` | Auto-populated as `WA:<phone>` or `IG:<psid>` for webhook-created leads |
| `email` | `VARCHAR(150)` | Optional |
| `phone` | `VARCHAR(30)` | WhatsApp sender number (e.g. `919054099972`) |
| `instagram_id` | `VARCHAR(80)` | Instagram Page-Scoped ID (PSID) |
| `company` | `VARCHAR(150)` | Optional |
| `stage` | `VARCHAR(50)` | `DEFAULT 'new'` — one of: `new`, `contacted`, `qualified`, `proposal`, `negotiation`, `closed_won`, `closed_lost` |
| `source` | `VARCHAR(80)` | `whatsapp`, `instagram`, `web`, `email`, `manual` |
| `deal_value` | `NUMERIC(12,2)` | `DEFAULT 0` |
| `notes` | `TEXT` | Deprecated — use `notes` table instead |
| `last_message` | `TEXT` | Most recent inbound message text (denormalized for list views) |
| `last_activity_at` | `TIMESTAMPTZ` | Updated on every webhook message |
| `assigned_to` | `UUID` | FK → `users(id)` `ON DELETE SET NULL` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Unique indexes:** `idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL` — prevents duplicate leads from same WhatsApp number. `idx_leads_instagram_id ON leads(instagram_id) WHERE instagram_id IS NOT NULL`. Both are **partial** indexes so `NULL` values don't conflict.

**Regular indexes:** `idx_leads_stage`, `idx_leads_source`, `idx_leads_assigned_to`, `idx_leads_created_at DESC`, `idx_leads_last_activity_at DESC`

---

### `messages`
Full communication history across all channels.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `lead_id` | `UUID` | `NOT NULL` FK → `leads(id)` `ON DELETE CASCADE` |
| `direction` | `VARCHAR(20)` | `NOT NULL` — `inbound` or `outbound` |
| `channel` | `VARCHAR(20)` | `NOT NULL` — `whatsapp`, `instagram`, `email`, `sms` |
| `content` | `TEXT` | `NOT NULL` |
| `sent_at` | `TIMESTAMPTZ` | `NOT NULL` — from Meta webhook timestamp (converted from Unix epoch) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` — when row was inserted |

**Indexes:** `idx_messages_lead_id`, `idx_messages_sent_at DESC`, `idx_messages_channel`

**Why `sent_at` ≠ `created_at`:** `sent_at` is the actual message timestamp from the sender's device/Meta. `created_at` is when the webhook was processed and the row inserted. This matters because webhook delivery can be delayed.

---

### `notes`
Internal agent annotations on leads — not visible to the lead.

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK |
| `lead_id` | `UUID` | `NOT NULL` FK → `leads(id)` `ON DELETE CASCADE` |
| `author_id` | `UUID` | FK → `users(id)` `ON DELETE SET NULL` |
| `body` | `TEXT` | `NOT NULL`, max 10,000 chars (validated in controller) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Indexes:** `idx_notes_lead_id`, `idx_notes_author_id`, `idx_notes_created_at DESC`

**Access control:** Delete requires `req.user.role === 'admin' || req.user.id === note.author_id`

---

### `activities`
Audit trail for significant events on a lead.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `lead_id` | `UUID` | FK → `leads(id)` `ON DELETE CASCADE` |
| `user_id` | `UUID` | FK → `users(id)` `ON DELETE SET NULL` |
| `type` | `VARCHAR(50)` | e.g. `stage_change`, `note_added`, `assigned` |
| `note` | `TEXT` | Human-readable description |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Indexes:** `idx_activities_lead_id`, `idx_activities_user_id`, `idx_activities_created_at DESC`

**Current status:** Table exists and is migrated, but no controller currently writes to it (pipeline controller does not insert activity rows on stage changes). It's schema-ready but not populated.

---

### `notifications`
Real-time bell notifications for the team.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `type` | `TEXT` | `new_lead`, `stage_change`, `note_added` |
| `message` | `TEXT` | Human-readable notification text |
| `lead_id` | `UUID` | FK → `leads(id)` (optional context link) |
| `read` | `BOOLEAN` | `DEFAULT FALSE` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

**Note:** This table was created directly in Supabase and is not present in `migrate.js` or `schema.sql`. It is used by `notificationService.js` (`INSERT INTO notifications`) and `notificationsController.js` (`SELECT / UPDATE`).

---

### Entity Relationship Summary
```
users ──< leads (assigned_to)
leads ──< messages  (ON DELETE CASCADE)
leads ──< notes     (ON DELETE CASCADE)
leads ──< activities (ON DELETE CASCADE)
leads ──< notifications (lead_id, optional)
users ──< notes (author_id, ON DELETE SET NULL)
users ──< activities (user_id, ON DELETE SET NULL)
```

---

## 7. WHATSAPP INTEGRATION — DEEP DIVE

### Meta Business API Configuration
- WhatsApp Business Account created on Meta Business Manager
- A WhatsApp Business phone number registered (test number during development)
- App created in Meta Developer Console with WhatsApp product added
- Webhook URL configured: `https://<ngrok-url>/api/webhooks/whatsapp`
- Webhook fields subscribed: `messages`
- `WHATSAPP_VERIFY_TOKEN`: a custom string set in both Meta dashboard and `.env`
- `WHATSAPP_PHONE_NUMBER_ID`: the numeric ID of the WhatsApp Business phone number
- `WHATSAPP_ACCESS_TOKEN`: permanent System User token (not a page access token)
- `WHATSAPP_APP_SECRET`: the App Secret from Meta Developer Console (for HMAC)

### Webhook Verification Handshake (GET)
When you configure a webhook URL in Meta's developer dashboard, Meta immediately sends a GET request to verify that the URL is controlled by you:

```
GET /api/webhooks/whatsapp
  ?hub.mode=subscribe
  &hub.verify_token=<the token you set in Meta>
  &hub.challenge=<random string Meta will re-accept>
```

`verifyWhatsAppWebhook` in `webhookController.js`:
1. Checks `req.query['hub.mode'] === 'subscribe'`
2. Checks `req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN`
3. On match: `res.status(200).send(challenge)` — plain text, not JSON
4. On mismatch: `res.sendStatus(403)`

Meta accepts the webhook only when it receives its own challenge string echoed back.

### Inbound Message Processing (POST) — Step by Step
1. Meta POSTs to `/api/webhooks/whatsapp` with `Content-Type: application/json` and `X-Hub-Signature-256: sha256=<hmac>`
2. Express `json()` middleware stores raw buffer in `req.rawBody` via the `verify` callback in `index.js`
3. `handleWhatsAppWebhook` verifies HMAC: `crypto.createHmac('sha256', WHATSAPP_APP_SECRET).update(req.rawBody).digest('hex')`, prefixes `sha256=`, compares with `crypto.timingSafeEqual`
4. **`res.sendStatus(200)` is sent immediately after verification** — before any DB work. This is critical: Meta has a timeout, and if it doesn't get 200 within ~20 seconds it will retry the webhook (causing duplicate processing)
5. Iterates `body.entry[0].changes[0].value.messages[]`
6. Only processes `msg.type === 'text'` (images, audio, stickers, reactions are skipped with a log line)
7. Extracts sender phone: `msg.from` (e.g. `"919054099972"`)
8. Extracts message text: `msg.text.body`
9. Converts Unix timestamp: `new Date(Number(msg.timestamp) * 1000)`
10. Looks up sender name: `value.contacts.find(c => c.wa_id === phone)?.profile?.name`
11. Calls `upsertLead()` — see below
12. If `isNew === true`: sends the auto-reply message via Meta API, persists it as an outbound message row

### `upsertLead` Logic (leadService.js)
```
1. Acquire pg client from pool
2. IF phone: SELECT * FROM leads WHERE phone = $1 LIMIT 1
3. IF not found AND instagramId: SELECT * FROM leads WHERE instagram_id = $1 LIMIT 1
4. IF existing lead found:
   UPDATE leads SET last_message=$1, last_activity_at=NOW(),
                    phone=COALESCE($2, phone),
                    instagram_id=COALESCE($3, instagram_id),
                    updated_at=NOW()
   WHERE id=$4 RETURNING *
5. IF no existing lead:
   INSERT INTO leads (name, phone, instagram_id, last_message, last_activity_at, source, stage)
   VALUES ($1, $2, $3, $4, NOW(), $5, 'new')
   — name defaults to 'WA:<phone>' or 'IG:<instagramId>' if no name was provided
   RETURNING *
   → createNotification({ type: 'new_lead', ... })
6. INSERT INTO messages (lead_id, direction='inbound', channel=source, content, sent_at) RETURNING *
7. bus.emit('event', { type: 'message', payload: { ...msgRow, lead_name, phone, instagram_id } })
8. Release pg client
9. Return { lead, isNew }
```

### Outbound Message Flow
- Frontend: `whatsappApi.sendMessage({ to: '919054099972', message: 'Hello' })`
- `POST /api/whatsapp/send` (JWT required)
- `sendWhatsAppMessage` in `webhookController.js`:
  ```
  POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
  Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
  Body: {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '<phone>',
    type: 'text',
    text: { preview_url: false, body: '<message>' }
  }
  ```
- On success: `SELECT id FROM leads WHERE phone = $1` then `INSERT INTO messages (direction='outbound', channel='whatsapp', ...)`
- Returns: `{ success: true, data: { messages: [{ id: 'wamid.xxx' }] } }`

### Access Token: System User Token
A **permanent System User token** was used. Reasoning:
- Regular User access tokens expire after 60 days and require manual refresh
- Short-lived page access tokens expire after 24 hours (the "session window" issue encountered during development)
- System User tokens are created in Meta Business Manager under Business Settings → System Users
- They don't expire unless explicitly revoked
- They can be scoped to specific WhatsApp Business Accounts

### Test Number Limitations
- Meta's test WhatsApp number (provided free in developer mode) can only send/receive messages to numbers that are added to its "allow list" in the Meta Developer Console
- Maximum 5 recipient numbers can be added
- The business number cannot initiate conversations with arbitrary numbers (only replies within 24h session window for regular templates; free-form text only in reply to a user-initiated message)

### HMAC Signature Verification
- Meta signs every POST webhook payload with the App Secret using HMAC-SHA256
- Header: `X-Hub-Signature-256: sha256=<hex>`
- The `verifyHmac()` function in `webhookController.js`:
  - Uses `crypto.timingSafeEqual` — prevents timing attacks where an attacker could infer the correct signature by measuring response time
  - Requires equal-length buffers (checks `a.length !== b.length` first)
  - **When `WHATSAPP_APP_SECRET` is not configured:** logs a warning and returns `true` — this bypass is intentional for local development but **must never be deployed to production** without the secret set
- Current status: `req.rawBody` is correctly captured by `express.json`'s `verify` callback; HMAC is fully implemented and active

---

## 8. AI FEATURES — DEEP DIVE

### Provider and Model
- **SDK:** `@google/generative-ai` 0.24.1
- **Model:** `gemini-2.0-flash` (default, overrideable via `AI_MODEL` env var)
- **Why Gemini 2.0 Flash:** Fast inference, low latency per token, cost-effective for high-frequency CRM use where agents might click "Suggest Reply" dozens of times per day
- **Note on `@anthropic-ai/sdk`:** It is installed as a dependency (`^0.104.1`) in `server/package.json`, and the Landing page claims "Claude AI reads your conversation history" — but `server/services/aiService.js` imports exclusively from `@google/generative-ai`. The Anthropic SDK is not used in any controller or service. This is a documentation/marketing inconsistency.

### Controller Entry Point (`aiController.js`)
```
POST /api/leads/:id/ai
Body: { mode: 'summary' | 'suggest_reply' }

1. Validates mode against Set(['summary', 'suggest_reply'])
2. SELECT * FROM leads WHERE id = $1
3. SELECT direction, channel, content, sent_at
   FROM messages WHERE lead_id = $1
   ORDER BY sent_at DESC LIMIT 30
   → .rows.reverse() (chronological order)
4. generateAI({ mode, lead, messages })
5. Returns { result: '<text>' }
6. On error: 502 { error: 'AI service unavailable. Please try again.' }
```

### "Summarize" Feature
**Prompt constructed in `aiService.js`:**
```
You are a CRM assistant. Summarize this lead's conversation in 2-3 plain lines,
including their current stage ("<lead.stage>").

Conversation:
[inbound] Hi I'm interested in your product
[outbound] Thank you for contacting us! We'll get back to you shortly.
[inbound] Do you have enterprise pricing?
...
```
- Transcript format: `[direction] content` with newlines between messages
- Returns: 2-3 lines of plain text
- Used by: Leads page "Summarize" button (shows in modal or inline display)

### "Suggest Reply" Feature
**Prompt:**
```
You are a sales agent assistant. Based on this conversation, draft ONE outbound reply
message. Tone: short and casual, suitable for a WhatsApp message.
(OR: friendly and casual, suitable for an Instagram DM)
Only output the message text, nothing else.

Conversation:
[inbound] Hi...
[outbound] ...
```
- Tone is channel-aware: checks `lead.source === 'instagram'` vs everything else (WhatsApp default)
- Returns: raw message text with no preamble or JSON wrapping
- In `Inbox.jsx` `ReplyBox`: the `✦ Suggest reply` button calls `useLeadAI` mutation → on success, calls `setText(data.result ?? '')` and triggers `adjustHeight()` to resize the textarea
- User can edit the suggestion before hitting Send

### Future AI Features (Planned)
- **Lead scoring:** Analyze conversation sentiment and engagement to assign a numeric score
- **Follow-up scheduling:** Detect when leads mention specific dates and suggest calendar reminders
- **Auto-qualification:** Parse messages for BANT criteria (Budget, Authority, Need, Timeline) and auto-advance stage

---

## 9. REAL-TIME ARCHITECTURE

### How SSE Works in This Project

**Server side (`server/events.js` + `streamController.js`):**
```javascript
// events.js — singleton EventEmitter, imported by any server code that needs to push
const bus = new EventEmitter();
bus.setMaxListeners(0); // cap removed: one listener per SSE client

// streamController.js — one long-lived HTTP response per connected browser tab
export const sseStream = (req, res) => {
  jwt.verify(token, process.env.JWT_SECRET); // auth check
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // disable Nginx proxy buffer
  res.flushHeaders();
  res.write(': connected\n\n');

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  bus.on('event', send);                      // subscribe this client to bus

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    bus.off('event', send);                   // unsubscribe on disconnect
    clearInterval(heartbeat);
  });
};
```

**What emits to the bus:**
- `leadService.upsertLead()` → `bus.emit('event', { type: 'message', payload })`
- `pipelineController.moveLeadToStage()` → `bus.emit('event', { type: 'stage', payload })`
- `notificationService.createNotification()` → `bus.emit('event', { type: 'notification', payload })`

**Client side (`useEventStream.js`):**
```javascript
const url = `/api/stream?token=${encodeURIComponent(token)}`;
const es = new EventSource(url);

es.onmessage = (e) => {
  const event = JSON.parse(e.data);

  if (event.type === 'message') {
    // Update live feed (dashboard)
    qc.setQueryData(['messages', 'recent'], old => ({
      ...old,
      messages: [msg, ...old.messages].slice(0, 50)  // deduped, capped
    }));
    // Update open conversation in Inbox (if cached)
    qc.setQueryData(['messages', 'conversation', msg.lead_id], old => {
      if (!old) return old;  // not open — skip
      const arr = old.data ?? [];
      if (arr.some(m => m.id === msg.id)) return old;  // dedup
      return { ...old, data: [...arr, msg] };
    });
    qc.invalidateQueries({ queryKey: ['inbox-leads'] });
  } else if (event.type === 'stage') {
    qc.invalidateQueries({ queryKey: ['leads-all'] });
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
    qc.invalidateQueries({ queryKey: ['inbox-leads'] });
  } else if (event.type === 'notification') {
    qc.setQueryData(['notifications'], old =>
      [event.payload, ...(old ?? [])].filter(...dedup).slice(0, 20)
    );
  }
};
```

### Where `useEventStream` is Mounted
In `MainLayout.jsx` — rendered once when any protected page loads. Since it's outside the page components, the SSE connection persists across page navigations without reconnecting.

### Why SSE Over WebSockets
| Factor | SSE | WebSockets |
|---|---|---|
| Direction | Server → Client only | Bidirectional |
| Protocol | HTTP/1.1 (standard) | Custom upgrade required |
| Browser reconnect | Automatic (built-in) | Manual reconnection logic needed |
| Proxy/firewall | Works through most | Often blocked by older proxies |
| Implementation | 50 lines, no external library | Needs `ws` or `socket.io` library |
| Auth | Query param (trade-off) | Header or first-frame |

Since TechCRM only needs server → client push (clients don't send events via the stream — they use REST for mutations), SSE is the correct choice. Bidirectionality would add complexity with no benefit.

### Trade-off: JWT in URL
EventSource doesn't support custom headers. Passing `?token=<jwt>` means the token appears in server access logs and browser history. Mitigations in production:
- Use a short-lived stream token (separate from the API JWT) issued by a dedicated endpoint
- Use `httpOnly` cookie for auth (EventSource sends cookies automatically)

---

## 10. SECURITY

### JWT Authentication
- **Algorithm:** HS256 (HMAC-SHA256) via `jsonwebtoken`
- **Secret:** `process.env.JWT_SECRET` — must be a long, random string in production
- **Expiry:** `process.env.JWT_EXPIRES_IN` (default `"7d"`)
- **Payload:** `{ id: '<uuid>', role: '<string>' }` — minimal, no sensitive data
- **`authenticate` middleware** distinguishes two error cases:
  - `TokenExpiredError` → 401 `{ error: 'Token expired' }`
  - Other verify errors → 401 `{ error: 'Invalid token' }`
- **Axios response interceptor:** Any 401 → `localStorage.removeItem('crm_token')` → `window.location.href = '/login'`

### What Routes Are Protected
- `router.use(authenticate)` is applied at the router level for: `/api/leads`, `/api/notes`, `/api/messages`, `/api/pipeline`, `/api/analytics`, `/api/notifications`, and at the individual route for `/api/whatsapp/send`, `/api/instagram/reply`, `/api/stream`
- **Unprotected by design:** `/api/auth/*`, `/api/webhooks/*`, `/api/health`
- `/api/webhooks/*` is protected by Meta's own HMAC signature instead of JWT

### HMAC Webhook Verification
- Prevents spoofed POST requests to the webhook endpoint from injecting fake leads
- `crypto.timingSafeEqual` prevents timing oracle attacks
- `req.rawBody` captured by `express.json` verify callback before JSON parsing — critical because HMAC must be computed on the exact bytes Meta sent
- In production: `WHATSAPP_APP_SECRET` and `INSTAGRAM_APP_SECRET` MUST be set — current code bypasses with a warning if not set

### Password Security
- `bcrypt.hash(password, 12)` — 12 salt rounds, computationally expensive to brute-force
- `bcrypt.compare` for verification — constant-time comparison
- `password_hash` column never returned in API responses (destructured away in `login`)

### SQL Injection Prevention
- Every database query uses parameterized placeholders: `$1`, `$2`, etc.
- The only user-controlled string that could become part of SQL is `orderBy` — handled by whitelist map `LEAD_ORDER` in `leadsController.js`. If `orderBy` is not a key in the map, it falls back to `"l.created_at DESC"` — the raw value is never interpolated

### Security Headers
- `helmet()` middleware adds: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`, etc.

### Current Security Gaps (Honest Assessment)
1. **JWT in localStorage:** Vulnerable to XSS. If any script injection is possible, an attacker can read the token. Production fix: `httpOnly` cookie
2. **JWT in SSE URL:** `?token=<jwt>` appears in access logs. Production fix: short-lived stream token or cookie auth
3. **No rate limiting:** Login endpoint can be brute-forced. Production fix: `express-rate-limit` on `/api/auth/*`
4. **CORS locked to `localhost:5173`:** Will fail in production. Production fix: environment-variable CORS origin
5. **7-day JWT, no revocation:** If a token is stolen, it's valid for 7 days. Production fix: refresh token rotation with revocation list (Redis)
6. **`WHATSAPP_APP_SECRET` bypass:** Dev convenience, production risk

---

## 11. CHALLENGES AND HOW THEY WERE SOLVED

### Challenge 1: SQL Injection via `orderBy` Query Parameter
**Problem:** The Inbox lead list needs to support `orderBy=last_activity_at`. User-controlled strings in SQL ORDER BY clauses are a classic injection vector.

**Solution:** Whitelist map in `leadsController.js`:
```javascript
const LEAD_ORDER = {
  last_activity_at: "COALESCE(m.sent_at, l.created_at) DESC",
};
const orderClause = LEAD_ORDER[orderBy] ?? "l.created_at DESC";
```
Only keys in the map produce SQL; the raw user string is never interpolated.

### Challenge 2: N+1 Query for Last Message Per Lead
**Problem:** The lead list in Inbox needed to show the last message preview and direction for 50 leads. A naïve approach would run 50 additional queries (one per lead).

**Solution:** PostgreSQL `LATERAL JOIN`:
```sql
SELECT l.*,
       m.content   AS last_message,
       m.sent_at   AS last_message_at,
       m.direction AS last_message_direction
FROM leads l
LEFT JOIN LATERAL (
  SELECT content, sent_at, direction FROM messages
  WHERE lead_id = l.id
  ORDER BY sent_at DESC
  LIMIT 1
) m ON true
```
One query, efficient. The `LATERAL` allows the subquery to reference each `l.id` from the outer query.

### Challenge 3: Duplicate Leads from Webhook Retries
**Problem:** Meta retries webhook POSTs if it doesn't receive 200 within timeout, or on network errors. This could create duplicate lead rows for the same phone number.

**Solution:** Two layers:
1. Partial unique index: `CREATE UNIQUE INDEX idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL` — PostgreSQL enforces uniqueness at DB level, so a concurrent duplicate INSERT would throw an error
2. `upsertLead()` always does SELECT first, then UPDATE or INSERT — the SELECT-first pattern with the unique index ensures idempotency

Also: `res.sendStatus(200)` is called immediately after HMAC check, before any DB work — this minimizes retries.

### Challenge 4: React Query `setQueryData` and `select` Transforms
**Problem:** React Query v5 stores pre-transform data in the cache. If `useConversation` used a `select` transform, then `setQueryData` in `useSendMessage.onMutate` would operate on the wrong shape (post-transform), causing a mismatch.

**Solution:** `useConversation` was written without a `select` transform. Both `useSendMessage` (optimistic) and `useEventStream` (SSE update) operate on the same raw shape: `{ data: [...messages], pagination: {...} }`.

### Challenge 5: ErrorBoundary with Route-Level Reset Using Hooks in Class Components
**Problem:** React error boundaries require class components (`getDerivedStateFromError`). But resetting the boundary on navigation requires `useLocation()`, which can only be called in function components.

**Solution:** Two-layer pattern:
- `ErrorBoundary` is a class component with a `reset` method
- `RouteErrorBoundary` is a function component that calls `useLocation()` and renders `<ErrorBoundary key={pathname}>` — the `key` prop forces React to unmount and remount the class component on every route change, automatically resetting error state

### Challenge 6: Stage Key Mismatch Across Files
**Problem:** `pipelineController.js` and `Pipeline.jsx` used `"proposal"` as the stage key, but `PipelineMini.jsx` and the `analyticsController.js` ORDER BY used `"proposal_sent"`. This caused the Proposal stage to show zero leads in the Dashboard mini-pipeline and analytics.

**Solution:** Audited all references to the stage enum. Corrected to `"proposal"` in both `PipelineMini.jsx` and the `analyticsController.js` ORDER BY CASE expression.

### Challenge 7: Optimistic Drag-and-Drop with Rollback
**Problem:** Waiting for the server to respond before moving a Kanban card felt laggy. But if we move it immediately and the API fails, the UI would be in a wrong state.

**Solution:** Full optimistic mutation pattern in `Pipeline.jsx`:
1. `onMutate`: `cancelQueries` (freeze in-flight fetches), snapshot current data, apply optimistic update to cache
2. `onError`: restore snapshot (visual rollback), show error toast
3. `onSettled`: always `invalidateQueries` to sync with server truth

### Challenge 8: SSE Auth Without Custom Headers
**Problem:** The browser's `EventSource` API does not support custom request headers — you can't pass `Authorization: Bearer <token>`.

**Solution:** JWT via query param: `new EventSource('/api/stream?token=<jwt>')`. The `streamController.sseStream` extracts and verifies it before upgrading the connection.

**Trade-off acknowledged:** The JWT appears in server access logs. The mitigation for production would be either a short-lived stream-specific token or switching to cookie-based auth for the SSE endpoint.

### Challenge 9: Self-Fetching Chart Components for Cache Deduplication
**Problem:** Both Dashboard and Analytics pages needed the same Revenue and Lead Source data. If both pages fetched the data, you'd get duplicate network requests.

**Solution:** Moved `useQuery` inside `RevenueChart.jsx` and `LeadSourceChart.jsx` themselves. React Query deduplicates by `queryKey` — if `['revenue']` is already in cache and not stale, the second component to mount gets the cached data instantly with zero network requests.

### Challenge 10: WhatsApp Auto-Reply Spamming Existing Leads
**Problem:** The initial implementation sent an auto-reply ("Thank you for contacting us!") on every inbound message, which would spam leads who had already had prior conversations.

**Solution:** `upsertLead()` returns `{ lead, isNew }`. The auto-reply block in `handleWhatsAppWebhook` is gated on `if (isNew)` — it fires exactly once per new lead, on their first ever message.

---

## 12. WHAT I WOULD DO DIFFERENTLY / IMPROVEMENTS

### Architecture Improvements

**1. `httpOnly` Cookie for JWT (Critical)**
Storing JWT in localStorage is the industry's most common XSS vulnerability. Moving to `httpOnly` `SameSite=Strict` cookies with a CSRF token would eliminate token theft via script injection.

**2. Refresh Token Rotation**
A 7-day JWT with no revocation mechanism is a security risk if a token is compromised. Production pattern: issue a short-lived access token (15 min) + long-lived refresh token (30 days) stored in httpOnly cookie. On 401, silently refresh.

**3. Background Job Queue for Webhooks**
Currently, webhook payload processing (DB writes, auto-reply, SSE emit) happens inline in the request handler. If the DB is slow, the 200 is already sent, so Meta won't retry — but any error silently drops the message. Production fix: push the raw payload to a Redis-backed queue (Bull/BullMQ) and process it in a worker. Retries are then managed by the queue, not by hoping the DB is fast.

**4. Type Safety**
Raw SQL with `pg` is fine for a small project but becomes error-prone at scale (column name typos, type mismatches). Switching to Prisma or Kysely would add compile-time type safety on queries.

**5. Migrations as Proper Version-Controlled Files**
The `notifications` table was created directly in Supabase without a migration. Production codebases need a sequential migration system (Flyway, Liquibase, or Knex migrations) so the schema can be reproduced reliably in any environment.

### Feature Improvements

**6. `@anthropic-ai/sdk` vs `@google/generative-ai` Alignment**
The marketing copy on the Landing page says "Claude AI" but `aiService.js` uses Gemini. This is a factual inconsistency. Either update the copy or migrate to Claude. Given the project name and use case, Claude 3 Haiku would be a better fit for its speed and safety characteristics.

**7. CORS as Environment Variable**
`cors({ origin: 'http://localhost:5173' })` is hardcoded. This means the app cannot be deployed without modifying source code. Should use `process.env.CORS_ORIGIN`.

**8. Rate Limiting**
The login endpoint (`/api/auth/login`) has no rate limiting. An attacker can brute-force passwords at unlimited speed. `express-rate-limit` on auth routes would mitigate this.

**9. Activities Table Population**
The `activities` table exists in the schema and migrations but is never written to. Stage changes, note additions, and lead assignments should create activity rows — this would enable a per-lead audit trail and a team activity feed.

### Scalability Considerations

**Current architecture bottleneck:** The SSE bus is an in-process Node.js `EventEmitter`. This works perfectly with a single server process, but if the application were scaled horizontally to multiple instances, a message arriving at server instance A would not be pushed to SSE clients connected to instance B. Solution: replace `events.js` with Redis Pub/Sub (using `ioredis`). Each server instance subscribes to a Redis channel; all SSE clients across all instances receive all events.

**Supabase connection limits:** The `pg` pool is configured with `max: 10`. Supabase's free tier allows 60 simultaneous connections. At 6 instances × 10 connections = 60 — already at the limit. Use PgBouncer (Supabase's built-in pooler) for production connection management.

**Message volume:** The `messages` table will grow large over time. The `idx_messages_lead_id` and `idx_messages_sent_at DESC` indexes support the current query patterns. For very high volume, consider table partitioning by month.

---

## 13. INTERVIEW TALKING POINTS — 15 Technical Q&As

---

### Q1: Why did you choose Server-Sent Events instead of WebSockets for real-time updates?

**Answer:** TechCRM's real-time requirements are entirely server → client: a new WhatsApp message arrives at the server and needs to appear on every connected browser. Clients never need to send events to the server via the stream — they use regular REST endpoints for mutations like sending a message or moving a stage. SSE is HTTP/1.1 and doesn't require a protocol upgrade handshake. The browser's `EventSource` API handles reconnection automatically — if the connection drops, it reconnects after 1–3 seconds without any code on my end. With WebSockets I'd need the `ws` library and manual reconnection logic. The one trade-off is that SSE is unidirectional, but that's actually a feature here because it enforces a clean separation: REST for writes, SSE for notifications.

---

### Q2: How does the WhatsApp webhook work, and what happens if your server is slow?

**Answer:** When someone sends a WhatsApp message to the business number, Meta's Cloud API makes an HTTP POST to my registered webhook URL. My `handleWhatsAppWebhook` first verifies the HMAC-SHA256 signature using the App Secret and `crypto.timingSafeEqual`, then — critically — it calls `res.sendStatus(200)` immediately, before touching the database. This is important because Meta has a 20-second response timeout; if it doesn't get a 200, it retries the delivery. So I acknowledge first, then process asynchronously in a try-catch. The processing does: navigate the JSON structure to find text messages, call `upsertLead()` which does an SELECT-first upsert with a partial unique index on phone to prevent duplicates, insert the message row, emit the SSE event, and for new leads, fire the auto-reply.

---

### Q3: How do you prevent SQL injection in your queries?

**Answer:** I use `pg`'s parameterized queries throughout — every user value is passed as `$1`, `$2`, etc. and never interpolated into the SQL string. The one case that required special handling is the `orderBy` query parameter — ORDER BY clauses can't be parameterized because they're structural SQL, not data. A naïve implementation like `` `ORDER BY ${req.query.orderBy}` `` would be injectable. I solved it with a whitelist map: `const LEAD_ORDER = { last_activity_at: "COALESCE(m.sent_at, l.created_at) DESC" }`. Only keys in the map produce a valid clause; anything else falls back to the default. The user's raw string is never in the SQL.

---

### Q4: Walk me through how the optimistic update works in the Kanban drag-and-drop.

**Answer:** When a user drags a lead card from "New" to "Qualified", the card should move instantly without waiting for the server. I use React Query's `onMutate` callback in the `moveMutation`:

1. `cancelQueries({ queryKey: ['leads-all'] })` — stops any in-flight refetch from overwriting my optimistic write
2. Snapshot: `const snapshot = queryClient.getQueryData(['leads-all'])`
3. Optimistic update: `setQueryData(['leads-all'], old => ({ ...old, data: old.data.map(l => l.id === leadId ? {...l, stage} : l) }))`

The card moves immediately. If the API call fails:

4. `onError`: `setQueryData(['leads-all'], context.snapshot)` — restores the pre-drag state and shows an error toast

5. `onSettled`: always `invalidateQueries` to sync with server truth, regardless of success or error

The `PointerSensor` has an `activationConstraint: { distance: 8 }` so a click on a card doesn't accidentally start a drag — you have to move at least 8px.

---

### Q5: How does your authentication work end-to-end?

**Answer:** On login, the backend runs `bcrypt.compare(password, hash)` where the hash was stored with 12 salt rounds. On success, it signs a JWT with `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })` and returns it. The frontend stores the token in `localStorage` under `crm_token` and puts it in Zustand for the React tree. An Axios request interceptor injects `Authorization: Bearer <token>` on every API call. On the server, the `authenticate` middleware runs `jwt.verify(token, JWT_SECRET)` and attaches the decoded payload to `req.user`. If the token is expired, it returns `TokenExpiredError` which is a distinct 401 message so the frontend knows it's expiry vs invalid. An Axios response interceptor on 401 clears localStorage and redirects to `/login`.

The SSE endpoint is special — `EventSource` doesn't support custom headers, so the JWT goes as a query param `?token=<jwt>`. This is a known trade-off; in production I'd use a short-lived stream token issued by a separate endpoint, or switch to cookie auth.

---

### Q6: Explain the `upsertLead` function and why duplicates are prevented at two levels.

**Answer:** `upsertLead` is called every time a webhook message arrives. It needs to either find the existing lead for that phone number or create a new one — an upsert operation.

Level 1 — Application logic: It runs `SELECT * FROM leads WHERE phone = $1 LIMIT 1` first. If found, it UPDATE; if not found, it INSERT.

Level 2 — Database constraint: `CREATE UNIQUE INDEX idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL` — a partial unique index. "Partial" means it only constrains rows where phone is not null, so leads without a phone (Instagram leads) don't conflict. If two concurrent webhooks for the same phone arrive simultaneously and both SELECT at the same time (before either inserts), one will succeed on INSERT and the other will fail with a unique constraint violation. I catch that at the DB level.

The two levels are both necessary because the application-level check has a TOCTOU (time-of-check-time-of-use) race condition without the database constraint.

---

### Q7: How does the AI "Suggest Reply" feature work?

**Answer:** When the agent clicks "✦ Suggest reply" in the Inbox reply box, it fires a mutation using `useLeadAI` which calls `POST /api/leads/:id/ai` with `{ mode: 'suggest_reply' }`. The `aiController` fetches the last 30 messages for the lead in DESC order, then reverses them to get chronological order. It passes them to `generateAI()` in `aiService.js`. The prompt is channel-aware: if `lead.source === 'instagram'`, the tone instruction is "friendly and casual, suitable for an Instagram DM"; otherwise it's "short and casual, suitable for a WhatsApp message". The prompt tells the model to output only the message text, nothing else. Gemini 2.0 Flash returns the text, we trim it, return `{ result: '<text>' }`. The frontend populates the textarea with that result and calls `adjustHeight()` so the textarea resizes. The agent can edit it before hitting Send.

---

### Q8: Why is there a `LATERAL JOIN` in the leads query?

**Answer:** The Inbox lead list shows the last message preview and direction (to show the unread indicator) for each lead. The `messages` table is separate from `leads`. A naïve approach would load all leads first, then run one query per lead to get their last message — that's an N+1 problem that generates 50 queries for 50 leads. 

PostgreSQL's `LATERAL JOIN` solves this with one query. Unlike a regular join, a `LATERAL` subquery can reference columns from the outer query — in this case `l.id`. The subquery `SELECT content, sent_at, direction FROM messages WHERE lead_id = l.id ORDER BY sent_at DESC LIMIT 1` is executed once per outer row and returns the single most recent message. The outer query then sees those columns as if they were joined. One round-trip to the database returns all leads with their last message data.

---

### Q9: How does the React Query cache stay consistent with SSE real-time updates?

**Answer:** There are two strategies I use depending on the data:

For **live feed messages** (`['messages', 'recent']`): I use `setQueryData` to prepend the new message directly to the cache array. This avoids a network refetch — the data is already in the SSE payload. I deduplicate by `id` in case the SSE delivers a message that was already fetched by the initial query.

For **open Inbox conversations** (`['messages', 'conversation', lead_id]`): Same pattern — `setQueryData` appends to `old.data` array only if the conversation is already cached (meaning that lead is currently open). If it's not cached, `setQueryData` returns `old` unchanged — I don't want to fetch a conversation for a lead the user isn't looking at.

For **stage changes** (`['leads-all']`, `['pipeline-stages']`): I use `invalidateQueries` instead of `setQueryData` because the stage payload doesn't contain the full lead data needed to update the cache correctly. Invalidation triggers a background refetch which returns fresh data from the DB.

The key insight is: `setQueryData` is for when you have the new data in the SSE payload itself; `invalidateQueries` is for when you need to fetch fresh data after being notified that something changed.

---

### Q10: What does `staleTime: Infinity` mean on the conversation query, and why?

**Answer:** React Query considers data "stale" after `staleTime` milliseconds. Stale data triggers a background refetch when the component remounts, the window regains focus, or the network reconnects. With `staleTime: Infinity`, the data is considered fresh forever — it will never trigger an automatic background refetch.

I use this for `useConversation` because the SSE stream in `useEventStream` is the source of truth for new messages. When a new message arrives via SSE, `useEventStream` calls `setQueryData` to append it to the cache directly. There's no reason to also refetch from the server — that would be redundant and potentially slower than the SSE push. Infinity `staleTime` disables the polling and makes the SSE the sole update mechanism.

The only time the query goes to the network is on first mount (when the conversation is loaded for the first time) and on explicit `invalidateQueries` after a message is successfully sent (to replace the temp optimistic message with the real DB row).

---

### Q11: Walk me through what happens when a user sends a WhatsApp message from the Inbox.

**Answer:**
1. User types in the textarea, clicks "Send" (or Ctrl+Enter)
2. `useSendMessage` mutation fires: `mutationFn: ({ to, message }) => whatsappApi.sendMessage({ to, message })`
3. **`onMutate`** (optimistic): creates a `tempMsg` with `id: 'temp-${Date.now()}'`, direction `outbound`, content from the textarea. Calls `setQueryData(['messages', 'conversation', leadId], old => ({ ...old, data: [...old.data, tempMsg] }))` — the bubble appears instantly
4. Axios posts `{ to: lead.phone, message }` to `POST /api/whatsapp/send`
5. Backend calls Meta Graph API, gets back `wamid`
6. Backend does `SELECT id FROM leads WHERE phone = $1` then inserts outbound message row
7. Backend returns `{ success: true, data }` 
8. **`onSuccess`**: calls `invalidateQueries(['messages', 'conversation', leadId])` — this fetches real data from the DB, replacing the temp message with the real row (real UUID, real `sent_at`)
9. Also `invalidateQueries(['inbox-leads'])` — updates the lead list preview
10. If Meta API fails: **`onError`** restores `context.prev` — the temp message disappears and the toast shows the error

---

### Q12: How do you handle errors at the React level?

**Answer:** I built a two-level `ErrorBoundary` in `client/src/components/ErrorBoundary.jsx`:

**Outer level** (`<ErrorBoundary>` wrapping `<BrowserRouter>` in `App.jsx`): catches crashes in the Router itself, Login, or Landing — the nuclear option that prevents a completely blank screen.

**Route level** (`<RouteErrorBoundary>` wrapping each protected page): catches crashes in individual pages. I render a fallback UI with "Something went wrong", a "Refresh Page" button (`window.location.reload()`), and a "Try again" button that calls `this.reset()` to clear the error state. In dev mode only, I show the full error stack in a `<details>` block gated on `import.meta.env.DEV`.

The tricky part was reset behavior: if a user is on the Analytics page and it crashes, clicking back to Dashboard shouldn't still show the error UI. I solved this by wrapping each page in a `RouteErrorBoundary` functional component that uses `useLocation()` and renders `<ErrorBoundary key={pathname}>`. When the path changes, React sees a different `key` and unmounts/remounts the boundary, resetting the error state automatically.

---

### Q13: What was your approach to the Supabase database connection?

**Answer:** I use `pg` (node-postgres) directly — no ORM. The `Pool` in `server/db/pool.js` is configured with `connectionString: process.env.DATABASE_URL`, `ssl: { rejectUnauthorized: false }` (Supabase requires SSL for all connections and their certificate chain varies), `max: 10` connections, `idleTimeoutMillis: 30000`, and `connectionTimeoutMillis: 10000`.

The 10-second connection timeout is important because Supabase's connection pooler can be slow on cold start (free tier). Without the timeout, the app would hang indefinitely waiting for a connection.

Migrations are run via `server/db/migrate.js` which uses idempotent `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements inside a single transaction. If any step fails, the whole migration rolls back. The `schema.sql` is documentation — it's not executed directly, it's for reference.

One gap I'd fix: the `notifications` table was created directly in Supabase without going through `migrate.js`. This means if you run `npm run db:migrate` on a fresh database, the notifications endpoints would fail. Proper migration discipline requires every schema change to go through a version-controlled migration file.

---

### Q14: How does the permanent WhatsApp System User token work, and why is it better than a regular access token?

**Answer:** When I first set up the WhatsApp integration, I was using a User access token from the Meta developer portal. These tokens are short-lived — they expire after 24 hours by default. Every day I had to regenerate the token, update the `.env` file, and restart the server. This was impractical.

The solution is a **System User token** created in Meta Business Manager under Business Settings → System Users. A System User is a non-human actor that represents an application or integration. You create a System User, assign it admin permissions on the WhatsApp Business Account, and generate a token for it. This token does not expire — it's permanent until you explicitly revoke it.

The difference: User tokens are tied to a human Facebook account, which has its own 60-day long-lived token limit and a separate 24-hour short-lived limit. System User tokens are tied to a system identity in Meta's Business Manager and are permanent as long as the business account is active.

---

### Q15: What would you change to make this production-ready?

**Answer:** In priority order:

1. **JWT in httpOnly cookies** — move away from localStorage to prevent XSS token theft. Add a CSRF token for mutation protection.

2. **Webhook processing via queue** — instead of processing inline in the HTTP handler, push to Redis/Bull queue. This decouples webhook acknowledgment from processing, guarantees retries on DB failures, and prevents message loss if the server is restarting.

3. **Redis Pub/Sub for SSE** — replace the in-process `EventEmitter` bus with Redis Pub/Sub. With multiple server instances behind a load balancer, SSE events currently only reach clients connected to the same instance. Redis makes them broadcast across all instances.

4. **Rate limiting** — `express-rate-limit` on auth routes and potentially on the AI endpoint which calls a paid external API.

5. **Environment-based configuration** — CORS origin, log level, and any hardcoded development assumptions need to be env variables.

6. **Fill the `activities` table** — the table exists but nothing writes to it. This is low-effort, high-value for audit trails and compliance.

7. **Fix the AI provider alignment** — the Landing page says "Claude AI" but the code uses Gemini. Pick one and be consistent, and document why.

8. **Notifications table migration** — add it to `migrate.js` so the schema is fully reproducible from code.

---

*This document was generated by reading every file in the TechCRM codebase — all controllers, routes, services, hooks, components, and configuration files — and is accurate as of the project's current state.*
