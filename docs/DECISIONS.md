# Architecture Decisions

## ADR 001: Unified Next.js + ElysiaJS Full-Stack Architecture on Vercel

### Status
Accepted

### Context
The original concept was a standalone ElysiaJS server running directly on Bun. The updated target requirement is a full-stack Next.js (App Router) application with Shadcn UI v4 and Tailwind CSS v4, while retaining ElysiaJS for typed, composable backend routing and Eden Treaty client integration, alongside Better Auth for authentication and Drizzle ORM for PostgreSQL/PostGIS.

### Decision
1. **Single Next.js App / Single Vercel Project**:
   - The entire application lives within a unified Next.js App Router repository.
   - API endpoints managed by ElysiaJS are mounted via a catch-all route handler at `app/api/[[...slugs]]/route.ts` with prefix `/api`.
   - The Elysia instance exports its type definition (`type App = typeof app`) for Eden Treaty end-to-end type safety on the client.
   - Better Auth is mounted at `app/api/auth/[...all]/route.ts` using its dedicated Next.js route handler. In Next.js App Router, more specific folder routes take precedence over root-level catch-alls (`[[...slugs]]`), ensuring `/api/auth/*` routes are handled cleanly without collision.

2. **Runtime Policy**:
   - Local development and scripts use **Bun** (`bun dev`, `bun test`, `bun run build`, etc.).
   - Vercel deployment targets the standard Vercel Node.js Serverless runtime for maximum stability and compatibility with Next.js App Router and edge/serverless middleware, avoiding experimental Bun runtime flags unless necessary.

3. **Database & PostGIS**:
   - Database layer uses **Drizzle ORM** with `postgres` (or serverless compatible connection).
   - PostGIS extension is enabled via a baseline migration before spatial table creation.
   - Spatial coordinates are stored using SRID 4326 (`geometry(Point, 4326)`) with `(longitude, latitude)` order.
   - Spatial indexing uses PostgreSQL GiST index for fast spatial bounding box and distance lookups (`ST_DWithin`).
   - `drizzle.config.ts` ignores PostGIS internal system tables (e.g. `spatial_ref_sys`) via table filtering.

4. **UI & Styling**:
   - Tailwind CSS v4 with `@tailwindcss/postcss`.
   - shadcn/ui components conforming to current v4 design system and CSS variables.
