# Jira Analyst Control

A glassmorphic control panel for Jira Server/Data Center teams. React + TypeScript frontend with dnd-kit drag & drop Kanban and Recharts analytics, backed by a Node.js proxy that keeps credentials server-side. Designed for local-first usage on macOS.

## Monorepo layout
- `apps/web` – Vite + React UI with Kanban, analytics, settings.
- `apps/api` – Express proxy to Jira REST (Server/DC) with settings persistence.
- `packages/shared` – Shared TypeScript types, defaults, and helpers.

## Prerequisites
- Node.js 20+
- pnpm 8+

## Setup
```bash
pnpm install
```

### Environment
Create `.env.local` in `apps/api` (or project root) if you prefer env-based defaults:
```
PORT=4000
API_TOKEN=your-basic-or-pat-token
LOG_LEVEL=info
```

## Development
Run frontend + backend together:
```bash
pnpm dev
```
- API: http://localhost:4000
- Web: http://localhost:5173 (proxied to API under `/api`)

## Build & start
```bash
pnpm build
pnpm start
```
`pnpm start` runs the compiled API plus `vite preview` for the UI.

## Settings storage
Backend saves settings to `apps/api/data/settings.json`. Settings include Jira base URL, token, JQL/filter, workflow columns, custom field ids, dashboard URL, and color rules. Use the Settings page to export/import as JSON.

## Key endpoints
- `GET /api/health` – connectivity check (Jira /myself)
- `GET /api/settings` / `POST /api/settings`
- `POST /api/search` – JQL search with pagination
- `GET /api/issue/:key` – issue detail with changelog
- `POST /api/issue/:key/transition` – transitions by status name
- `GET|POST /api/issue/:key/comments` – comment feed and creation

## Frontend features
- Kanban columns mapped to Jira statuses with dnd-kit animations
- Color rules for due dates (overdue/today/soon/no-due/done) editable in UI
- Issue drawer-light cards with assignee, priority, due date, quick comment
- Analytics dashboard: cost by sprint, status distribution, assignee split
- Settings page for Jira connection, JQL/filter, custom fields, dashboard URL, export/import

## Example JQL
- `project = META AND type in (Task, Bug) ORDER BY updated DESC`
- `assignee = currentUser() AND statusCategory != Done`
- `project in (META, GP, MT) AND labels = analytics`
