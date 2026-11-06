# Panduan Lengkap Vercel Geist Design System

Desain sistem Vercel Geist diimplementasikan secara penuh pada proyek ini sesuai spesifikasi resmi [vercel.com/geist](https://vercel.com/geist). Konfigurasi terpusat pada [`app/globals.css`](file:///E:/Coding/elysiajs/app/globals.css) dan [`src/vercel.css`](file:///E:/Coding/elysiajs/src/vercel.css), serta dihubungkan ke font resmi via [`app/layout.tsx`](file:///E:/Coding/elysiajs/app/layout.tsx).

---

## 1. Colors (Warna Hasil Kalibrasi Inspeksi Vercel Dashboard)

Token dipetakan secara akurat sesuai hasil inspeksi langsung dashboard Vercel ([`docs/inspeksi.md`](file:///C:/Users/DESKTOP/Documents/elysia/docs/inspeksi.md)):

### Tema Terang (Light Mode):
- **Kanvas / Layout, Navbar, Sidebar**: `#FAFAFA` (`--background`, `--sidebar`)
- **Konten Card, Input, Select Surface**: `#FFFFFF` (`--card`, `--popover`)
- **Default Button (Primary)**:
  - Background: `#171717` (`--primary`)
  - Text: `#FFFFFF` (`--primary-foreground`)
  - Hover: `#383838`
- **Outline Button (Secondary)**:
  - Background: `#FFFFFF` (`--card`)
  - Border: hairline `var(--ds-gray-alpha-300)`
  - Hover: `#F2F2F2`
  - Text: `#171717`
- **Navigasi Sidebar / Menu Active**: `#EBEBEB` (`--accent`)
- **Navigasi Sidebar / Menu Inactive Hover (Saat Berselancar)**: `#F2F2F2`
- **Focus Ring**: `#D1D1D1` (`--ring`, `--sidebar-ring`)

### Tema Gelap (Dark Mode):
- **Kanvas / Layout, Navbar, Sidebar**: `#000000` (`--background`, `--sidebar`)
- **Konten Card, Input, Select Surface**: `#0A0A0A` (`--card`, `--popover`)
- **Default Button (Primary)**:
  - Background: `#EDEDED` (`--primary`)
  - Text: `#000000` (`--primary-foreground`)
  - Hover: `#CCCCCC`
- **Outline Button (Secondary)**:
  - Background: `#0A0A0A` (`--card`)
  - Border: hairline `var(--ds-gray-alpha-400)`
  - Hover: `#1F1F1F`
  - Text: `#EDEDED`
- **Navigasi Sidebar / Menu Active**: `#1F1F1F` (`--accent`)
- **Navigasi Sidebar / Menu Inactive Hover (Saat Berselancar)**: `#1A1A1A`
- **Focus Ring**: `#3D3D3D` (`--ring`, `--sidebar-ring`)

---

## 2. Component Sizing (Ukuran Standar Vercel)
- **Button (Standard)**: Tinggi `32px` (`h-8`), padding `px-3` (12px), radius `6px` (`rounded-md`), teks `text-sm font-medium`.
- **Button (Compact / Action Tag / Badge)**: Tinggi `24px` (`h-6`), padding `px-2` (8px), radius `6px` (`rounded-md`), teks `text-xs font-medium`.
- **Button (Large)**: Tinggi `40px` (`h-10`), padding `px-4`, radius `6px` (`rounded-md`), teks `text-sm font-medium`.
- **Field Input & Box Search (Sidebar)**: Tinggi `40px` (`h-10` / `--geist-form-height`), padding `px-3`, icon `16px` (`size-4`), radius `6px` (`rounded-md`), teks `text-sm`, bg `#FFFFFF` (light) / `#0A0A0A` (dark).
- **Navbar Search Trigger**: Tinggi `36px` (`h-9`), padding `px-3`, icon `16px` (`size-4`), teks `text-sm`.
- **Avatar Button (Navbar Trigger)**: Ukuran `36px` (`size-9`), `rounded-full`, ring `ring-1 ring-border`.
- **Dropdown Menu Item & Menu Button**: Tinggi `40px` (`h-10` / `h-(--ds-size-medium)`), padding `px-2.5`, radius `6px` (`rounded-md`), teks `text-sm font-normal`, hover `#F2F2F2` (light) / `#1F1F1F` (dark).
- **Select Trigger**: Default tinggi `40px` (`h-10` / `--ds-size-medium`), compact `32px` (`h-8`), padding `px-3`, radius `6px` (`rounded-md`), hover `#F2F2F2` (light) / `#1F1F1F` (dark).
- **Select Item (Menu Select)**: Tinggi `40px` (`h-10`), padding `px-2.5`, radius `6px` (`rounded-md`), teks `text-sm font-normal`, check indicator `16px` (`size-4`).
- **Card**: Radius `8px` (`rounded-lg`), border hairline 1px, padding `p-6`, bg `#FFFFFF` (light) / `#0A0A0A` (dark), hover border highlight.
- **Sidebar Nav Row**: Tinggi `36px` (`h-9`), radius `6px` (`rounded-md`), icon container `size-9 place-content-center`.

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

## 4. Materials (Elevasi, Border, & Radius)

Sesuai spesifikasi resmi [Vercel Geist](https://vercel.com/geist/materials):
- **Borders**: Hairline 1px menggunakan token transparan `var(--ds-gray-alpha-300)` (light mode) dan `var(--ds-gray-alpha-400)` (dark mode). Tidak menggunakan border solid tebal khas default shadcn/ui.
- **Background**: Kanvas dan kartu menggunakan `#ffffff` (light mode) dan pure pitch black `#000000` (dark mode) dengan pemisahan border hairline.
- **Hover**: Menggunakan `hover:bg-accent` (`rgba(0,0,0,0.05)` / `rgba(255,255,255,0.09)`) dan transisi border ke `hover:border-foreground/30`.
- **Skala Radius Geist**:
  - `6px` (`rounded-md`): Tombol, input, select, dan item kontrol.
  - `8px` (`rounded-lg`): Kartu (Card) dan kontainer data.
  - `12px` (`rounded-xl`): Modal dialog, dropdown menu, dan popover.
  - `9999px` (`rounded-full`): Status badge dan avatar.

### Surface (Pada Halaman)
- `material-base`: Kontainer datar / kartu biasa (`radius: 8px`, border `var(--ds-gray-alpha-400)`).
- `material-small`: Elemen kontrol (`radius: 6px`, border `var(--ds-gray-alpha-400)`).
- `material-medium`: Kontainer bertingkat sedang (`radius: 8px`, bayangan halus).
- `material-large`: Blok konten menonjol (`radius: 12px`, bayangan dalam).

### Floating (Melayang di Atas Halaman)
- `material-tooltip`: Tooltip ringkas (`radius: 4px`, warna kontras terbalik).
- `material-menu`: Dropdown menu & popover (`radius: 8px`, backdrop-filter blur 16px).
- `material-modal`: Dialog modal (`radius: 12px`, bayangan elevasi tinggi).
- `material-fullscreen`: Tampilan fullscreen takeover (`radius: 16px`, elevasi maksimal).

---

## 5. Icons (Ikon)

- Paket resmi **`@geist-ui/icons`** telah terpasang dan siap digunakan:
  ```tsx
  import { Check, ChevronRight, Activity, Terminal } from '@geist-ui/icons';

  <Activity size={16} />
  ```
- Bila menggunakan **`lucide-react`**, gunakan prop `strokeWidth={1.5}` atau tambahkan utility class `.geist-icon` untuk menjaga geometri minimalis 1px/1.5px khas Geist.
