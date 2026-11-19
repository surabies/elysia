# Full-Stack Next.js + ElysiaJS + Drizzle ORM + PostGIS + Better Auth + shadcn/ui

A modern, production-ready full-stack application deployed on Vercel. It embeds **ElysiaJS** inside **Next.js App Router** for high-performance, strictly typed backend routing (with **Eden Treaty** client integration), backed by **PostgreSQL** with spatial geospatial capabilities via **PostGIS**, **Better Auth** for session-based authentication, **Drizzle ORM** for type-safe database queries, and **shadcn/ui** with **Tailwind CSS v4**.

---

## 1. Overview & Architecture

This repository adopts a **single-application, single-project** architecture:
- **Frontend**: Next.js App Router (React 19, Server & Client Components) styled with shadcn/ui and Tailwind CSS v4.
- **API Engine**: ElysiaJS mounted via a Next.js catch-all Route Handler at `apps/web/src/app/api/[[...slugs]]/route.ts` with prefix `/api`.
- **Authentication**: Better Auth mounted at `apps/web/src/app/api/auth/[...all]/route.ts`. More specific Next.js folder routes take precedence over root catch-all handlers without shadowing.
- **Client Type Safety**: Eden Treaty (`@elysiajs/eden`) provides end-to-end typed API calls directly from React components.
- **Spatial GIS**: PostgreSQL PostGIS stores spatial coordinates in `geometry(Point, 4326)` with GiST indexes, enabling `ST_DWithin` proximity queries and distance sorting.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router, Turbopack) |
| **API Layer** | ElysiaJS + Eden Treaty |
| **Database & ORM** | PostgreSQL (PostGIS extension) + Drizzle ORM + drizzle-kit |
| **Authentication** | Better Auth (Drizzle PostgreSQL adapter) |
| **UI Components** | shadcn/ui (Tailwind CSS v4, Lucide Icons, Class Variance Authority) |
| **Validation** | TypeBox (Elysia built-in) + Zod |
| **Testing & Tooling** | Bun (`bun test`, `bun run dev`, `bun run build`) |
| **Hosting** | Vercel (Next.js Serverless runtime) |

---

## 3. Monorepo Structure

The repository is organized as a **Bun Monorepo** (`apps/*` and `packages/*`). See [docs/MONOREPO_STRUCTURE.md](docs/MONOREPO_STRUCTURE.md) for full details.

```text
elysia/ (Root Monorepo)
├── apps/
│   ├── web/                          # @cater/web: Next.js 16 + Elysia App Router + shadcn/ui (Tailwind v4)
│   │   ├── src/app/
│   │   │   ├── api/[[...slugs]]/     # Elysia catch-all Route Handler (prefix /api)
│   │   │   ├── api/auth/[...all]/    # Better Auth Next.js Route Handler
│   │   │   ├── (auth)/               # Sign-in / Auth pages
│   │   │   ├── (dashboard)/          # Protected dashboard, Places GIS, Verifikasi, Pengaduan, DRD
│   │   │   └── (public)/             # Public landing, Lapor Meter, Cek Tagihan, Pengaduan Air
│   │   ├── src/components/           # Shared UI & shadcn/ui components
│   │   ├── src/features/             # Feature-owned UI modules
│   │   ├── src/lib/                  # auth.ts, auth-client.ts, api-client.ts (Eden), env.ts
│   │   └── src/server/
│   │       ├── modules/              # health, echo, auth, geo (places), cater, closing, pengaduan, publik
│   │       ├── plugins/              # cors.ts, error-handler.ts, auth.ts
│   │       └── app.ts                # Elysia app instance & exported type App
│   └── mobile-*/                     # Expo / React Native mobile apps
├── packages/
│   ├── db/                           # @cater/db: Drizzle ORM, PostGIS schema & migrations
│   │   ├── src/schema/               # auth.ts, geo.ts (places), cater, billing, pengaduan, rbac
│   │   ├── src/migrations/           # Versioned SQL migrations (0000 enables PostGIS first)
│   │   └── drizzle.config.ts         # Drizzle Kit config (extensionsFilters: ['postgis'])
│   └── types/                        # @cater/types: Shared DTOs and types
├── docs/                             # FEATURES.md, DECISIONS.md, architecture & business docs
├── tests/                            # Automated Bun test suites (unit, integration, E2E)
├── docker-compose.yml                # Local PostgreSQL 16 + PostGIS container (port 5433)
├── eslint.config.mjs                 # ESLint 10 Flat Config + eslint-config-next/core-web-vitals
└── vercel.json                       # Minimal Vercel Next.js configuration
```

