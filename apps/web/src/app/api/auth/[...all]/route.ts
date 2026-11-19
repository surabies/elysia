import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';
import { allowedOrigins } from '@/server/plugins/cors';

const authHandlers = toNextJsHandler(auth);

export const GET = authHandlers.GET;
export const POST = authHandlers.POST;
export const PATCH = authHandlers.PATCH;
export const PUT = authHandlers.PUT;
export const DELETE = authHandlers.DELETE;

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')?.replace(/\/$/, '') ?? '';
  const isAllowed = origin !== '' && allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    Vary: 'Origin',
  };

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

