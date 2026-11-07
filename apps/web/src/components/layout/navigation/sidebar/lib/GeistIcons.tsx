// components/layout/navigation/sidebar/lib/GeistIcons.tsx
// Ikon murni 1:1 hasil inspeksi DOM Vercel Dashboard (docs/SIDEBAR.md dan docs/NAVBAR.md).
import * as React from "react"

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string
}

/** Chevron Kanan (Arrow penanda sub-menu di baris sidebar) — 12x12 / 16x16 */
export function GeistChevronRight({ size = 12, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      data-slot="geist-icon"
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m5.5 1.94.53.53 4.82 4.82a1 1 0 0 1 0 1.42l-4.82 4.82-.53.53L4.44 13l.53-.53L9.44 8 4.97 3.53 4.44 3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Chevron Kiri (Arrow penanda kembali ke root pada GroupDetail) — 12x12 / 16x16 */
export function GeistChevronLeft({ size = 12, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      data-slot="geist-icon"
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m10.5 14.06-.53-.53-4.82-4.82a1 1 0 0 1 0-1.42l4.82-4.82.53-.53L11.56 3l-.53.53L6.56 8l4.47 4.47.53.53z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Panah ganda atas-bawah (ChevronsUpDown) pada Workspace Switcher — 16x16 */
export function GeistChevronsUpDown({ size = 16, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      data-slot="geist-icon"
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.7 2.4a1 1 0 0 0-1.4 0L4.46 5.22l-.53.53L5 6.81l.53-.53L8 3.81l2.47 2.47.53.53 1.06-1.06-.53-.53zM5.54 9.72 5 9.19l-1.06 1.06.53.53 2.82 2.82a1 1 0 0 0 1.42 0l2.82-2.82.53-.53L11 9.19l-.53.53L8 12.19z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Search pada kotak pencarian SidebarSearch — 16x16 */
export function GeistSearch({ size = 16, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      data-slot="geist-icon"
      fill="none"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1.5 6.5a5 5 0 1 1 10 0 5 5 0 0 1-10 0m5-6.5a6.5 6.5 0 1 0 4.04 11.6l3.43 3.43.53.53 1.06-1.06-.53-.53-3.43-3.43A6.5 6.5 0 0 0 6.5 0"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Projects (4 kotak grid) — dipakai untuk Dashboard / Ringkasan */
export function GeistProjects({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2.5 5.5v-3h3v3zM1 2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm1.5 11.5v-3h3v3zM1 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm9.5-7.5v3h3v-3zM10 1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm.5 12.5v-3h3v3zM9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Deployments (Kubus 3D isometrik) — dipakai untuk Pelayanan / Operasional */
export function GeistDeployments({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        d="m8.35.34 6.25 3.25.4.2v8.42l-.4.2-6.25 3.26-.35.18-.35-.18-6.25-3.25-.4-.21V3.8l.4-.21L7.65.34 8 .15zM2.5 11.3l4.75 2.46V7.81L2.5 5.44zM8.75 7.8v5.95l4.75-2.46V5.44zM3.42 4.22 8 6.52l4.58-2.3L8 1.85z"
      />
    </svg>
  )
}

/** Ikon Analytics (Grafik batang + tren kurva) — dipakai untuk Analitik / Evaluasi */
export function GeistAnalytics({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1 1v11.75C1 13.99 2 15 3.25 15H15v-1.5H3.25a.75.75 0 0 1-.75-.75V1zm13.3 5.01.51-.54-1.1-1.03-.5.55-3.23 3.43-2.27-2.27a1 1 0 0 0-1.42 0L4.22 8.22l-.53.53 1.06 1.06.53-.53L7 7.56l2.29 2.29a1 1 0 0 0 1.43-.03z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Logs (Baris catatan dengan garis dan titik) — dipakai untuk Cater / Catat Meter */
export function GeistLogs({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9 2h6v1.5H9zm0 10h6v1.5H9zm.75-5H9v1.5h6V7H9.75M1 12h2v1.5H1zm.75-10H1v1.5h2V2H1.75M1 7h2v1.5H1zm4.75 5H5v1.5h2V12H5.75M5 2h2v1.5H5zm.75 5H5v1.5h2V7H5.75"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Observability (Mata radar / monitor observabilitas) — dipakai untuk Monitoring */
export function GeistObservability({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.02 4.77a5.25 5.25 0 0 1 7.96 0L14.76 8l-2.78 3.23a5.25 5.25 0 0 1-7.96 0L1.24 8zm9.1-.98a6.75 6.75 0 0 0-10.23 0l-3.2 3.72v.98l3.2 3.72a6.75 6.75 0 0 0 10.22 0l3.2-3.72V7.5zM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Networking / CDN (Bola dunia dengan garis meridian) — dipakai untuk Distribusi / NRW */
export function GeistNetworking({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Billing (Dompet / kartu tagihan) — dipakai untuk Keuangan & Billing */
export function GeistBilling({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14 14.5H2a2 2 0 0 1-1.99-1.8L0 12.5v-9c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2M2 13h12a.5.5 0 0 0 .5-.5v-6h-13v6c0 .28.22.5.5.5m-.5-8h13V3.5A.5.5 0 0 0 14 3H2a.5.5 0 0 0-.5.5zM4 10.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Storage (Susunan silinder database) — dipakai untuk Master / Gudang */
export function GeistStorage({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M3.3.79C4.54.29 6.2 0 8 0s3.46.29 4.7.79a5 5 0 0 1 1.57.94c.41.39.73.9.73 1.52v9.5a2 2 0 0 1-.73 1.52 5 5 0 0 1-1.57.94c-1.24.5-2.9.79-4.7.79s-3.46-.29-4.7-.79a5 5 0 0 1-1.57-.94A2 2 0 0 1 1 12.75v-9.5c0-.62.32-1.13.73-1.52A5 5 0 0 1 3.3.8m-.8 4.54V8c0 .07.03.22.26.43q.33.33 1.1.64c1.02.41 2.49.68 4.14.68s3.12-.27 4.14-.68q.77-.31 1.1-.64c.23-.21.26-.36.26-.43V5.33a6 6 0 0 1-.8.38c-1.24.5-2.9.79-4.7.79s-3.46-.29-4.7-.79a6 6 0 0 1-.8-.38m11-2.08c0 .07-.03.22-.26.43q-.33.33-1.1.64C11.12 4.73 9.65 5 8 5s-3.12-.27-4.14-.68q-.77-.31-1.1-.64c-.23-.21-.26-.36-.26-.43s.03-.22.26-.43q.33-.33 1.1-.64C4.88 1.77 6.35 1.5 8 1.5s3.12.27 4.14.68q.77.31 1.1.64c.23.21.26.36.26.43m0 6.83a6 6 0 0 1-.8.38c-1.24.5-2.9.79-4.7.79s-3.46-.29-4.7-.79a6 6 0 0 1-.8-.38v2.67c0 .07.03.22.26.43q.33.33 1.1.64c1.02.41 2.49.68 4.14.68s3.12-.27 4.14-.68q.77-.31 1.1-.64c.23-.21.26-.36.26-.43z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Security (Perisai terverifikasi) — dipakai untuk Otorisasi / Keamanan */
export function GeistSecurity({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        d="M8.75 0q.01.69.37 1.06.36.42 1.1.74.73.3 1.6.53c.55.14 1.16.29 1.67.46l.51.17v6.57a5.3 5.3 0 0 1-2.81 4.65l-2.84 1.48-.35.19-.35-.19-2.84-1.48A5.3 5.3 0 0 1 2 9.53V2.96l.51-.17c.5-.17 1.12-.32 1.67-.46q.87-.23 1.6-.53.74-.32 1.1-.74.36-.38.37-1.06zM8 2.06a4.5 4.5 0 0 1-1.61 1.11c-.6.26-1.24.45-1.82.6l-1.07.29v5.47c0 1.4.77 2.67 2.01 3.32L8 14.15l2.49-1.3a3.8 3.8 0 0 0 2.01-3.32V4.06q-.48-.14-1.07-.29a13 13 0 0 1-1.82-.6A4.5 4.5 0 0 1 8 2.06M11.06 7l-3.53 3.53c-.3.3-.77.3-1.06 0L4.94 9 6 7.94l1 1 3-3z"
      />
    </svg>
  )
}

/** Ikon Settings (Roda gigi presisi) — dipakai untuk Pengaturan Sistem */
export function GeistSettings({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        d="M9.77 1.46q.07.28.35.4.38.12.72.3.27.12.53-.04l1.23-.84 2.12 2.12-.84 1.23a.5.5 0 0 0-.03.53q.17.35.3.72.1.28.39.35L16 6.5v3l-1.46.27a.5.5 0 0 0-.4.35q-.12.38-.3.72a.5.5 0 0 0 .04.53l.84 1.23-2.12 2.12-1.23-.84a.5.5 0 0 0-.53-.03q-.34.17-.72.3a.5.5 0 0 0-.35.39L9.5 16h-3l-.27-1.46a.5.5 0 0 0-.29-.37l-.06-.02a7 7 0 0 1-.72-.3.5.5 0 0 0-.53.03l-1.23.84-2.12-2.12.84-1.23q.14-.21.06-.46l-.03-.07a7 7 0 0 1-.3-.72.5.5 0 0 0-.32-.33l-.07-.02L0 9.5v-3l1.46-.27q.25-.05.37-.29l.02-.06q.14-.38.3-.72a.5.5 0 0 0 0-.47l-.03-.06-.84-1.23L3.4 1.28l1.23.84q.26.16.53.03L5.5 2l.37-.14a.5.5 0 0 0 .33-.32l.02-.07L6.5 0h3zm-2.07.28a2 2 0 0 1-1.33 1.53l-.28.1-.4.18c-.6.25-1.31.22-1.9-.2l-.2-.13-.37.36.14.2c.4.6.44 1.32.2 1.92l-.18.39-.1.28c-.23.65-.8 1.19-1.54 1.33l-.24.04v.51l.24.05c.7.13 1.24.62 1.49 1.21l.04.12.1.28.18.4c.25.6.22 1.31-.2 1.9l-.13.2.36.37.2-.14.12-.08a2 2 0 0 1 1.8-.11l.39.17.28.1c.65.23 1.19.8 1.33 1.54l.04.24h.52l.04-.24.03-.13c.18-.69.7-1.2 1.3-1.4l.28-.1.4-.18c.6-.25 1.31-.21 1.9.2l.2.13.37-.37-.14-.2c-.4-.59-.44-1.3-.2-1.9l.18-.4.1-.28c.23-.65.8-1.19 1.54-1.33l.24-.05v-.5l-.24-.05a2 2 0 0 1-1.53-1.33l-.1-.28-.18-.4c-.25-.6-.21-1.31.2-1.9l.13-.2-.37-.37-.2.14c-.59.4-1.3.44-1.9.2l-.4-.18-.28-.1A2 2 0 0 1 8.3 1.73l-.04-.24h-.52zM8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6m0 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"
      />
    </svg>
  )
}

/** Ikon Support (Pelampung / Lifebuoy) — dipakai untuk Bantuan & Pengaduan */
export function GeistSupport({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14.5 8c0 1.1-.28 2.15-.77 3.06L11.34 9.7a3.7 3.7 0 0 0 0-3.4l2.4-1.36q.74 1.38.76 3.06m-3.44-5.73a6.5 6.5 0 0 0-6.12 0L6.3 4.66a3.7 3.7 0 0 1 3.4 0zM9.7 11.34l1.36 2.4a6.5 6.5 0 0 1-6.12 0l1.36-2.4a3.7 3.7 0 0 0 3.4 0M4.66 9.7a3.7 3.7 0 0 1 0-3.4l-2.4-1.36a6.5 6.5 0 0 0 0 6.12zM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-5.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Infrastructure (Komputer server monitor) — dipakai untuk Aset & Pemeliharaan */
export function GeistInfrastructure({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H8.75v3h1.75V16h-5v-1.5h1.75v-3H1a1 1 0 0 1-1-1zm1.5.5V10h13V2.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Workflows (Diagram alur) — dipakai untuk Alur Rute & Progres */
export function GeistWorkflows({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        d="m5.75 7 .67.34-1.57 3.13c.54.3.9.87.9 1.53v2c0 .97-.78 1.75-1.75 1.75H2c-.97 0-1.75-.78-1.75-1.75v-2c0-.97.78-1.75 1.75-1.75h1.29l1.79-3.58zM14 10.25c.97 0 1.75.78 1.75 1.75v2c0 .97-.78 1.75-1.75 1.75h-2c-.88 0-1.6-.65-1.73-1.5H7v-1.5h3.25V12c0-.97.78-1.75 1.75-1.75zm-12 1.5a.25.25 0 0 0-.25.25v2c0 .14.11.25.25.25h2c.14 0 .25-.11.25-.25v-2a.25.25 0 0 0-.25-.25zm10 0a.25.25 0 0 0-.25.25v2q.02.23.25.25h2q.23-.02.25-.25v-2a.25.25 0 0 0-.25-.25zM9 .25c.97 0 1.75.78 1.75 1.75v2q-.02.69-.44 1.16l1.9 3.48-1.32.72-1.97-3.61H7c-.97 0-1.75-.78-1.75-1.75V2c0-.97.78-1.75 1.75-1.75zm-2 1.5a.25.25 0 0 0-.25.25v2c0 .14.11.25.25.25h2c.14 0 .25-.11.25-.25V2A.25.25 0 0 0 9 1.75z"
      />
    </svg>
  )
}

/** Ikon Sidebar Toggle (PanelLeft) pada Navbar — 16x16 */
export function GeistPanelLeft({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6.25 2.5h8.25v10a1 1 0 0 1-1 1H6.25zM5 2.5H1.5v10a1 1 0 0 0 1 1H5zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5V1"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Tiga Titik Lingkaran (MoreHorizontal) pada baris avatar footer sidebar — 12x12 */
export function GeistMoreDots({ size = 12, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m5.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m4 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Lonceng Notifikasi (Bell) pada footer sidebar — 16x16 */
export function GeistBell({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 2.5a4 4 0 0 0-4 4v1.39q0 .3-.21.51l-.57.57-.22.22V11h10V9.19l-.22-.22-.57-.57A.7.7 0 0 1 12 7.9V6.5a4 4 0 0 0-4-4m-2.5 4a2.5 2.5 0 0 1 5 0v1.39c0 .59.24 1.16.65 1.57l.04.04H4.8l.04-.04c.41-.41.65-.98.65-1.57zm2.5 7a2.5 2.5 0 0 0 2.3-1.5H5.7A2.5 2.5 0 0 0 8 13.5"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Ikon Slash Pemisah Breadcrumb khas Vercel (docs/NAVBAR.md) — 16x16 */
export function GeistSlash({ size = 16, className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} data-slot="geist-icon" fill="none" className={className} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m4.02 15.4.3-.7 6-14 .29-.68 1.37.59-.3.69-6 14-.29.68z"
        clipRule="evenodd"
      />
    </svg>
  )
}
