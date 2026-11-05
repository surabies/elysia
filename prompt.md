# MASTER PROMPT — FULL-STACK NEXT.JS + ELYSIAJS + DRIZZLE + POSTGIS + BETTER AUTH + SHADCN/UI, DEPLOYED ON VERCEL

## 0. OPERATING PRINCIPLES (READ FIRST, APPLY ALWAYS)

1. **Correctness over speed.** Be careful, methodical, and verify every claim.
2. **Nothing may be silently dropped.** Every existing feature and every requirement in this prompt must be tracked, implemented, and verified (see Section 4 and Section 20).
3. **Never fabricate.** Do not claim something is implemented, tested, built, migrated, or deployed unless you actually ran it and saw the real output. Never invent APIs, config keys, flags, or package versions.
4. **Official documentation is the source of truth.** When this prompt, your memory, and the docs disagree, the current official docs win. Read the docs for the _installed_ version of every library before using it.
5. **Safety before action.** Before large changes, create a git checkpoint (commit or a dedicated branch). Never run destructive commands (`rm -rf` on project dirs, `git reset --hard`, `git clean -fd`, `DROP TABLE`, `drizzle-kit push --force`, data-loss migrations) without my explicit approval.
6. **Ask only when blocked.** If a safe technical default exists, use it and record it as a decision. If a decision cannot be made safely, ask ONE concise question.
7. **Never deploy to production, run migrations against a production database, or touch real credentials without my explicit approval.**

---

## 1. ROLE

Act as a Senior Full-Stack Engineer, Software Architect, Database/GIS Engineer, Security Engineer, and DevOps Engineer working directly inside my currently opened Visual Studio Code workspace.

You are an autonomous coding agent. You must actually:

- Inspect the workspace and understand the current architecture.
- Create and edit files.
- Install dependencies and run commands in the integrated terminal.
- Run type checks, lint, tests, and builds.
- Find and fix errors.
- Prepare the app for production deployment on Vercel.

Do not merely explain what I should do. Implement it.

---

## 2. TARGET STACK

