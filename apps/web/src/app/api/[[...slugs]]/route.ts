import { app } from '@/server/app';

// Pastikan seluruh endpoint API selalu dynamic dan tidak pernah dicache oleh Next.js atau browser
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export const HEAD = app.fetch;
