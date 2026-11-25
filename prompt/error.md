## Error Type

Build Error

## Error Message

Module not found: Can't resolve 'child_process'

## Build Output

./node_modules/.bun/dotenv@18.0.9/node_modules/dotenv/dist/index.cjs:7:3387
Error: Module not found: Can't resolve 'child_process'
5 | ...
6 | ...

> 7 | ...uire("os"),Q=require("path"),ve=require("child_process"),Ce=M(),R=N(),{optionsFromEnv:J}...

    |                                    ^^^^^^^^^^^^^^^^^^^^^^^^

8 | ...ule&&qe(process.argv.slice(2));
9 | ...

Import traces:
Server Component:
./node_modules/.bun/dotenv@18.0.9/node_modules/dotenv/dist/index.cjs
./packages/db/src/client.ts
./apps/web/src/lib/auth/index.ts
./apps/web/src/app/(dashboard)/layout.tsx

Client Component Browser:
./node_modules/.bun/dotenv@18.0.9/node_modules/dotenv/dist/index.cjs [Client Component Browser]
./packages/db/src/client.ts [Client Component Browser]
./apps/web/src/server/services/kpi/beban-kerja.ts [Client Component Browser]
./apps/web/src/features/dashboard/kpi/components/KpiFaktorMedanTab.tsx [Client Component Browser]
./apps/web/src/features/dashboard/kpi/components/KpiFaktorMedanTab.tsx [Server Component]
./apps/web/src/features/dashboard/kpi/index.ts [Server Component]
./apps/web/src/app/(dashboard)/kpi/page.tsx [Server Component]

Client Component SSR:
./node_modules/.bun/dotenv@18.0.9/node_modules/dotenv/dist/index.cjs [Client Component SSR]
./packages/db/src/client.ts [Client Component SSR]
./apps/web/src/server/services/kpi/beban-kerja.ts [Client Component SSR]
./apps/web/src/features/dashboard/kpi/components/KpiFaktorMedanTab.tsx [Client Component SSR]
./apps/web/src/features/dashboard/kpi/components/KpiFaktorMedanTab.tsx [Server Component]
./apps/web/src/features/dashboard/kpi/index.ts [Server Component]
./apps/web/src/app/(dashboard)/kpi/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found

Next.js version: 16.4.5 (Turbopack)
