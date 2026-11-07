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
elysiajs/ (Root Monorepo)
├── apps/
│   ├── web/                     # @cater/web: Next.js 16 + Elysia App Router + Geist UI
│   │   ├── src/app/             # Next.js App Router
│   │   ├── src/components/      # Shared UI, layout, and shadcn/ui components
│   │   ├── src/features/        # Feature-owned UI and application code
│   │   ├── src/server/          # Elysia API engine (mounted at /api/*)
│   │   └── package.json         # Web dependencies
│   │
│   └── mobile/                  # @cater/mobile: React Native / Expo Field Cater App
│       └── src/index.ts         # Meter reading submission & offline sync
│
├── packages/
│   ├── db/                      # @cater/db: Core Database & Drizzle Modular Schema
│   │   ├── data/jan/            # STI PDAM production CSV datasets (22,549 rows)
│   │   ├── src/schema/          # Modular schemas (wilayah, tarif, meter, pelanggan, cater, billing)
│   │   ├── src/etl/             # Fast streaming CSV importer
│   │   ├── src/migrations/      # Versioned SQL migrations (PostGIS enabled)
│   │   └── drizzle.config.ts    # Single source of truth for Drizzle Kit
│   │
│   └── types/                   # @cater/types: Shared DTOs and contracts
│
├── docs/                        # Architecture & documentation guides
├── tests/                       # Automated test suites (24/24 passing)
├── docker-compose.yml           # PostgreSQL 16/17 + PostGIS
└── package.json                 # Monorepo workspaces manager
```
│   │   └── utils.ts               # Utility helpers (cn)
│   └── server/
│       ├── modules/
│       │   ├── auth/              # /api/me (protected current user)
│       │   ├── echo/              # /api/echo (validated input)
│       │   ├── geo/               # /api/places (spatial CRUD & nearby search)
│       │   └── health/            # /api/health
│       ├── plugins/
│       │   ├── auth.ts            # Elysia session derive & requireAuth macro
│       │   ├── cors.ts            # CORS configuration
│       │   └── error-handler.ts   # Centralized error handler
│       └── app.ts                 # Elysia app definition & exported type App
├── tests/
│   ├── api-core.test.ts           # Core endpoints tests
│   ├── auth.test.ts               # Auth guards & 401 tests
│   ├── geo.test.ts                # Spatial coordinates validation & geodesic distance tests
│   └── migration.test.ts          # Schema & migration integrity tests
├── docker-compose.yml             # Local PostgreSQL + PostGIS container
├── drizzle.config.ts              # Drizzle Kit configuration
└── vercel.json                    # Minimal Vercel deployment configuration
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
This spins up PostgreSQL with the PostGIS extension pre-installed on `localhost:5432`.

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
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/elysia_db` |
| `BETTER_AUTH_SECRET` | Yes | 32+ character key for session signatures | `development-secret-key-must-be-at-least-32-chars-long` |
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
3. **Proximity Search**:
   - Distances are calculated using PostGIS spherical geography:
     ```sql
     ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography, $radius)
     ```
   - Results are ordered by distance using `ST_Distance`.
4. **Drizzle Kit PostGIS Configuration**:
   - PostGIS introduces system catalog tables (`spatial_ref_sys`, `geometry_columns`, `geography_columns`). `drizzle.config.ts` ignores these using `tablesFilter` so drizzle-kit never modifies PostGIS internal schemas.

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

## 10. Vercel Deployment

1. **Link Project**:
   ```bash
   vercel
   ```
2. **Environment Variables**:
   In your Vercel Project Settings, add:
   - `DATABASE_URL` (Point to your hosted PostGIS database, e.g., Neon, Supabase, or AWS RDS with PostGIS enabled)
   - `BETTER_AUTH_SECRET` (Generated 32+ character random secret)
   - `BETTER_AUTH_URL` (Your production domain, e.g. `https://your-domain.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` (`https://your-domain.vercel.app`)
3. **Database Migration**:
   Run database migrations as a controlled deployment step:
   ```bash
   bun run db:migrate
   ```
4. **Deploy Preview**:
   ```bash
   vercel
   ```
5. **Deploy Production** (requires approval):
   ```bash
   vercel --prod
   ```

---

## 11. Troubleshooting

- **Error: `type "geometry" does not exist`**:
  Make sure `CREATE EXTENSION IF NOT EXISTS postgis;` has run on your database before applying the places migration.
- **Session cookies not persisting on Vercel Preview**:
  Ensure `BETTER_AUTH_URL` matches the active deployment host, or configure `trustedOrigins` in `src/lib/auth.ts`.
- **Database Connection Limits in Serverless**:
  The database singleton uses `postgres(env.DATABASE_URL, { prepare: false })` to support connection pooling proxies like PgBouncer and Supabase / Neon poolers.
# elysia
