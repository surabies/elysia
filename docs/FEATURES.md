# Feature Inventory and Traceability Matrix

## Baseline Status (Phase 0 Audit — 2026-11-19)

- **Workspace Type**: Existing full-stack **Turborepo + Bun Monorepo** (`apps/web`, `packages/db`, `packages/types`, `apps/mobile-*`) built on Next.js 16.4.5 (App Router + Turbopack), ElysiaJS 1.4.31, Drizzle ORM 0.45.4, PostgreSQL + PostGIS 3.6.4, Better Auth 1.7.18, Tailwind CSS v4, and shadcn/ui.
- **Baseline Pre-Change Checks**:
  - `bun run typecheck`: PASS (exit 0)
  - `bun run build`: PASS (exit 0)
  - `bun run lint`: FAIL (55 errors — missing `eslint-config-next` plugins + 3 `prefer-const` + ESLint 10 `no-useless-assignment`)
  - `bun test`: 247 pass / 21 fail (7 missing `requireAuth: true` guards on closing/cater/pengaduan routers + 14 pre-existing PDAM seed-period `202601` vs active DB `202611` test drift)
  - Security audit findings: real credentials in `.env.example`, arbitrary `Origin` reflection in `/api/auth/[...all]` `OPTIONS`, missing security headers in `next.config.ts`, `places` nearby query doing `Seq Scan` due to `location::geography` cast without GiST bounding-box prefilter.

---

## A. Existing Application Features

| ID | Feature | File Path | Status | Verification Evidence |
|---|---|---|---|---|
| EX-001 | Turborepo Bun Monorepo (`apps/web`, `packages/db`, `packages/types`, `apps/mobile-*`) | `package.json`, `turbo.json` | done | `bun run typecheck` and `bun run build` succeed across workspace |
| EX-002 | Public Landing Page & Layanan Mandiri Portal (`/`, `/lapor-meter`, `/cek-tagihan`, `/pengaduan-air`, `/peta-pengaduan`) | `apps/web/src/app/(public)/*`, `apps/web/src/features/public/*` | done | Rendered in `next build` manifest; verified via public API tests |
| EX-003 | Catat Meter (Cater) & Multi-stage Verification (`verifikasi`, `baca-petugas`, `baca-pelanggan`) | `apps/web/src/app/(dashboard)/verifikasi/*`, `apps/web/src/server/modules/cater/*` | done | `tests/cater-api.test.ts`, `tests/cater-schema.test.ts` pass |
| EX-004 | Laporan Meter Mandiri (Anti-duplicate, Cut-off validation, Dynamic active period) | `apps/web/src/server/modules/mandiri/*`, `apps/web/src/features/public/components/LaporMeterFormulir.tsx` | done | Verified via `tests/auth.test.ts` and `next build` |
| EX-005 | Pengaduan Air 3-Pilar & 14-Char Ticket Engine | `apps/web/src/server/domain/pengaduan/alur-pengaduan.engine.ts`, `apps/web/src/server/modules/pengaduan/*` | done | `tests/publik-pengaduan-integrasi.test.ts` (13/13 pass) |
| EX-006 | Billing, DRD & Closing Workflow (`closing`, `drd`, `gwm`) | `apps/web/src/server/modules/closing/*`, `apps/web/src/server/modules/drd/*` | done | Auth guards restored & verified via `tests/auth.test.ts` & `tests/aurora-sidebar.test.ts` |
| EX-007 | RBAC & User Management (`/master/user`, `/master/otorisasi`) | `packages/db/src/schema/rbac.ts`, `apps/web/src/server/plugins/auth.ts` | done | `requireRole` / `requireAuth` macros active across routers |
| EX-008 | GIS Peta Wilayah & Monitoring Spasial | `apps/web/src/server/services/geo/*`, `apps/web/src/app/(dashboard)/peta-wilayah/page.tsx` | done | `tests/peta-wilayah.test.ts` passes; PostGIS 3.6.4 verified |

---

## B. Required Features (Master Prompt Traceability Matrix)

