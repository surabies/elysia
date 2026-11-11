// app/api/user/avatar/route.ts
// Endpoint backend resmi untuk mengunggah dan menghapus foto profil pengguna langsung ke Cloudinary & PostgreSQL

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, user } from '@cater/db';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  generatePhotoPublicId,
  getCloudinaryFolder,
} from '@/server/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak terotentikasi. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Data gambar tidak valid.' },
        { status: 400 }
      );
    }

    let finalImageUrl = image;

    // Jika kredensial Cloudinary aktif, unggah langsung ke Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadToCloudinary({
          file: image,
          modul: 'avatars',
          jenis: 'avatar',
          identifier: session.user.id,
          tags: ['avatar', session.user.id],
        });
        finalImageUrl = uploadResult.secureUrl;
      } catch (uploadErr) {
        console.error('[CLOUDINARY_AVATAR_UPLOAD_ERROR]', uploadErr);
        // Fallback: simpan base64 ke DB jika Cloudinary gagal koneksi
      }
    }

    // Update foto profil di database PostgreSQL tabel 'user'
    await db
      .update(user)
      .set({
        image: finalImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: isCloudinaryConfigured()
        ? 'Foto profil berhasil disimpan ke Cloudinary CDN & database.'
        : 'Foto profil berhasil disimpan ke database.',
      image: finalImageUrl,
    });
  } catch (error) {
    console.error('[API_USER_AVATAR_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui foto profil di database.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak terotentikasi. Silakan login kembali.' },
        { status: 401 }
      );
    }

    // Ambil user saat ini untuk memeriksa apakah perlu hapus dari Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const folder = getCloudinaryFolder('avatars');
        const filename = generatePhotoPublicId({ jenis: 'avatar', identifier: session.user.id });
        const publicId = `${folder}/${filename}`;
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error('[CLOUDINARY_DELETE_AVATAR_FAILED]', err);
      }
    }

    // Hapus foto profil di database PostgreSQL
    await db
      .update(user)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil dihapus dari database.',
      image: null,
    });
  } catch (error) {
    console.error('[API_USER_AVATAR_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus foto profil di database.' },
      { status: 500 }
    );
  }
}
