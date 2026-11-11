import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from 'cloudinary';
import { env } from '@/lib/env';

/**
 * Konfigurasi Cloudinary Instance Tersentralisasi
 * Menggunakan env credentials atau fallback ke CLOUDINARY_URL
 */
if (process.env.CLOUDINARY_URL || env.CLOUDINARY_URL) {
  cloudinary.config({
    url: process.env.CLOUDINARY_URL || env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Cek apakah Cloudinary telah dikonfigurasi dengan kredensial nyata (bukan placeholder)
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = env.CLOUDINARY_URL || process.env.CLOUDINARY_URL;

  if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://') && !cloudinaryUrl.includes('your_')) {
    return true;
  }

  return Boolean(
    cloudName &&
    cloudName !== 'your_cloud_name' &&
    apiKey &&
    apiKey !== 'your_api_key' &&
    apiSecret &&
    apiSecret !== 'your_api_secret'
  );
}

/**
 * Core Jenis Foto Berdasarkan Spesifikasi Arsitektur PDAM Tirtawening
 */
export type JenisFoto =
  | 'stand'   // Foto stand meteran (angka meter air)
  | 'segel'   // Foto kondisi segel meter
  | 'rumah'   // Foto rumah / persil pelanggan
  | 'aduan'   // Foto laporan pengaduan pelanggan
  | 'selesai' // Foto bukti penyelesaian perbaikan / SPK
  | 'angkat'  // Foto water meter lama saat diangkat/dicabut
  | 'pasang'  // Foto water meter baru saat dipasang
  | 'avatar'; // Foto profil akun / avatar pengguna

export type ModulFoto = 'cater' | 'mandiri' | 'gwm' | 'pengaduan' | 'avatars';

/**
 * Standarisasi Penamaan File Sesuai Format:
 * ( {THBL}_{JENIS}_{IDENTIFIER}.jpg )
 *
 * Contoh:
 * - 202610_stand_00404300110.jpg
 * - 202610_segel_00404300110.jpg
 * - 202610_rumah_00404300110.jpg
 * - 202610_stand_00404300110.jpg (mandiri)
 * - 202610_aduan_TW2610001234.jpg
 * - 202610_avatar_usr_12345.jpg
 */
export function generatePhotoPublicId({
  thbl,
  jenis,
  identifier,
}: {
  thbl?: string;
  jenis: JenisFoto;
  identifier: string;
}): string {
  // Format THBL 6 digit (contoh: 202610)
  const periode = thbl
    ? thbl.replace(/\D/g, '').slice(0, 6)
    : new Date().toISOString().slice(0, 7).replace('-', '');

  // Sanitasi identifier (nolg / nomor tiket / user id)
  const cleanId = identifier.replace(/[^a-zA-Z0-9_-]/g, '');

  return `${periode}_${jenis.toLowerCase()}_${cleanId}`;
}

/**
 * Mendapatkan Path Folder Terstruktur di Cloudinary
 */
export function getCloudinaryFolder(modul: ModulFoto, thbl?: string): string {
  const base = 'tirtawening';
  if (modul === 'avatars') {
    return `${base}/avatars`;
  }
  const periode = thbl
    ? thbl.replace(/\D/g, '').slice(0, 6)
    : new Date().toISOString().slice(0, 7).replace('-', '');

  return `${base}/${modul}/${periode}`;
}

export interface UploadPhotoResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

/**
 * Unggah gambar (Buffer, Base64 Data URL, atau path) ke Cloudinary
 * dengan penamaan format standar PDAM
 */
export async function uploadToCloudinary({
  file,
  modul,
  jenis,
  identifier,
  thbl,
  tags = [],
}: {
  file: string; // Base64 DataURL atau URL atau File Buffer string
  modul: ModulFoto;
  jenis: JenisFoto;
  identifier: string;
  thbl?: string;
  tags?: string[];
}): Promise<UploadPhotoResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Kredensial Cloudinary belum dikonfigurasi di .env.local (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
    );
  }

  const folder = getCloudinaryFolder(modul, thbl);
  const filename = generatePhotoPublicId({ thbl, jenis, identifier });

  const options: UploadApiOptions = {
    folder,
    public_id: filename,
    overwrite: true,
    resource_type: 'image',
    tags: ['tirtawening', modul, jenis, ...(thbl ? [thbl] : []), ...tags],
    // Transformasi standar web modern
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  };

  const result: UploadApiResponse = await cloudinary.uploader.upload(file, options);

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
  };
}

/**
 * Hapus gambar dari Cloudinary berdasarkan public_id
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) {
    return false;
  }
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('[CLOUDINARY_DELETE_ERROR]', error);
    return false;
  }
}

/**
 * Generate CDN URL dengan optimasi dinamis Cloudinary (width, height, crop, format)
 */
export function getCdnUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  } = {}
): string {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || cloudName === 'your_cloud_name') {
    return publicId; // fallback jika publicId adalah string URL
  }

  return cloudinary.url(publicId, {
    secure: true,
    quality: options.quality || 'auto',
    fetch_format: 'auto',
    width: options.width,
    height: options.height,
    crop: options.crop || (options.width && options.height ? 'fill' : undefined),
  });
}

export { cloudinary };
