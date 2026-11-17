// apps/web/src/app/api/public/pengaturan/route.ts
// Endpoint Publik untuk Mengakses Profil Perusahaan dan Konten CMS Dinamis

import { NextResponse } from 'next/server';
import { pengaturanService } from '@/server/services/pengaturan/pengaturan.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const data = await pengaturanService.getPengaturan(key, null);
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Pengaturan tidak ditemukan' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    const semuaData = await pengaturanService.getSemuaPengaturan();
    return NextResponse.json({ success: true, data: semuaData });
  } catch (error) {
    console.error('[API_PUBLIC_PENGATURAN_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil pengaturan publik' },
      { status: 500 }
    );
  }
}
