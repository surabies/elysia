import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PERUMDA Tirtawening Kota Bandung',
    short_name: 'Tirtawening',
    description:
      'Layanan Digital Terpadu Pelanggan, Cek Tagihan Air, Lapor Stand Meter Mandiri, dan Pengaduan Air PERUMDA Tirtawening Kota Bandung.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
    background_color: '#ffffff',
    theme_color: '#0055b8',
    orientation: 'portrait',
    scope: '/',
    categories: ['utilities', 'government', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Cek Tagihan Air',
        short_name: 'Tagihan',
        description: 'Cek tagihan rekening air bulanan',
        url: '/cek-tagihan',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Lapor Stand Meter',
        short_name: 'Lapor Meter',
        description: 'Laporkan angka stand meter mandiri',
        url: '/lapor-meter',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Pengaduan Air',
        short_name: 'Aduan Air',
        description: 'Sampaikan keluhan dan lacak status aduan',
        url: '/pengaduan-air',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Informasi Gangguan',
        short_name: 'Info Gangguan',
        description: 'Informasi pemeliharaan dan gangguan pipa',
        url: '/info-gangguan',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