| Layer                     | Technology                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework                 | Next.js (App Router) + React + TypeScript (strict)                                                                          |
| Runtime / package manager | Bun (keep the project's existing package manager if it already uses another one, unless there is a strong technical reason) |
| API layer                 | ElysiaJS, embedded in Next.js via a catch-all Route Handler                                                                 |
| UI                        | shadcn/ui (current "v4" generation, Tailwind CSS v4)                                                                        |
| ORM / migrations          | Drizzle ORM + drizzle-kit                                                                                                   |
| Database                  | PostgreSQL with the PostGIS extension                                                                                       |
| Authentication            | Better Auth (with the Drizzle adapter)                                                                                      |
| Hosting                   | Vercel (Vercel Functions)                                                                                                   |

### Version policy

- Do NOT assume version numbers. Check the latest stable versions and the installed versions, and use APIs that exist in those versions.
- Check the official docs for each library, in particular:
  - Next.js: https://nextjs.org/docs
  - ElysiaJS: https://elysiajs.com/ (Next.js integration, Vercel integration, Eden)
  - Drizzle: https://orm.drizzle.team/docs
  - Better Auth: https://www.better-auth.com/docs
  - shadcn/ui: https://ui.shadcn.com/docs
  - PostGIS: https://postgis.net/docs/
  - Vercel: https://vercel.com/docs
- Note any recent breaking changes in the installed Next.js major version (for example renamed or deprecated conventions such as middleware/proxy files, async request APIs, caching defaults). Follow the installed version's documentation, not older tutorials.
- Pin nothing blindly; keep dependencies on compatible stable versions and commit the lockfile.

---

## 3. ARCHITECTURE DECISION (RESOLVE THIS BEFORE WRITING CODE)

The original plan was a **standalone** Elysia backend on Vercel (entry `src/index.ts`, default-exported `app`, `bunVersion` in `vercel.json`). The project is now **full-stack with Next.js**, so that layout must be adapted. Do not apply both blindly.

**Default decision (use unless inspection shows a strong reason not to):**

- ONE Next.js application, ONE Vercel project.
- Elysia is mounted inside Next.js as a catch-all Route Handler, e.g. `app/api/[[...slugs]]/route.ts`, with `prefix: '/api'`, exporting the HTTP method handlers from `app.fetch` as documented in the Elysia Next.js integration page. Export the app _type_ for Eden.
- Better Auth is mounted in its OWN Next.js route handler (e.g. `app/api/auth/[...all]/route.ts`) using Better Auth's Next.js handler helper, so auth routes are served by the more specific route. Verify that routing precedence works and that no Elysia route shadows `/api/auth/*`.
- The frontend calls the API with Eden Treaty (end-to-end type safety) from Client and Server Components where appropriate.
- Do NOT call `app.listen()` anywhere in the deployed code path.
- Do NOT add a standalone `src/index.ts` Vercel entry or a Bun-only `vercel.json` entry for Elysia if Next.js is the framework Vercel detects. Add `bunVersion` to `vercel.json` ONLY if the current Vercel docs confirm Bun runtime support for Next.js and I want Bun in production; otherwise let Vercel use its default Node.js runtime for the deployed app and use Bun for local tooling. Verify against current Vercel docs and report which you chose and why.

Record this decision (and any deviation) in `docs/DECISIONS.md` with the reasoning.

If the workspace already contains a separate working Elysia backend that I clearly want to keep standalone, STOP and ask one question before restructuring.

---

## 4. PHASE 0 — FEATURE INVENTORY AND TRACEABILITY (MANDATORY, DO NOT SKIP)

Goal: guarantee that no feature is lost or forgotten.

1. Inspect the workspace (Phase 1) and write `docs/FEATURES.md` containing:
   - **A. Existing features**: every existing page, route, API endpoint, component, script, integration, env var, and database table that currently works. Include where it lives (file path).
   - **B. Required features**: every requirement from THIS prompt, one row each (Elysia setup, each endpoint, auth flows, PostGIS setup, each security requirement, tests, docs, Vercel config, etc.).
2. Give each row a stable ID (`EX-001`, `RQ-001`, ...), a status (`todo` / `in-progress` / `done` / `blocked`), the files that implement it, and the **evidence** of verification (test name, command output summary, or manual check).
3. Capture a **baseline** before changes: record whether the existing project installs, type-checks, lints, tests, and builds, and what the failures are (if any) so you can tell pre-existing problems from regressions.
4. Keep this file updated throughout. A row may be marked `done` only when its evidence column is filled in with real results.
5. If something cannot be implemented (technical limit, missing decision, missing credentials), mark it `blocked` with the reason. Never delete a row.

---

## 5. PHASE 1 — INSPECT THE EXISTING WORKSPACE

Before modifying anything, inspect:

1. `package.json`, lockfile (`bun.lock` / `bun.lockb` / others)
2. `tsconfig.json`, `next.config.*`, `vercel.json`, `.vercel/`
3. Existing source directories and routing (App Router vs Pages Router)
4. Existing API routes and server actions
5. Existing database configuration, ORM, migrations, SQL files
6. Existing auth implementation (if any)
7. Existing UI library, Tailwind setup, `components.json`
8. Environment files (`.env*`) — never print secret values; only note variable names
9. Existing scripts, CI config, linters, formatters, test setup
10. Git status and branch

Determine whether this is: a new project, an existing Elysia-only project, an existing Next.js project, or an existing full-stack app.

Rules:

- Do not delete existing application code.
- Do not overwrite configuration without reading it first.
- Preserve existing functionality; reuse existing dependencies; avoid duplicates.
- If the project already has a working architecture, adapt to it instead of rebuilding.
- If the project uses Pages Router, do not silently migrate it to App Router; decide, record it, and ask if the impact is large.

After inspection, write a short implementation plan and immediately proceed. Do not stop after the plan.

---

## 6. PHASE 2 — NEXT.JS + TYPESCRIPT + BUN BASELINE

- Ensure a working Next.js App Router project with TypeScript `strict: true` (plus sensible extras such as `noUncheckedIndexedAccess` if it does not cause unjustified churn).
- Configure path aliases consistently.
- Add scripts (adapt to the existing project, do not blindly overwrite): `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`, `db:studio`, `db:seed` (if seeding is needed), `auth:generate` (Better Auth schema generation, if used).
- Add `engines`/`packageManager` info only if appropriate.
- Add or keep ESLint (and Prettier/Biome if already used). Lint must pass.
- Make sure `next build` succeeds before moving on.

---

## 7. PHASE 3 — ELYSIA INSIDE NEXT.JS

Structure (adjust to the existing project):

```
app/
  api/
    [[...slugs]]/route.ts      # exports Elysia handlers (prefix /api)
    auth/[...all]/route.ts     # Better Auth handler
src/
  server/
    app.ts                     # builds and exports the Elysia app + type
    modules/
      health/
      echo/
      geo/                     # PostGIS example module
    plugins/
      cors.ts
      error-handler.ts
      auth.ts                  # session macro/derive
  db/
    index.ts                   # Drizzle client
    schema/
      auth.ts                  # Better Auth tables
      geo.ts                   # spatial tables
      index.ts
    migrations/
  lib/
    auth.ts                    # Better Auth server instance
    auth-client.ts             # Better Auth client
    api-client.ts              # Eden Treaty client
    env.ts                     # validated environment variables
tests/
docs/
```

Requirements:

- Modular design, separation of concerns, strong typing, no unnecessary abstraction.
- Use Elysia's built-in schema validation (`t` / TypeBox, or the validator the installed Elysia version recommends) for every request body, query, and params.
- Centralized error handling that returns consistent JSON and never leaks stack traces or internals in production.
- Avoid route collisions between Elysia and Next.js pages/route handlers.

---

## 8. PHASE 4 — UI: TAILWIND v4 + SHADCN/UI

- Follow the current shadcn/ui installation guide for Next.js (Tailwind v4, `components.json`, CSS variables, `cn` helper). Do not use outdated Tailwind v3 setup steps.
- Inspect any existing `components.json`/Tailwind config first and migrate carefully, preserving existing styles and components.
- Add only the components actually used.
- Build, at minimum, the UI needed to exercise every feature: sign-up, sign-in, sign-out, a protected page (e.g. dashboard), and a simple page demonstrating the API (echo and the geo example). Use accessible markup, loading/error states, and form validation (shared validation schemas where practical).
- Support dark/light theme only if the existing project already does or I ask for it.

---

## 9. PHASE 5 — DATABASE: POSTGRESQL + POSTGIS + DRIZZLE

### 9.1 Local development database

- Provide a `docker-compose.yml` using a PostGIS-enabled image (e.g. the official `postgis/postgis` image) for local development. Do not require me to hand-install PostGIS.
- Document the `DATABASE_URL` format in `.env.example` (placeholders only).

### 9.2 Drizzle setup

- Configure `drizzle.config.ts` (dialect `postgresql`, schema path, migrations output dir, credentials from env).
- PostGIS creates its own tables/views (e.g. `spatial_ref_sys`). Configure drizzle-kit so it does not try to manage them (check current docs for `extensionsFilters` / `tablesFilter`).
- Choose the Drizzle driver appropriate for serverless on Vercel and for the chosen database provider (check current Drizzle docs and provider docs). Explain the choice.

### 9.3 PostGIS

- The first migration (or a custom migration) must enable the extension: `CREATE EXTENSION IF NOT EXISTS postgis;` BEFORE any migration that uses geometry/geography columns. Verify the order actually works on a fresh database.
- Use Drizzle's geometry column support for spatial columns. Choose `geometry(Point, 4326)` or `geography` deliberately and document why. Use SRID 4326 for lon/lat data. Remember the PostGIS coordinate order is (longitude, latitude).
- Add a GiST spatial index on every geometry/geography column used for spatial queries.
- Implement an example spatial module (e.g. `places` table with name + location) with: create, list, get, delete, and a **nearby search** endpoint using `ST_DWithin` and ordering by distance (`ST_Distance`/KNN operator), using parameterized `sql` templates. Never concatenate user input into SQL.
- Validate coordinates (lon −180..180, lat −90..90) and radius limits at the API boundary.

### 9.4 Migrations workflow

- Use `drizzle-kit generate` + `drizzle-kit migrate` for versioned migrations. Do not use `push` against any non-local database.
- Review every generated migration SQL file by reading it before applying it.
- Run migrations against the LOCAL database to verify them. Do not run migrations against any remote/production database without my explicit approval.
- Document how production migrations should be run (e.g. as a separate controlled step/CI job, not implicitly at runtime).

### 9.5 Connection management (serverless)

- Reuse one client per runtime instance (module-level singleton), use a pooled/serverless-friendly connection string where the provider offers it, and keep functions stateless.
- Confirm the chosen hosted Postgres provider (e.g. via Vercel Marketplace or another provider) supports PostGIS before recommending it, and say so. If the provider is unknown, ask me ONE question at the end of Phase 1 or list it as a remaining task.

---

## 10. PHASE 6 — AUTHENTICATION: BETTER AUTH

- Follow the current Better Auth docs for the Next.js integration and the Drizzle adapter (with `provider: "pg"`).
- Create the server instance (`lib/auth.ts`) and client (`lib/auth-client.ts`).
- Generate the auth schema using the Better Auth CLI (or the documented method) into the Drizzle schema, then generate and review the migration. Do not hand-write auth tables from memory.
- Implement email + password at minimum (sign-up, sign-in, sign-out, session retrieval). Add other providers (social, magic link, 2FA, etc.) ONLY if I ask; list them under recommendations.
- Mount the auth handler in the Next.js route handler and make sure cookies work in Next.js (use the documented Next.js cookies plugin if applicable).
- Protect routes:
  - UI: redirect unauthenticated users from protected pages. Do not rely ONLY on a proxy/middleware check; also validate the session on the server in the page/layout/data access layer (follow current Next.js guidance).
  - API: provide an Elysia macro/derive/guard that resolves the Better Auth session and returns `401` when missing. Apply it to protected endpoints (e.g. creating/deleting places).
- Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (and public URL variables if required), `trustedOrigins`, and secure cookie behavior for production and Vercel preview deployments. Document how preview URLs are handled.
- Never log passwords, tokens, or session secrets.

---

## 11. PHASE 7 — API ENDPOINTS (ALL MUST EXIST)

All routes are under the Elysia `/api` prefix unless noted. Return consistent JSON.

**Core (from the original plan)**

- `GET /` — the Next.js home page must exist (UI). The plain JSON `{ "success": true, "message": "Elysia API is running" }` is exposed at `GET /api` root-level equivalent as defined below; do not create a conflict between the UI home page and an API route.
- `GET /api/health` — `{ "success": true, "status": "healthy" }`. (If an unprefixed `/health` is required for an external monitor, add it as a Next.js route handler or rewrite and document it.)
- `GET /api` — `{ "success": true, "name": "Elysia Backend API", "version": "1.0.0" }`
- `POST /api/echo` — body `{ "message": string }` (validated, non-empty, max length) → `{ "success": true, "data": { "message": "..." } }`; invalid body → `400`/`422` with a safe, consistent error shape.

**Auth (Better Auth, not Elysia)**

- `/api/auth/*` handled by Better Auth (sign-up, sign-in, sign-out, get-session, etc.).
- `GET /api/me` — returns the current user (protected, `401` if unauthenticated).

**Geo example (protected where it mutates data)**

- `POST /api/places` (protected) — create a place with name and lon/lat.
- `GET /api/places` — paginated list.
- `GET /api/places/:id`
- `DELETE /api/places/:id` (protected, owner only)
- `GET /api/places/nearby?lon=&lat=&radius=` — PostGIS proximity search.

Use correct HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500). Document every endpoint with request/response examples.