---

## 4. Installation & Setup

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for local PostGIS container)
- Node.js (v20+)

### Step 1: Clone and Install
```bash
bun install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the required variables (see [Environment Variables](#6-environment-variables)).

---

## 5. Local Development Workflow

### 1. Start Local PostGIS Database
```bash
docker compose up -d
```
This spins up PostgreSQL 16 with the PostGIS extension pre-installed on `localhost:5433` (mapped to container port `5432`).

### 2. Run Database Migrations
```bash
bun run db:migrate
```
*Note: The first migration enables the PostGIS extension (`CREATE EXTENSION IF NOT EXISTS postgis;`) before creating tables with spatial geometries.*

### 3. Seed Initial Spatial Data (Optional)
```bash
bun run db:seed
```
Seeds sample Jakarta landmarks (Monas, Istiqlal Mosque, Jakarta Cathedral).

### 4. Start Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Environment Variables

| Variable | Required? | Purpose | Example Placeholder |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled in prod) | `postgresql://postgres:postgres@localhost:5433/elysia_db` |
| `BETTER_AUTH_SECRET` | Yes | 32+ character key for session signatures (fails fast in prod if missing) | `your-32-character-secret-key-here-min-length` |
| `BETTER_AUTH_URL` | Yes | Base URL of authentication server | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for client Eden Treaty & Auth | `http://localhost:3000` |
| `NODE_ENV` | No | Runtime mode (`development`, `production`, `test`) | `development` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins | `http://localhost:3000` |

---

## 7. API Reference

All Elysia endpoints are prefixed with `/api`.

### Core Endpoints
| Method | Endpoint | Auth | Description | Example Response |
|---|---|---|---|---|
| `GET` | `/api` | None | API metadata | `{"success": true, "name": "Elysia Backend API", "version": "1.0.0"}` |
| `GET` | `/api/health` | None | Health check | `{"success": true, "status": "healthy", "timestamp": "..."}` |
| `POST` | `/api/echo` | None | Message echo (validated) | `{"success": true, "data": {"message": "..."}}` |

### Auth Endpoints (Better Auth)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `ALL` | `/api/auth/*` | Mixed | Better Auth handlers (`sign-in/email`, `sign-up/email`, `sign-out`, `get-session`) |
| `GET` | `/api/me` | **Required** | Retrieves currently authenticated user and session |

### PostGIS Spatial Places Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/places` | None | Paginated list of places (`?page=1&limit=20`) |
| `GET` | `/api/places/nearby` | None | Proximity search (`?lon=106.82&lat=-6.17&radius=15000&limit=20`) |
| `GET` | `/api/places/:id` | None | Get place by ID |
| `POST` | `/api/places` | **Required** | Create new place with name and coordinates (`longitude`, `latitude`) |
| `DELETE` | `/api/places/:id` | **Required (Owner)** | Delete place (strictly checks creator ownership) |

---

## 8. Database & PostGIS Notes

1. **SRID & Coordinate Order**:
   - Stored in standard GPS coordinate reference system: **SRID 4326** (`WGS 84`).
   - PostGIS coordinate order is `(longitude, latitude)` or `(X, Y)`.
   - Longitude is bounded between `[-180, 180]` and Latitude is bounded between `[-90, 90]`.
2. **Spatial Indexing**:
   - The `places.location` column is indexed using a PostgreSQL **GiST index** (`USING gist ("location")`), ensuring high performance for spatial queries.