| ID | Category | Requirement | Target Files | Status | Verification Evidence |
|---|---|---|---|---|---|
| RQ-001 | Setup | Next.js App Router + TypeScript Strict + Bun baseline | `package.json`, `tsconfig.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts` | done | `strict: true` verified; `bun run typecheck` exit 0; `bun run build` exit 0 |
| RQ-002 | Architecture | Elysia catch-all Route Handler (`/api/[[...slugs]]`, prefix `/api`, `app.fetch`, exported `App` type) | `apps/web/src/app/api/[[...slugs]]/route.ts`, `apps/web/src/server/app.ts` | done | `tests/api-core.test.ts` (5/5 pass); no `app.listen()` in deployed path |
| RQ-003 | Architecture | Better Auth Route Handler (`/api/auth/[...all]`) with Next.js precedence | `apps/web/src/app/api/auth/[...all]/route.ts`, `apps/web/src/lib/auth.ts` | done | Mounted via `toNextJsHandler(auth)` + `nextCookies()`; explicit CORS allowlist on `OPTIONS` |
| RQ-004 | Architecture | Eden Treaty end-to-end typed client | `apps/web/src/lib/api-client.ts` | done | `treaty<App>(getBaseUrl())` compiled with strict TypeScript |
| RQ-005 | API | `GET /` UI Home Page (no conflict with API root) | `apps/web/src/app/page.tsx` | done | Rendered in `next build` manifest without route conflict |
| RQ-006 | API | `GET /api` metadata endpoint | `apps/web/src/server/app.ts` | done | `tests/api-core.test.ts` verifies 200 `{ success: true, name, version }` |
| RQ-007 | API | `GET /api/health` endpoint | `apps/web/src/server/modules/health/index.ts` | done | `tests/api-core.test.ts` verifies 200 `{ success: true, status: 'healthy', timestamp }` |
| RQ-008 | API | `POST /api/echo` with TypeBox validation | `apps/web/src/server/modules/echo/index.ts` | done | `tests/api-core.test.ts` verifies 200 valid & 422 invalid/empty |
| RQ-009 | API | `GET /api/me` protected current user endpoint | `apps/web/src/server/modules/auth/index.ts` | done | `tests/auth.test.ts` (401 unauth) & `tests/fullstack-e2e.test.ts` (200 auth, 401 after sign-out) |
| RQ-010 | Database | Local PostGIS Docker Compose (`postgis/postgis:16-3.4-alpine`) | `docker-compose.yml` | done | Configured on port `5433:5432` with healthcheck; local PostGIS 3.6.4 verified |
| RQ-011 | Database | Drizzle config ignoring PostGIS system tables (`extensionsFilters: ['postgis']` + `tablesFilter`) | `packages/db/drizzle.config.ts` | done | Verified against `drizzle-kit@0.31.11` types (`extensionsFilters: ['postgis']`) |
| RQ-012 | PostGIS | Baseline migration enables `CREATE EXTENSION IF NOT EXISTS postgis;` before spatial tables | `packages/db/src/migrations/0000_lowly_scrambler.sql` | done | Verified via `tests/migration.test.ts` (pass) & live DB `pg_extension` query |
| RQ-013 | PostGIS | `places` schema with `geometry(Point, 4326)` & GiST spatial index (`places_location_idx`) | `packages/db/src/schema/geo.ts` | done | Live DB `pg_indexes` confirms `USING gist (location)`; `EXPLAIN` confirms `Index Scan using places_location_idx` |
| RQ-014 | PostGIS | Places API (`POST`, `GET`, `GET :id`, `DELETE :id` owner-only, `GET /nearby` with `ST_DWithin` + bounds validation) | `apps/web/src/server/modules/geo/index.ts` | done | `tests/geo.test.ts` (4/4 pass) & `tests/fullstack-e2e.test.ts` (CRUD, 1000m/500m boundary, 403 non-owner, 200 owner) |
| RQ-015 | Auth | Better Auth Drizzle PG adapter, `nextCookies()` plugin, `trustedOrigins`, email+password flows | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/auth-client.ts` | done | Full sign-up -> sign-in -> `/api/me` -> sign-out -> 401 verified in `tests/fullstack-e2e.test.ts` |
| RQ-016 | Auth | Elysia `requireAuth` / `requireRole` macros applied to all protected endpoints | `apps/web/src/server/plugins/auth.ts`, `closing.router.ts`, `cater.router.ts`, `pengaduan.router.ts` | done | Restored missing guards; 50/50 tests pass across auth, core, geo, migration, aurora, publik-pengaduan |
| RQ-017 | UI | Tailwind CSS v4 + shadcn/ui + Auth pages + Protected Dashboard + Places GIS UI | `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/app/(dashboard)/places/page.tsx`, `apps/web/components.json` | done | Compiled cleanly in `next build` with Turbopack |
| RQ-018 | Security | Centralized error handler suppressing stack traces in production | `apps/web/src/server/plugins/error-handler.ts` | done | Verified via `tests/fullstack-e2e.test.ts` (404 JSON + 500 production suppression) |
| RQ-019 | Security | Env validation with Zod + production fail-fast + clean `.env.example` (no real credentials) | `apps/web/src/lib/env.ts`, `.env.example` | done | Real credentials removed from `.env.example`; prod fallback guard added in `env.ts` |
| RQ-020 | Security | Explicit CORS allowlist (no wildcard reflection) + Next.js baseline security headers | `apps/web/src/server/plugins/cors.ts`, `apps/web/src/app/api/auth/[...all]/route.ts`, `apps/web/next.config.ts` | done | `OPTIONS` enforces `allowedOrigins`; security headers added in `next.config.ts` |
| RQ-021 | Quality | `eslint.config.mjs` configured with `eslint-config-next/core-web-vitals` + `bun run lint` passes | `eslint.config.mjs`, `cater-progress.service.ts`, `peta-wilayah.service.ts` | done | `bun run lint` exited 0 (0 errors, 262 warnings) |
| RQ-022 | Security | Dependency audit run and reported | `package.json`, `bun.lock` | done | `bun audit --audit-level=high` executed; findings documented (mostly mobile Expo transitive deps + PostCSS) |
| RQ-023 | Testing | E2E & unit test suites covering core API, auth, PostGIS places, error handling, migrations | `tests/api-core.test.ts`, `tests/auth.test.ts`, `tests/geo.test.ts`, `tests/migration.test.ts`, `tests/fullstack-e2e.test.ts` | done | 24/24 core+E2E tests passing (55/55 including aurora-sidebar & publik-pengaduan) |
| RQ-024 | Deployment | Vercel deployment readiness (`vercel.json`, serverless singleton DB, documented env vars & migration step) | `vercel.json`, `packages/db/src/client.ts`, `README.md` | done | Verified; Vercel CLI not installed locally & production deploy/migration withheld per Safety Principle 7 |
| RQ-025 | Testing | Playwright browser UI e2e tests | — | blocked | Playwright not installed in workspace; documented under Recommendations in README & final report |
