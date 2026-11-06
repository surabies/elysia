# Panduan Lengkap Vercel Geist Design System

Desain sistem Vercel Geist diimplementasikan secara penuh pada proyek ini sesuai spesifikasi resmi [vercel.com/geist](https://vercel.com/geist). Konfigurasi terpusat pada [`app/globals.css`](file:///E:/Coding/elysiajs/app/globals.css) dan [`src/vercel.css`](file:///E:/Coding/elysiajs/src/vercel.css), serta dihubungkan ke font resmi via [`app/layout.tsx`](file:///E:/Coding/elysiajs/app/layout.tsx).

---

## 1. Colors (Warna)

Geist memiliki 10 skala warna berpresisi tinggi dengan dukungan kontras optimal dan tema Light & Dark:

- **Background Layers**:
  - `bg-ds-background-100` (`#ffffff` di Light, `#000000` di Dark)
  - `bg-ds-background-200` (`#fafafa` di Light, `#0a0a0a` di Dark)
- **Gray Scale (100–1000)**:
  - `text-ds-gray-1000`, `bg-ds-gray-100`, `border-ds-gray-200`, dsb.
- **Gray Alpha (100–1000)**:
  - Khusus elemen semi-transparan, border dinamis, dan efek glass/overlay tanpa halo abu-abu pekat: `border-ds-gray-alpha-400`, `bg-ds-gray-alpha-100`, dsb.
- **Accent Scales (100–1000)**:
  - Blue: `bg-ds-blue-700`, `text-ds-blue-600`
  - Red / Error: `bg-ds-red-700`, `text-ds-red-600`
  - Amber / Warning: `bg-ds-amber-700`, `text-ds-amber-500`
  - Green / Success: `bg-ds-green-700`, `text-ds-green-600`
  - Teal, Purple, Pink
- **Pemetaan Otomatis Komponen shadcn/ui**:
  Token semantik shadcn (`--background`, `--foreground`, `--primary`, `--card`, `--border`, dsb.) sudah otomatis dipetakan ke token Geist resmi.

---

## 2. Typography (Tipografi)

Sesuai [Geist Typography](https://vercel.com/geist/typography), tersedia utility classes lengkap yang menggabungkan ukuran (`font-size`), tinggi baris (`line-height`), spasi antar huruf (`letter-spacing`), dan ketebalan (`font-weight`):

### Headings (Judul Halaman & Seksi)
```html
<h1 className="text-heading-72">Display 72</h1>
<h1 className="text-heading-64">Heading 64</h1>
<h1 className="text-heading-56">Heading 56</h1>
<h1 className="text-heading-48">Heading 48</h1>
<h2 className="text-heading-40">Heading 40</h2>
<h2 className="text-heading-32">Heading 32 (Dashboard Title)</h2>
<h3 className="text-heading-24">Heading 24</h3>
<h4 className="text-heading-20">Heading 20</h3>
<h5 className="text-heading-16">Heading 16</h5>
<h6 className="text-heading-14">Heading 14</h6>
```

### Body Copy (Teks Konten & Paragraf)
```html
<p className="text-copy-24">Introductory hero copy</p>
<p className="text-copy-20">Subheading copy</p>
<p className="text-copy-18">Prominent body</p>
<p className="text-copy-16">Standard body paragraph</p>
<p className="text-copy-14">Secondary description text</p>
<p className="text-copy-13">Small assistive text</p>
```

### UI Labels & Microcopy
```html
<span className="text-label-14">Menu item / Navigation</span>
<span className="text-label-13">Form input label</span>
<span className="text-label-12">Badges & metadata</span>
<span className="text-label-11">Footnotes & timestamps</span>

<!-- Monospace / Code / Data Tabular -->
<span className="text-label-14-mono">0x4F92...</span>
<span className="text-label-13-mono">42.195 km</span>
<code className="text-copy-14-mono">npm run dev</code>
```

### Buttons
```html
<button className="text-button-14">Confirm Action</button>
<button className="text-button-12">Compact Action</button>
```

---

## 3. Font (Geist Sans & Geist Mono)

- Paket resmi `geist` terpasang.
- Dikonfigurasi di [`app/layout.tsx`](file:///E:/Coding/elysiajs/app/layout.tsx):
  ```tsx
  import { GeistSans } from 'geist/font/sans';
  import { GeistMono } from 'geist/font/mono';

  export default function RootLayout({ children }) {
    return (
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="font-sans antialiased">
          {children}
        </body>
      </html>
    );
  }
  ```
- Di CSS/Tailwind v4:
  - Font Sans: `font-sans` memakai `var(--font-geist-sans)`
  - Font Mono: `font-mono` atau `code`/`pre` memakai `var(--font-geist-mono)`

---

## 4. Materials (Elevasi & Permukaan)

Sesuai [Geist Materials](https://vercel.com/geist/materials), elevasi diatur melalui kelas preset yang menggabungkan border radius, background, dan layered shadows:

### Surface (Pada Halaman)
- `material-base`: Kontainer datar / kartu biasa (`radius: 6px`, border `var(--ds-gray-alpha-400)`).
- `material-small`: Elemen sedikit terangkat (`radius: 6px`, bayangan halus).
- `material-medium`: Kontainer bertingkat sedang (`radius: 12px`, bayangan sedang).
- `material-large`: Blok konten menonjol (`radius: 12px`, bayangan dalam).

### Floating (Melayang di Atas Halaman)
- `material-tooltip`: Tooltip ringkas (`radius: 6px`, warna kontras terbalik).
- `material-menu`: Dropdown menu & popover (`radius: 12px`, backdrop-filter blur 16px).
- `material-modal`: Dialog modal (`radius: 12px`, bayangan elevasi tinggi 70px).
- `material-fullscreen`: Tampilan fullscreen takeover (`radius: 16px`, elevasi maksimal).

Contoh:
```html
<div className="material-base p-6">Resting Card</div>
<div className="material-menu p-3">Dropdown Options</div>
<div className="material-modal p-6">Modal Dialog</div>
```

---

## 5. Icons (Ikon)

- Paket resmi **`@geist-ui/icons`** telah terpasang dan siap digunakan:
  ```tsx
  import { Check, ChevronRight, Activity, Terminal } from '@geist-ui/icons';

  <Activity size={16} />
  ```
- Bila menggunakan **`lucide-react`**, gunakan prop `strokeWidth={1.5}` atau tambahkan utility class `.geist-icon` untuk menjaga geometri minimalis 1px/1.5px khas Geist.
