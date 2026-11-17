// apps/web/src/app/api/pengaturan/route.ts
// Endpoint Terproteksi Pengaturan Dashboard untuk Profil Perusahaan & CMS Dinamis

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { pengaturanService } from '@/server/services/pengaturan/pengaturan.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Tidak terotentikasi. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const data = await pengaturanService.getSemuaPengaturan();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API_PENGATURAN_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengaturan sistem' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Tidak terotentikasi. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { kunci, nilai, kategori } = body;

    if (!kunci || nilai === undefined) {
      return NextResponse.json(
        { success: false, error: 'Parameter "kunci" dan "nilai" wajib disertakan.' },
        { status: 400 }
      );
    }

    const success = await pengaturanService.updatePengaturan(
      kunci,
      nilai,
      kategori || 'umum',
      session.user.name || session.user.email || 'OPERATOR'
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke basis data.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pengaturan "${kunci}" berhasil diperbarui.`,
    });
  } catch (error) {
    console.error('[API_PENGATURAN_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server internal saat menyimpan pengaturan.' },
      { status: 500 }
    );
  }
}
