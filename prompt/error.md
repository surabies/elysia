## Error Type
Console Error

## Error Message
[2m2026-11-20T04:11:41.873Z[0m [31mERROR[0m [1m[Better Auth]:[0m Failed to query fallback join for model user: {}


    at push.console.error (src/components/PenyediaTema.tsx:16:26)
    at auth (src\lib\auth\index.ts:15:25)
    at LoginPage (src\app\(auth)\login\page.tsx:37:19)
    at LoginPage (<anonymous>:null:null)

## Code Frame
  14 |       return
  15 |     }
> 16 |     originalConsoleError.apply(console, args)
     |                          ^
  17 |   }
  18 | }
  19 |

Next.js version: 16.4.5 (Turbopack)
DESKTOP@DESKTOP-5SP8881 UCRT64 ~/Documents/elysia (main)
$ bun run db:migrate
$ bun --filter "@cater/db" db:migrate
@cater/db db:migrate $ bun run src/migrate.ts
│ ◇ injected env (10) from ..\..\.env.local
│ ◇ injected env (0) from ..\..\.env
│ Applying database migrations...
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P06",
│   message: "schema \"drizzle\" already exists, skipping",
│   file: "schemacmds.c",
│   line: "132",
│   routine: "CreateSchemaCommand",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"__drizzle_migrations\" already exists, skipping",
│   file: "parse_utilcmd.c",
│   line: "208",
│   routine: "transformCreateStmt",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pengaturan_konten\" already exists, skipping",
│   file: "parse_utilcmd.c",
│   line: "208",
│   routine: "transformCreateStmt",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pipa_jaringan\" already exists, skipping",
│   file: "parse_utilcmd.c",
│   line: "208",
│   routine: "transformCreateStmt",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"sumber_air\" already exists, skipping",
│   file: "parse_utilcmd.c",
│   line: "208",
│   routine: "transformCreateStmt",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"wilayah\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"zona\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"jumlah_kk\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"pelanggan\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"topografi\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"potensi\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"bangunan\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"sumber_air\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"durasi\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"luas_area\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"latitude\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"longitude\" of relation \"area_layanan\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42701",
│   message: "column \"lokasi_wilayah\" of relation \"broadcast\" already exists, skipping",
│   file: "tablecmds.c",
│   line: "8280",
│   routine: "check_for_column_name_collision",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pipa_pelayanan_idx\" already exists, skipping",
│   file: "index.c",
│   line: "898",
│   routine: "index_create",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pipa_material_idx\" already exists, skipping",
│   file: "index.c",
│   line: "898",
│   routine: "index_create",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pipa_dma_idx\" already exists, skipping",
│   file: "index.c",
│   line: "898",
│   routine: "index_create",
│ }
│ {
│   severity_local: "NOTICE",
│   severity: "NOTICE",
│   code: "42P07",
│   message: "relation \"pipa_sumber_air_idx\" already exists, skipping",
│   file: "index.c",
│   line: "898",
│   routine: "index_create",
│ }
│ Migration error: 36 |   async queryWithCache(queryString, params, query) {
│ 37 |     if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
│ 38 |       try {
│ 39 |         return await query();
│ 40 |       } catch (e) {
│ 41 |         throw new DrizzleQueryError(queryString, params, e);
│                    ^
│ error: Failed query: ALTER TABLE "cater_baca_meter" ADD COLUMN "foto_segel_url" text;
│ params: 
│   query: "ALTER TABLE \"cater_baca_meter\" ADD COLUMN \"foto_segel_url\" text;",
│  params: [],
│ 
│       at queryWithCache (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\drizzle-orm@0.45.4+4dfff5effc1397c6\node_modules\drizzle-orm\pg-core\session.js:41:15)
│ 
│ 775 |     refresh()
│ 776 |   }
│ 777 | 
│ 778 |   function ErrorResponse(x, start, end) {
│ 779 |     const item = sent[0]
│ 780 |         , error = Errors.postgres(p.error(x, start, end))
│                                ^
│ PostgresError: column "foto_segel_url" of relation "cater_baca_meter" already exists
│  severity_local: "ERROR",
│    severity: "ERROR",
│        file: "tablecmds.c",
│     routine: "check_for_column_name_collision",
│        code: "42701"
│ 
│       at ErrorResponse (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\connection.js:780:26)
│       at frame (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\connection.js:583:21)
│       at frame (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\protocol.js:322:5)
│       at run (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\protocol.js:281:25)
│       at push (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\protocol.js:235:7)
│       at data (C:\Users\DESKTOP\Documents\elysia\node_modules\.bun\postgres@4.0.0\node_modules\postgres\src\socket.js:111:29)
│       at emit (node:events:100:22)
│       at addChunk (internal:streams/readable:267:47)
│       at readableAddChunkPushByteMode (internal:streams/readable:245:18)
│       at pushDataToSocket (node:net:360:21)
└─ Exited with code 1
error: script "db:migrate" exited with code 1

DESKTOP@DESKTOP-5SP8881 UCRT64 ~/Documents/elysia (main)
$ 