---

## 12. PHASE 8 — ERROR HANDLING AND SECURITY

1. Centralized error handler (validation, not found, unauthorized, forbidden, conflict, unknown). No stack traces or internals in production responses; log details server-side only.
2. Validate all input (body, query, params, headers where relevant).
3. CORS: because the UI and API share an origin, default to same-origin; if cross-origin access is needed, use an explicit allowlist from env. Do NOT enable wildcard CORS in production without explaining the implications to me.
4. Security headers (check what Next.js config / headers provide; add a sensible baseline such as CSP-compatible settings only if they do not break the app).
5. Environment variables: validate at startup with a schema (`lib/env.ts`); fail fast with a clear message; separate server-only and `NEXT_PUBLIC_` variables; never expose secrets to the client.
6. No hardcoded secrets. `.env.example` has placeholders only. `.env*` files with real values are in `.gitignore`. Never commit credentials.
7. SQL injection safety (parameterized queries only) and authorization checks on every mutation (ownership).
8. Basic rate limiting for auth and write endpoints, OR documented as a recommendation if it requires external infrastructure not yet needed (do not add Redis unless truly necessary).
9. Run a dependency audit and report findings.

---

## 13. PHASE 9 — TESTING AND QUALITY GATES

Use `bun test` (or the project's existing framework). Cover at minimum:

- `GET /api`, `GET /api/health`, `POST /api/echo` (valid and invalid bodies), status codes.
- Error handling: validation errors, not found, unauthorized, no stack trace leakage in production mode.
- Auth: sign-up, sign-in, session retrieval, sign-out, and `401` on protected endpoints.
- Places: create, list, get, delete (owner vs non-owner), and nearby search correctness (known coordinates and distances, including a boundary case).
- Database: migrations apply cleanly on a fresh PostGIS database; the PostGIS extension is present.
- Basic UI/component or e2e smoke test for sign-in and a protected route (Playwright if reasonable; otherwise document as a recommendation and mark it in FEATURES.md).

Required gates (all must pass, with real output observed):

1. `typecheck` (no new `any`, no `@ts-ignore` without justification, strict mode stays ON).
2. `lint`
3. `test`
4. `next build`
5. Local run (`next dev` / `vercel dev` where possible) and manual HTTP checks of every endpoint.

Fix failures at the root cause. Never disable strict mode, delete tests, or weaken assertions to make a gate pass.

---

## 14. PHASE 10 — VERCEL DEPLOYMENT READINESS

- Create or update `vercel.json` only if needed (keep it minimal; no unnecessary build commands or output directories). Validate it against the current schema.
- Check the installed Vercel CLI version and use currently supported commands.
- Verify: Next.js framework detection, route handlers build correctly, runtime choice (Node.js vs Bun) is deliberate and documented, function region is near the database region, and serverless limits (duration, memory, bundle size) are acceptable.
- Document all required environment variables for Preview and Production (names and purpose only): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, allowed origins, etc.
- Ensure the database migration step for deployment is defined and documented (and not run against production without approval).
- Commands:
  - Local: `vercel dev` or `next dev` (explain which to use when)
  - Preview: `vercel`
  - Production: `vercel --prod` — **do NOT run without my explicit approval**
- Do not assume I am authenticated or that the project is linked. If login/link is required, tell me exactly what to run.

---

## 15. PHASE 11 — SERVERLESS AND PERFORMANCE REVIEW

Review and report on:

- Cold starts and bundle size; avoid heavy imports in hot paths.
- Stateless design; no in-memory state relied upon across requests.
- DB connection reuse/pooling and connection limits.
- Long-running/background work (use the platform's supported mechanisms; do not assume a persistent server).
- WebSocket limitations on Vercel Functions (explain and recommend an alternative if realtime is needed).
- File storage limitations (no persistent local disk; recommend object storage if uploads are needed).
- Caching behavior of the installed Next.js version for API/data routes.
- Spatial query performance: confirm GiST indexes are used (`EXPLAIN` on the nearby query).

Do not add Redis, queues, or other infrastructure unless the project truly needs it; if you recommend it, explain why.

---

## 16. PHASE 12 — DOCUMENTATION

Create or update `README.md` and `docs/`:

1. Overview and feature list
2. Tech stack
3. Project structure
4. Installation
5. Local development (including Docker PostGIS, migrations, seeding)
6. Environment variables (table: name, required?, purpose, example placeholder)
7. API reference (all endpoints, auth requirements, examples)
8. Database and PostGIS notes (SRID, coordinate order, indexes, migration workflow)
9. Authentication notes
10. Testing
11. Vercel deployment (preview and production, migrations, env vars)
12. Troubleshooting (e.g. PostGIS extension missing, auth cookie/origin issues on preview URLs, DB connection exhaustion)
13. `docs/FEATURES.md` and `docs/DECISIONS.md`

Write so another developer can maintain the project without asking me.

---

## 17. CODING STANDARDS

- TypeScript strict; clear naming; focused functions; no duplicate code.
- No unused imports, dependencies, or dead code.
- Prefer `async/await`; handle errors explicitly.
- Follow the recommended patterns of Next.js, Elysia, Drizzle, Better Auth, and shadcn/ui.
- Do not hand-edit generated files (Drizzle migrations should only be changed through the documented workflow; shadcn components may be customized deliberately).
- If an API is uncertain, inspect the installed package types and official docs before using it.
- Keep commits small and logical if committing, with clear messages (commit only when appropriate; never push without my approval).

---

## 18. AUTONOMOUS EXECUTION RULES

Work phase by phase. For each phase:

1. Inspect the relevant files.
2. State briefly what you will change.
3. Make the changes directly.
4. Run the appropriate checks.
5. Fix errors.
6. Update `docs/FEATURES.md` with status and evidence.
7. Continue to the next phase.

Do not stop after producing snippets. Do not ask me to create files you can create. If a command fails, read the error, find the root cause, fix it, re-run, and report unresolved issues honestly.

Compatibility trap checklist (verify each, do not assume):

- Elysia version vs Next.js Route Handler signature and `app.fetch` exports
- Route precedence between `/api/auth/*` and the Elysia catch-all
- Better Auth schema vs Drizzle schema naming/casing consistency
- PostGIS extension enabled before geometry migrations
- drizzle-kit not trying to manage PostGIS system tables
- Env vars available in the right runtime (server vs client, preview vs production)
- Tailwind v4 / shadcn/ui setup consistent with the installed versions

---

## 19. SCOPE BOUNDARIES

- Do NOT add features I did not ask for (extra OAuth providers, payments, file uploads, realtime, admin panels, etc.). If you think one is valuable, list it under Recommendations.
- Do NOT remove or rewrite existing features unless required, and record any such change in `docs/DECISIONS.md`.

---

## 20. COMPLETION GATE — DEFINITION OF DONE

You may declare the task complete ONLY when ALL of the following are true:

1. Every row in `docs/FEATURES.md` (existing + required) is `done` with evidence, or `blocked` with a stated reason and what I must do.
2. No pre-existing feature has regressed compared to the baseline.
3. typecheck, lint, tests, and `next build` pass with real, observed output.
4. Migrations apply cleanly on a fresh local PostGIS database, and the spatial queries work.
5. Auth flows work end to end locally (sign-up, sign-in, protected route, protected API, sign-out).
6. No secrets are committed; `.env.example` is complete.
7. README and docs are complete and accurate.
8. No leftover `TODO`, stub, placeholder implementation, or commented-out dead code that hides unfinished work.

If anything fails these checks, keep working or report it explicitly. Do not present partial work as complete.

---

## 21. FINAL DELIVERABLE (REPORT)

A. **Implementation summary** — what was created/modified, and key architecture decisions (including the Elysia-in-Next.js choice and the runtime choice).
B. **Project structure** — final directory tree.
C. **Dependencies** — important packages and why they are used.
D. **API documentation** — all endpoints, methods, auth requirements, example responses.
E. **Commands** — exact commands to install, run local DB, migrate, start dev, test, typecheck, lint, build, deploy a preview, and (pending my approval) deploy to production.
F. **Verification results** — actual results of typecheck, lint, tests, build, local run, and migration checks.
G. **Feature traceability** — summary of `docs/FEATURES.md` (counts by status, any `blocked` items).
H. **Remaining manual tasks** — Vercel login/link, hosted PostGIS database setup, environment variables, production migration approval, production deploy approval.
I. **Recommendations** — next improvements (rate limiting at scale, observability, CI, e2e coverage, additional auth methods, backups, etc.).

---

## FINAL INSTRUCTION

Start with Phase 0 and Phase 1: inspect my current VS Code workspace and build the feature inventory and baseline. Then implement everything described above, phase by phase, directly in the workspace, with careful verification at each step.

Prioritize correctness, safety, completeness, maintainability, and production readiness. Do not just tell me how to build it. BUILD IT DIRECTLY IN MY WORKSPACE, and leave nothing out.
