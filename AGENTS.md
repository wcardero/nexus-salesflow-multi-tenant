<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Nexus SalesFlow — Repo Guide

Multi-tenant sales management system with 4-role hierarchy (Admin → Director → Manager → Gestor),
inventory control, debt tracking, and automated cash-closing. React+Vite frontend, Express+PostgreSQL backend.

## Quick Start

### Frontend (root, pnpm)
```bash
pnpm install
pnpm dev          # Vite on http://localhost:3000, proxies /api → localhost:3001
pnpm build        # Production build
pnpm test         # Vitest
```

### Backend (backend/, pnpm)
```bash
# Prerequisite: PostgreSQL running with nexusdb created
cd backend
cp .env.example .env   # Edit DATABASE_URL + JWT_SECRET
pnpm dev            # ts-node-dev on http://localhost:3001
```

The backend runs automatic SQL migrations from `backend/migrations/` on every startup.
Migrations are tracked in the `_Migrations` table and executed in alphabetical order.
New migration format: `XXX_desc.sql` (e.g. `005_add_feature.sql`), always use `IF NOT EXISTS`.

## Architecture Surprises (read this or you'll waste time)

- **Frontend files live at project root**, NOT in a `frontend/` subdirectory. The README tree is wrong on this point.
- **Single package manager**: pnpm for both frontend (root) and backend (`backend/`). The workspace is defined in `pnpm-workspace.yaml` and uses a single `pnpm-lock.yaml` at root.
- **Two dev servers** must run simultaneously (frontend on :3000, backend on :3001). The Vite dev server proxies `/api/*` to the backend.
- **`WARP.md` is stale** — it describes an in-memory mock database that was replaced by the real Express+PostgreSQL backend.
- **No backend test script** exists (`pnpm test` is not configured in backend/package.json despite test files being present).

## Key Conventions

### Environment
- All `.env` files are gitignored (including `.env.*`). Only `*.env.example` files are tracked.
- Root `.env`: `VITE_API_URL`, `VITE_PORT`, `VITE_APP_TITLE`
- Backend `.env`: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `FRONTEND_URL`

### Code Organization
- **Frontend (root)**: `views/` (per-role dashboards), `components/` (Layout, SellModal, etc.), `hooks/useApi.ts` (centralized fetch wrapper), `types.ts`, `utils.ts` (pricing calculations)
- **Backend (`backend/src/`)**: routes/controllers/validators/auth-middleware pattern. Central entrypoint in `index.ts` mounts all route modules under `/api`.

### Pricing Logic (in `utils.ts`)
```
saleUSD = costUSD × (1 + margin)
baseMN = saleUSD × exchangeRate
commission = baseMN × commissionRate
finalMN = baseMN + commission + transferSurcharge (if TRANSFER payment)
```
Exchange rates and margins are frozen per-sale at creation time.

### TypeScript
- Frontend: `"moduleResolution": "bundler"`, `@/*` alias maps to project root, `noEmit: true` (Vite handles transpilation)
- Backend: CommonJS, strict mode, excludes `*.test.ts` from compilation

### Styling
- Tailwind CSS 4 via PostCSS plugin (`@tailwindcss/postcss`)
- Dark mode via `ThemeContext.tsx` using Tailwind `class` strategy
- Font: Manrope (Google Fonts), Icons: Material Symbols Outlined
- CDN fallback loaded in `index.html` for Tailwind plugins (forms, container-queries)

### Database Migrations (`backend/migrations/`)
- Naming: `XXX_desc.sql` (3-digit sequence + snake_case description)
- Legacy migrations (no prefix) predate the convention and are already baked into `init-db.ts` / `db.sql`
- Always idempotent: use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Cannot be rolled back — create a new migration to undo

### Deployment
- GitHub Actions + Dokploy (no SSH needed). Push to `main` → Docker build → ghcr.io → webhook to Dokploy.
- Single secret in GitHub: `DOKPLOY_WEBHOOK_URL`. All env vars configured in Dokploy UI.
- Frontend build arg: `VITE_API_URL=/api` (served by nginx, proxied by Dokploy).
- Backend tests are excluded from the production Docker build via tsconfig excludes.

### Role Hierarchy (enforced in middleware)
```
Admin creates: Director, Manager
Director creates: Manager
Manager creates: Gestor
```

### Testing
- Frontend: Vitest with jsdom environment, `@testing-library/jest-dom` matchers
- Backend: Test files exist (`inventory.test.ts`, `sales.test.ts`, `sales.integration.test.ts`) but no runner script configured

## Files/Patterns to Not Trust Without Verification
- `WARP.md` — describes an architecture that no longer matches the codebase
- `README.md` architecture tree — shows `frontend/` directory that doesn't exist