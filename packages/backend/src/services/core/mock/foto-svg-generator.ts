// apps/web/src/server/services/mock/foto-svg-generator.ts
// Generator SVG Dinamis On-Demand untuk Mock Foto Lapangan PDAM Tirtawening
// Orientasi Potret (Aspect Ratio 3:4 - 600x800) agar presisi dengan bingkai panel verifikasi.
// Menggunakan Logo Resmi Perusahaan PERUMDA Tirtawening Kota Bandung.

export type JenisFotoMock = "stand" | "segel" | "rumah";

export interface MockFotoParams {
  nolg?: string;
  jenis?: JenisFotoMock | string;
  stand?: string | number;
  periode?: string;
  rute?: string;
  petugas?: string;
  nama?: string;
  alamat?: string;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function formatStandDigits(standValue?: string | number): {
  m3: string[];
  liter: string[];
} {
  const num =
    typeof standValue === "number"
      ? Math.round(standValue)
      : parseInt(String(standValue || "123"), 10);
  const safeNum = isNaN(num) ? 123 : Math.max(0, num);
  const str = String(safeNum).padStart(5, "0");
  const m3Digits = str.slice(-5).split("");
  const literDigits = ["4", "2", "0"];
  return { m3: m3Digits, liter: literDigits };
}

export function generateMockFotoSvg(params: MockFotoParams): string {
  const nolg = escapeXml(params.nolg || "01020001");
  const jenis = (params.jenis || "stand").toLowerCase() as JenisFotoMock;
  const periode = escapeXml(params.periode || "202601");
  const rute = escapeXml(params.rute || "KC304");
  const petugas = escapeXml(params.petugas || "PETUGAS CATER");
  const nama = escapeXml(params.nama || "PELANGGAN TIRTAWENING");
  const digits = formatStandDigits(params.stand);

  // Pseudo-random koordinat bandung berdasarkan NOLG
  const hash = nolg.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 100) / 1000).toFixed(4);
  const lonOffset = (((hash * 3) % 100) / 1000).toFixed(4);
  const lat = `-6.91${latOffset}`;
  const lon = `107.61${lonOffset}`;

  let visualContent = "";

  if (jenis === "segel") {
    visualContent = `
      <!-- FOTO SEGEL METER (PORTRAIT 600x800) -->
      <g transform="translate(300, 390)">
        <!-- Pipa Punggung Galvanis -->
        <rect x="-240" y="-35" width="480" height="70" rx="8" fill="#475569" stroke="#334155" stroke-width="4"/>
        <line x1="-240" y1="0" x2="240" y2="0" stroke="#64748b" stroke-width="2" stroke-dasharray="8 6"/>

        <!-- Kopling Sambungan Pipa -->
        <rect x="-130" y="-65" width="45" height="130" rx="6" fill="#64748b" stroke="#1e293b" stroke-width="3"/>
        <rect x="85" y="-65" width="45" height="130" rx="6" fill="#64748b" stroke="#1e293b" stroke-width="3"/>

        <!-- Untaian Kawat Segel Baja Berkepang -->
        <path d="M -110 -25 Q -50 -160 0 -70 T 110 -25" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="4 3"/>
        <path d="M -110 25 Q -50 160 0 70 T 110 25" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="4 3"/>

        <!-- Timah Segel Utama (Badge Segel Resmi Tirtawening) -->
        <circle cx="0" cy="0" r="105" fill="#0284c7" stroke="#38bdf8" stroke-width="7" filter="url(#dropShadow)"/>
        <circle cx="0" cy="0" r="92" fill="#0369a1" stroke="#0284c7" stroke-width="3"/>
        <circle cx="0" cy="0" r="84" fill="none" stroke="#bae6fd" stroke-width="2" stroke-dasharray="5 4"/>

        <!-- Logo Resmi di Tengah Segel -->
        <image href="/logo.png" x="-32" y="-55" width="64" height="64" preserveAspectRatio="xMidYMid meet" opacity="0.95"/>

        <!-- Teks Emboss Timah Segel -->
        <text x="0" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#f0f9ff" text-anchor="middle" letter-spacing="1.5">SEGEL RESMI</text>
        <text x="0" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="800" fill="#bae6fd" text-anchor="middle" letter-spacing="0.5">PERUMDA TIRTAWENING</text>
        <text x="0" y="66" font-family="monospace" font-size="9" font-weight="700" fill="#7dd3fc" text-anchor="middle">NO: SG-${nolg.slice(-4)}-2026</text>
      </g>

      <!-- Label Status Segel Lapangan -->
      <g transform="translate(300, 600)">
        <rect x="-190" y="-20" width="380" height="40" rx="20" fill="#059669" stroke="#10b981" stroke-width="2.5" filter="url(#dropShadow)"/>
        <text x="0" y="6" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">✓ KONDISI SEGEL AMAN &amp; TERVERIFIKASI</text>
      </g>
    `;
  } else if (jenis === "rumah") {
    visualContent = `
      <!-- FOTO RUMAH PELANGGAN (PORTRAIT 600x800) -->
      <g transform="translate(300, 380)">
        <!-- Atap Rumah -->
        <polygon points="-240,-120 0,-210 240,-120" fill="#991b1b" stroke="#7f1d1d" stroke-width="3"/>
        <polygon points="-210,-120 0,-195 210,-120" fill="#b91c1c" opacity="0.6"/>

        <!-- Dinding Utama Rumah -->
        <rect x="-220" y="-120" width="440" height="300" rx="4" fill="#334155" stroke="#1e293b" stroke-width="3"/>
        
        <!-- Pintu Rumah -->
        <rect x="-65" y="-10" width="75" height="190" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
        <circle cx="-10" cy="85" r="4.5" fill="#f1f5f9"/>
        
        <!-- Jendela Kaca -->
        <rect x="40" y="-10" width="120" height="100" rx="3" fill="#0284c7" fill-opacity="0.25" stroke="#64748b" stroke-width="2"/>
        <line x1="100" y1="-10" x2="100" y2="90" stroke="#64748b" stroke-width="2"/>
        <line x1="40" y1="40" x2="160" y2="40" stroke="#64748b" stroke-width="2"/>

        <!-- Pagar Depan & Boks Meteran -->
        <rect x="-240" y="140" width="480" height="45" fill="#475569" stroke="#334155" stroke-width="2"/>
        <line x1="-220" y1="140" x2="-220" y2="185" stroke="#64748b" stroke-width="3"/>
        <line x1="-150" y1="140" x2="-150" y2="185" stroke="#64748b" stroke-width="3"/>
        <line x1="150" y1="140" x2="150" y2="185" stroke="#64748b" stroke-width="3"/>
        <line x1="220" y1="140" x2="220" y2="185" stroke="#64748b" stroke-width="3"/>

        <!-- Boks Meter Air di Halaman Rumah -->
        <g transform="translate(-180, 95)" filter="url(#dropShadow)">
          <rect x="-40" y="-30" width="80" height="65" rx="6" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
          <rect x="-28" y="-18" width="56" height="40" rx="3" fill="#0f172a"/>
          <text x="0" y="8" font-family="monospace" font-size="11" font-weight="800" fill="#38bdf8" text-anchor="middle">METER</text>
        </g>

        <!-- Plat Nomor Rumah & Langganan Resmi -->
        <g transform="translate(130, -75)" filter="url(#dropShadow)">
          <rect x="-70" y="-25" width="140" height="50" rx="6" fill="#0f172a" stroke="#e2e8f0" stroke-width="2"/>
          <text x="0" y="-3" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">NO. ${nolg.slice(-3)}</text>
          <text x="0" y="16" font-family="monospace" font-size="10.5" font-weight="700" fill="#38bdf8" text-anchor="middle">NOLG ${nolg}</text>
        </g>
      </g>

      <!-- Label Identifikasi Lokasi Persil -->
      <g transform="translate(300, 595)">
        <rect x="-190" y="-20" width="380" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2" filter="url(#dropShadow)"/>
        <text x="0" y="5" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">LOKASI RUMAH &amp; POSISI METER TERPASANG</text>
      </g>
    `;
  } else {
    // Stand Meter (Default - Portrait 600x800)
    visualContent = `
      <!-- FOTO STAND METER (PORTRAIT 600x800) -->
      <g transform="translate(300, 375)">
        <!-- Bodi Kuningan Meter Air ISO 4064 Class B -->
        <circle cx="0" cy="0" r="195" fill="#78350f" stroke="#92400e" stroke-width="14" filter="url(#dropShadow)"/>
        <circle cx="0" cy="0" r="180" fill="#d97706" stroke="#b45309" stroke-width="4"/>
        
        <!-- Bezel Ring Biru Tirtawening -->
        <circle cx="0" cy="0" r="165" fill="#0369a1" stroke="#0284c7" stroke-width="9"/>
        
        <!-- Piringan Dial Putih Kaca -->
        <circle cx="0" cy="0" r="146" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5"/>

        <!-- Logo Resmi di Atas Dial Meteran -->
        <image href="/logo.png" x="-18" y="-136" width="36" height="36" preserveAspectRatio="xMidYMid meet" opacity="0.95"/>
        <text x="0" y="-90" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1">TIRTAWENING</text>
        <text x="0" y="-76" font-family="monospace" font-size="8.5" font-weight="700" fill="#64748b" text-anchor="middle">ISO 4064 - Qn 1.5 m³/h</text>

        <!-- Register Counter Roll Hitam & Merah (Stand Angka) -->
        <g transform="translate(0, -25)">
          <!-- Frame Box Counter -->
          <rect x="-115" y="-24" width="230" height="48" rx="5" fill="#0f172a" stroke="#334155" stroke-width="3"/>
          
          <!-- 5 Digit m3 (Hitam dengan teks Putih) -->
          ${digits.m3
            .map(
              (d, i) => `
            <g transform="translate(${-96 + i * 27}, 0)">
              <rect x="-11" y="-18" width="24" height="36" rx="2" fill="#18181b"/>
              <line x1="-11" y1="0" x2="13" y2="0" stroke="#27272a" stroke-width="1"/>
              <text x="1" y="8" font-family="monospace, 'Courier New', monospace" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">${d}</text>
            </g>
          `
            )
            .join("")}

          <!-- Separator m3 ke Liter -->
          <line x1="42" y1="-20" x2="42" y2="20" stroke="#dc2626" stroke-width="2.5"/>

          <!-- 3 Digit Liter (Merah dengan teks Putih) -->
          ${digits.liter
            .map(
              (d, i) => `
            <g transform="translate(${53 + i * 20}, 0)">
              <rect x="-8" y="-18" width="18" height="36" rx="2" fill="#991b1b"/>
              <text x="1" y="7" font-family="monospace" font-size="16" font-weight="900" fill="#fef2f2" text-anchor="middle">${d}</text>
            </g>
          `
            )
            .join("")}

          <!-- Label Satuan m³ -->
          <text x="0" y="38" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0284c7" text-anchor="middle">m³</text>
        </g>

        <!-- 4 Sub-Dial Jarum Pointer Liter x0.1, x0.01, x0.001, x0.0001 -->
        <g transform="translate(0, 68)">
          <!-- Dial 1 -->
          <g transform="translate(-66, 0)">
            <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="9" y2="-11" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="3" fill="#0f172a"/>
            <text x="0" y="30" font-family="monospace" font-size="8" font-weight="600" fill="#64748b" text-anchor="middle">x0.1</text>
          </g>
          <!-- Dial 2 -->
          <g transform="translate(-22, 22)">
            <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="-7" y2="-12" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="3" fill="#0f172a"/>
            <text x="0" y="30" font-family="monospace" font-size="8" font-weight="600" fill="#64748b" text-anchor="middle">x0.01</text>
          </g>
          <!-- Dial 3 -->
          <g transform="translate(22, 22)">
            <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="11" y2="5" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="3" fill="#0f172a"/>
            <text x="0" y="30" font-family="monospace" font-size="8" font-weight="600" fill="#64748b" text-anchor="middle">x0.001</text>
          </g>
          <!-- Dial 4 -->
          <g transform="translate(66, 0)">
            <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="0" y1="0" x2="-11" y2="6" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="3" fill="#0f172a"/>
            <text x="0" y="30" font-family="monospace" font-size="8" font-weight="600" fill="#64748b" text-anchor="middle">x0.0001</text>
          </g>
        </g>

        <!-- Bintang Putar Indikator Aliran (Flow Spinner) -->
        <g transform="translate(0, 24)">
          <circle cx="0" cy="0" r="10" fill="#dc2626"/>
          <path d="M 0 -9 L 2.5 -2.5 L 9 0 L 2.5 2.5 L 0 9 L -2.5 2.5 L -9 0 L -2.5 -2.5 Z" fill="#ffffff"/>
        </g>

        <!-- Nomor Seri Water Meter -->
        <text x="0" y="128" font-family="monospace" font-size="10.5" font-weight="800" fill="#334155" text-anchor="middle" letter-spacing="1.5">SN: WM2024-${nolg.slice(-4)}</text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <defs>
    <!-- Background Gradient Lapangan -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="40%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>

    <!-- Vignette Efek Kamera Mobile -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
    </radialGradient>
  </defs>

  <!-- Latar Belakang Foto Portrait -->
  <rect width="600" height="800" fill="url(#bgGrad)"/>
  
  <!-- Grid Tekstur Halus -->
  <g opacity="0.04">
    ${Array.from({ length: 20 })
      .map((_, i) => `<line x1="0" y1="${i * 40}" x2="600" y2="${i * 40}" stroke="#ffffff" stroke-width="1"/>`)
      .join("")}
    ${Array.from({ length: 15 })
      .map((_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="800" stroke="#ffffff" stroke-width="1"/>`)
      .join("")}
  </g>

  <!-- Visual Objek Utama Sesuai Kategori -->
  ${visualContent}

  <!-- Lapisan Vignette Lensa Kamera -->
  <rect width="600" height="800" fill="url(#vignette)" pointer-events="none"/>

  <!-- HEADER OVERLAY (HUD Khas Aplikasi Mobile Cater) -->
  <rect x="0" y="0" width="600" height="74" fill="#000000" fill-opacity="0.7"/>
  <g transform="translate(18, 16)">
    <!-- Logo Perusahaan Asli -->
    <image href="/logo.png" x="0" y="2" width="38" height="38" preserveAspectRatio="xMidYMid meet"/>
    
    <text x="48" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#ffffff" letter-spacing="0.5">PERUMDA TIRTAWENING</text>
    <text x="48" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#94a3b8">KOTA BANDUNG • BACA METER LAPANGAN</text>
  </g>

  <!-- Badge Kategori Foto di Kanan Atas -->
  <g transform="translate(460, 22)">
    <rect x="0" y="0" width="122" height="30" rx="15" fill="${
      jenis === "stand" ? "#0284c7" : jenis === "segel" ? "#d97706" : "#059669"
    }" fill-opacity="0.95"/>
    <text x="61" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">
      FOTO ${jenis.toUpperCase()}
    </text>
  </g>

  <!-- FOOTER TIMESTAMP & GPS STAMP (Android Camera Geotag HUD Overlay) -->
  <rect x="0" y="695" width="600" height="105" fill="#000000" fill-opacity="0.88"/>
  <line x1="0" y1="695" x2="600" y2="695" stroke="#334155" stroke-width="1.5"/>

  <!-- Info Pelanggan & Geotag GPS Lapangan -->
  <g transform="translate(20, 720)" font-family="monospace, 'Courier New', monospace" fill="#ffffff">
    <text x="0" y="0" font-size="13" font-weight="800" fill="#38bdf8">NOLG: ${nolg} | RUTE: ${rute} | PERIODE: ${periode}</text>
    <text x="0" y="18" font-size="11" font-weight="600" fill="#e2e8f0">NAMA: ${nama}</text>
    <text x="0" y="34" font-size="10.5" font-weight="500" fill="#cbd5e1">PETUGAS: ${petugas} • STAND: ${params.stand ?? "123"} m³</text>
    <text x="0" y="50" font-size="9.5" font-weight="400" fill="#94a3b8">GPS: ${lat}, ${lon} (±3.4m) • WAKTU: 2026-01-18 10:24 WIB</text>
  </g>

  <!-- Watermark Mock On-Demand -->
  <g transform="translate(580, 786)">
    <text x="0" y="0" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#64748b" text-anchor="end" opacity="0.85">
      ON-DEMAND SVG • ZERO STORAGE
    </text>
  </g>
</svg>`;
}
