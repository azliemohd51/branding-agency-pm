<!-- Version: 1.0 -->
# Studio — Branding Agency PM

A focused, dark-mode project-management workspace for branding agencies whose primary service is brand design. Built around the way brand work actually moves: a custom pipeline you define, briefs that travel with the client, deliverables that version themselves through review, and a personal task queue for every designer.

**v1.0** · Next.js 15 · SQLite · Tailwind

---

## Features

- **Customizable pipeline** — Admin defines stages (Discovery, Strategy, Design, Refinement, Delivery, Completed by default). Rename, recolor, reorder, mark stages as terminal. Projects flow through them.
- **Three roles** — `admin`, `designer`, `client`. Each sees only what's theirs.
- **Project detail with tabs** — Overview · Tasks · Deliverables · Feedback · Brief · Team. Pipeline bar across the top.
- **Tasks per designer** — Per-project kanban (Todo / In progress / Done) + personal `/tasks` queue across all assigned projects. Tasks can be:
  - `project` — linked to a specific project (default)
  - `social_media` — ongoing content, no project link
  - `adhoc` — internal/company requests, no project link
- **Deliverables with versions** — Logo, guidelines, business card, packaging, etc. Each posts revisions (URL + notes); status flows draft → in review → revision requested / approved.
- **Feedback threads** — Per project and per deliverable. Resolved/unresolved toggle.
- **Client portal** — Filtered `/portal` view for clients. They see only their projects, can leave feedback, can approve deliverables.
- **Team workload** — `/team` shows each designer's active project count, open tasks, next deadline.

---

## Run it

```bash
npm install
npx tsx src/lib/seed.ts   # seeds demo data
npm run dev                # http://localhost:3030
```

### Demo credentials

| Role     | Email                  | Password |
|----------|------------------------|----------|
| Admin    | admin@studio.com       | password |
| Designer | designer@studio.com    | password |
| Client   | client@acme.com        | password |

---

## Tech

- **Next.js 15** App Router, TypeScript, Server Actions for all mutations
- **SQLite** via `better-sqlite3` — file at `data/app.db`, WAL mode, foreign keys on
- **Tailwind CSS v3** with a custom Figma-inspired dark palette (`bg-0` → `bg-4`, `ink-0` → `ink-3`, accent purple `#7c5cff`)
- **Iron Session** cookie auth + bcryptjs password hashing
- **Lucide React** icons

### Data model

```
users · clients · pipeline_stages
projects · project_assignments
tasks (category: project | social_media | adhoc — nullable project_id)
deliverables · revisions · feedback
```

### Project layout

```
src/
├── app/
│   ├── login/                  # auth form + actions
│   ├── (app)/                  # authed routes (sidebar layout)
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── clients/
│   │   ├── team/
│   │   ├── portal/             # client-only
│   │   └── settings/pipeline/  # admin-only
│   └── layout.tsx
├── components/                 # PipelineBar, TaskCard, DeliverableCard, FeedbackThread, etc.
├── lib/
│   ├── db.ts                   # SQLite init + schema
│   ├── queries.ts              # centralized read helpers
│   ├── auth.ts                 # authenticate()
│   ├── session.ts              # iron-session
│   ├── seed.ts                 # demo data
│   ├── smoketest.ts            # automated route-coverage test
│   ├── types.ts
│   ├── format.ts
│   └── strings.ts
└── middleware.ts
```

---

## Versioning

- **v1.0** — Initial build. Pipeline customization, tasks (project/social/adhoc), deliverables + revisions, feedback, client portal, team workload, dark Figma-style UI.

Bump `+0.1` for any edit, `+1.0` for a major rebuild. Version shown in sidebar footer and at top of source files.

---

## Out of scope for v1.0 (future)

- File uploads (URLs only for now — paste Figma / Drive / Notion links)
- Email notifications
- Mood boards / inspiration gallery
- Invoicing & payment tracking
- Real-time updates (currently SSR with revalidate-on-action)
- Multi-tenant (one studio per instance for v1.0)