3. **Proximity Search (GiST-Indexed)**:
   - Uses a degree bounding-box prefilter (`location && ST_Expand(...)`) so PostgreSQL utilizes `places_location_idx` (`Index Scan`), followed by meter-exact spherical geography filtering:
     ```sql
     WHERE location && ST_Expand(ST_SetSRID(ST_MakePoint($lon, $lat), 4326), $degreeBuffer)
       AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography, $radius)
     ORDER BY "distanceMeters" ASC
     ```
4. **Drizzle Kit PostGIS Configuration**:
   - PostGIS introduces system catalog tables (`spatial_ref_sys`, `geometry_columns`, `geography_columns`). `packages/db/drizzle.config.ts` ignores these using `extensionsFilters: ['postgis']` and `tablesFilter` so `drizzle-kit` never modifies PostGIS internal schemas.

---

## 9. Quality Gates & Verification

Run all verification gates before submitting changes:

```bash
# 1. Typecheck
bun run typecheck

# 2. Linting
bun run lint

# 3. Test Suite
bun run test

# 4. Production Build
bun run build
```

---

## 10. Vercel Deployment & Serverless Architecture

1. **Monorepo Root Directory**:
   In Vercel Project Settings, set **Root Directory** to `apps/web` (or link from repo root with Turborepo auto-detection). `vercel.json` is kept minimal (`framework: "nextjs"`), targeting Vercel's standard Node.js Serverless runtime.
2. **Environment Variables (Preview & Production)**:
   Configure in Vercel Project Settings:
   - `DATABASE_URL` (Hosted PostGIS-enabled PostgreSQL — e.g., **Neon** or **Supabase** pooled URL; place Vercel Function region near DB region)
   - `BETTER_AUTH_SECRET` (Generated 32+ character random secret via `openssl rand -base64 32`)
   - `BETTER_AUTH_URL` (`https://your-domain.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` (`https://your-domain.vercel.app`)
   - `CORS_ALLOWED_ORIGINS` (Optional comma-separated explicit allowlist for cross-origin clients)
3. **Database Migrations (Controlled Step)**:
   Never run schema migrations implicitly at request runtime. Run versioned migrations in CI or manually against staging/production after approval:
   ```bash
   bun run db:migrate
   ```
4. **CLI Commands** (install Vercel CLI via `bun add -g vercel` if not installed):
   - Local dev: `bun run dev` (Next.js Turbopack) or `vercel dev` (emulates Vercel Functions + env)
   - Preview deploy: `vercel`
   - Production deploy *(requires explicit approval)*: `vercel --prod`

### Serverless & Performance Notes
- **Stateless & Connection Reuse**: Module-level singleton in `packages/db/src/client.ts` with `{ prepare: false }` for transaction pooler compatibility.
- **No Persistent Local Disk**: Use external object storage (e.g., Cloudinary / S3 / Vercel Blob) for user uploads.
- **No Persistent WebSockets**: Vercel Functions are stateless HTTP handlers; use SSE, polling, or a managed realtime service (Pusher/Ably/Supabase Realtime) if live push is needed.
- **Caching**: Route Handlers under `/api/*` are dynamic by default in Next.js 16 (no implicit GET caching).

---

## 11. Troubleshooting

- **Error: `type "geometry" does not exist`**:
  Ensure `CREATE EXTENSION IF NOT EXISTS postgis;` has been applied (included in `packages/db/src/migrations/0000_lowly_scrambler.sql`) before spatial table migrations.
- **Session cookies not persisting on Vercel Preview**:
  `apps/web/src/lib/auth.ts` automatically adds `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` to `trustedOrigins` and enables `nextCookies()`. Verify `BETTER_AUTH_URL` matches the deployment origin.
- **Database Connection Limits in Serverless**:
  Use a pooled connection string (`?pgbouncer=true` or Neon `-pooler` host). `postgres(..., { prepare: false })` is already enabled.
- **Documentation References**:
  - Feature Inventory & Verification Matrix: [docs/FEATURES.md](docs/FEATURES.md)
  - Architecture Decisions: [docs/DECISIONS.md](docs/DECISIONS.md)
