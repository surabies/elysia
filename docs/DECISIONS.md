# Architecture Decisions

## ADR 001: Unified Next.js + ElysiaJS Full-Stack Monorepo Architecture on Vercel

- **Status**: Accepted
- **Context**: The project evolved from a standalone ElysiaJS concept into a full-stack **Turborepo + Bun Monorepo** (`apps/web`, `packages/db`, `packages/types`, `apps/mobile-*`) running Next.js App Router with shadcn/ui (Tailwind CSS v4), ElysiaJS, Drizzle ORM (PostgreSQL + PostGIS), and Better Auth.
- **Decision**:
  1. **Single Next.js Web App / Single Vercel Project (`apps/web`)**:
     - ElysiaJS is mounted inside Next.js as a catch-all Route Handler at `apps/web/src/app/api/[[...slugs]]/route.ts` with `prefix: '/api'`, exporting `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD` from `app.fetch`.
     - `apps/web/src/server/app.ts` exports `type App = typeof app` for end-to-end typed Eden Treaty calls (`apps/web/src/lib/api-client.ts`).
     - No `app.listen()` is called anywhere in the deployed code path.
  2. **Better Auth Route Precedence**:
     - Better Auth is mounted in its dedicated Next.js Route Handler at `apps/web/src/app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)`.
     - Next.js App Router matches `/api/auth/[...all]` with higher specificity than `/api/[[...slugs]]`, preventing route collisions.
     - `nextCookies()` from `better-auth/next-js` is enabled in `apps/web/src/lib/auth.ts` for seamless cookie handling across Server Actions and Route Handlers.

## ADR 002: Runtime Policy (Bun Local Tooling, Node.js Serverless on Vercel)

- **Status**: Accepted
- **Decision**:
  - Use **Bun** (`bun@1.4.3`) for local development, package management, test execution (`bun test`), scripts, and builds.
  - Deploy on **Vercel's default Node.js Serverless runtime** for Next.js App Router (`vercel.json` intentionally omits `bunVersion` and custom standalone entries) for maximum stability with Next.js 16, Drizzle `postgres`, and Better Auth.

## ADR 003: PostGIS Spatial Storage, Indexing, and Proximity Query Strategy

- **Status**: Accepted
- **Decision**:
  - Enable `CREATE EXTENSION IF NOT EXISTS postgis;` in the baseline migration (`0000_lowly_scrambler.sql`) before creating spatial tables.
  - Store point coordinates in `geometry(Point, 4326)` (`WGS 84`, `(longitude, latitude)` order) with a PostgreSQL GiST index (`places_location_idx`).
  - Configure `packages/db/drizzle.config.ts` with `extensionsFilters: ['postgis']` and `tablesFilter: ['!spatial_ref_sys', '!geometry_columns', '!geography_columns']` so `drizzle-kit` never attempts to drop or alter PostGIS system tables.
  - In `GET /api/places/nearby`, combine a degree bounding-box prefilter (`location && ST_Expand(ST_SetSRID(ST_MakePoint($lon, $lat), 4326), $degreeBuffer)`) with exact geodesic filtering (`ST_DWithin(location::geography, ..., $radius)`) and `ST_Distance` ordering. Verified via `EXPLAIN` to utilize `Index Scan using places_location_idx` instead of `Seq Scan`.

## ADR 004: Serverless PostgreSQL Connection Management

- **Status**: Accepted
- **Decision**:
  - Use `postgres` (`postgres.js`) with a module-level singleton (`globalThis` cached in development) and `{ prepare: false }` in `packages/db/src/client.ts` so the driver works cleanly with serverless transaction-mode connection poolers (PgBouncer, Neon, Supabase).
  - Recommended hosted PostGIS providers: **Neon** or **Supabase** (both natively support the `postgis` extension and pooled connection strings).

## ADR 005: Security Baseline (CORS, Headers, Env Validation, Auth Guards)

- **Status**: Accepted
- **Decision**:
  - **CORS**: Enforce an explicit origin allowlist (`allowedOrigins` in `apps/web/src/server/plugins/cors.ts`, reused by `/api/auth/[...all]` `OPTIONS` handler). Never reflect arbitrary `Origin` headers with `Access-Control-Allow-Credentials: true`.
  - **Security Headers**: Apply baseline headers globally in `apps/web/next.config.ts` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-DNS-Prefetch-Control: on`).
  - **Environment Validation**: Validate env vars via Zod (`apps/web/src/lib/env.ts`) and fail fast in production runtime if `BETTER_AUTH_SECRET` still uses the local development fallback.
  - **Error Handling**: Centralized `onError` handler suppresses stack traces and internal error details when `NODE_ENV === 'production'`.
  - **Auth Guards**: Every internal mutation and protected read endpoint uses Elysia `requireAuth: true` or `requireRole([...])` macros derived from Better Auth sessions.

## ADR 006: ESLint Flat Config for Next.js 16 + ESLint 10

- **Status**: Accepted
- **Decision**:
  - Compose `eslint.config.mjs` using `@eslint/js`, `typescript-eslint`, and `eslint-config-next/core-web-vitals` so Next.js (`@next/next/*`) and React Hooks (`react-hooks/*`) rules are recognized cleanly across the monorepo.
  - Keep strict correctness checks (`prefer-const`, etc.) as errors while setting React Compiler / stylistic migration rules to `warn` so pre-existing UI code stays lint-clean without hiding warnings.
