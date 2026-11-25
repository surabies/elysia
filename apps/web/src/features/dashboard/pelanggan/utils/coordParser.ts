/**
 * Utilitas parser koordinat GPS yang tangguh untuk membaca berbagai format salinan teks:
 * - URL Google Maps (@lat,lng, query q=lat,lng, query=lat,lng, dsb.)
 * - Derajat Menit Detik (DMS): 6°54'53.1"S 107°36'35.3"E
 * - Degree Decimal Minutes (DDM): 6°54.885'S 107°36.588'E
 * - Format desimal standar: -6.914744, 107.609810
 * - Format terbalik (lng, lat): 107.609810, -6.914744 -> Otomatis ditukar (auto-swap) agar latitude valid.
 */

export interface ParsedCoordinate {
  lat: number;
  lng: number;
  format: 'url' | 'dms' | 'decimal' | 'swapped-decimal';
  originalInput: string;
}

/**
 * Konversi nilai DMS (Derajat Menit Detik) ke Desimal
 */
function parseDmsPart(dmsStr: string): number | null {
  // Contoh: 6°54'53.1"S atau 107°36'35.3"E atau 6 54 53.1 S
  const match = dmsStr.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)(?:["\s]*([NSEWnsew]))?/i);
  if (match) {
    const deg = parseFloat(match[1]!);
    const min = parseFloat(match[2]!);
    const sec = parseFloat(match[3]!);
    const dir = match[4]?.toUpperCase();

    let val = deg + min / 60 + sec / 3600;
    if (dir === 'S' || dir === 'W') {
      val = -val;
    }
    return val;
  }

  // DDM: 6°54.885'S
  const ddmMatch = dmsStr.match(/(\d+)[°\s]+([\d.]+)['\s]*(?:([NSEWnsew]))?/i);
  if (ddmMatch) {
    const deg = parseFloat(ddmMatch[1]!);
    const min = parseFloat(ddmMatch[2]!);
    const dir = ddmMatch[3]?.toUpperCase();

    let val = deg + min / 60;
    if (dir === 'S' || dir === 'W') {
      val = -val;
    }
    return val;
  }

  return null;
}

/**
 * Validasi dan auto-swap latitude & longitude jika tertukar
 */
function normalizeAndValidateCoords(
  rawLat: number,
  rawLng: number,
  format: 'url' | 'dms' | 'decimal'
): ParsedCoordinate | null {
  if (isNaN(rawLat) || isNaN(rawLng)) return null;

  let lat = rawLat;
  let lng = rawLng;
  let finalFormat: ParsedCoordinate['format'] = format;

  // Deteksi jika koordinat tertukar (lng, lat)
  // Kasus 1: Nilai lat berada di luar batas [-90, 90], tetapi lng berada di dalam batas
  // Kasus 2: Area Indonesia: Lintang (-11 s/d 6), Bujur (95 s/d 141)
  const isLatOutOfRange = Math.abs(lat) > 90 && Math.abs(lng) <= 90;
  const isLikelyIndonesiaSwapped =
    lat >= 95 && lat <= 141 && lng >= -11 && lng <= 6;

  if (isLatOutOfRange || isLikelyIndonesiaSwapped) {
    const temp = lat;
    lat = lng;
    lng = temp;
    finalFormat = 'swapped-decimal';
  }

  // Cek validitas bola bumi akhir
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat: Number(lat.toFixed(7)),
    lng: Number(lng.toFixed(7)),
    format: finalFormat,
    originalInput: '',
  };
}

export function parseClipboardCoordinates(text: string): ParsedCoordinate | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();
  if (!cleaned) return null;

  // 1. URL Google Maps: @-6.914744,107.60981
  const atMatch = cleaned.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (atMatch) {
    const res = normalizeAndValidateCoords(
      parseFloat(atMatch[1]!),
      parseFloat(atMatch[2]!),
      'url'
    );
    if (res) {
      res.originalInput = cleaned;
      return res;
    }
  }

  // 2. Query URL Google Maps: ?q=-6.914744,107.60981 atau &ll=... atau query=...
  const queryMatch = cleaned.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i);
  if (queryMatch) {
    const res = normalizeAndValidateCoords(
      parseFloat(queryMatch[1]!),
      parseFloat(queryMatch[2]!),
      'url'
    );
    if (res) {
      res.originalInput = cleaned;
      return res;
    }
  }

  // 3. Format DMS (contoh: 6°54'53.1"S 107°36'35.3"E)
  if (cleaned.includes('°') || /[NSEW]/i.test(cleaned)) {
    // Pisahkan dua bagian DMS berdasarkan koma atau pemisah arah N/S dan E/W
    const dmsParts = cleaned.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (dmsParts.length >= 2) {
      const latVal = parseDmsPart(dmsParts[0]!);
      const lngVal = parseDmsPart(dmsParts[1]!);
      if (latVal !== null && lngVal !== null) {
        const res = normalizeAndValidateCoords(latVal, lngVal, 'dms');
        if (res) {
          res.originalInput = cleaned;
          return res;
        }
      }
    } else {
      // Coba regex split antara N/S dan E/W
      const singleLineDms = cleaned.match(/(.+?[NSns])\s*(.+?[EWew])/);
      if (singleLineDms) {
        const latVal = parseDmsPart(singleLineDms[1]!);
        const lngVal = parseDmsPart(singleLineDms[2]!);
        if (latVal !== null && lngVal !== null) {
          const res = normalizeAndValidateCoords(latVal, lngVal, 'dms');
          if (res) {
            res.originalInput = cleaned;
            return res;
          }
        }
      }
    }
  }

  // 4. Standar Desimal: "lat, lng" atau "lat lng" atau "lat/lng"
  const decMatch = cleaned.match(/(-?\d+\.\d+)[,\s/;\t]+(-?\d+\.\d+)/);
  if (decMatch) {
    const res = normalizeAndValidateCoords(
      parseFloat(decMatch[1]!),
      parseFloat(decMatch[2]!),
      'decimal'
    );
    if (res) {
      res.originalInput = cleaned;
      return res;
    }
  }

  return null;
}
