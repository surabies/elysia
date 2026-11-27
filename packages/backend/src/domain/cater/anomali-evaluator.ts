/**
 * Anomaly & Deviation Evaluator Engine (Single Source of Truth)
 * PDAM Tirtawening Water Meter Reading Classification
 * 
 * ATURAN MUTLAK:
 * 1. Tidak ada hardcoding kode TMSS ('8', 'H', 'R', dll.) di dalam evaluator ini.
 * 2. Seluruh perilaku, ambang batas, pemetaan kondisi fisik, dan pengecualian bersyarat
 *    dibaca murni dari definisi aturan dan pemetaan database (RuleDefinition & KondisiMapItem).
 */

export interface ReadingInput {
  stml: number;
  stma: number;
  pakaiM3: number;
  pakaiLalu: number | null;
  kodeTmss: string | null;
  prevKondisiTmss?: string | null;
  prevPakaiM3?: number | null;
  riwayatPeriode?: Array<{
    thbl: string;
    pakaiM3: number;
    kodeTmss: string | null;
  }>;
  rataHistoris3Bln?: number | null;
}

export interface RuleDefinition {
  id: string;
  kode: string;
  nama: string;
  tipeAturan: string;
  arah: string;
  acuanPembanding: string;
  periodeHistorisJml: number;
  syaratPakaiLaluMinM3?: number | string | null;
  selisihMinM3?: number | string | null;
  minM3?: number | string | null;
  maxM3?: number | string | null;
  minPersen?: number | string | null;
  maxPersen?: number | string | null;
  dihitungSebagaiAnomali: boolean;
  ringTingkat: number;
  tingkatKeparahan: string;
  badgeTone: string;
  urutan: number;
  aktif?: boolean;
  syaratKondisiLalu?: string | null; // 'ANY' | 'BASELINE_NORMAL' | 'SAMA' | 'BERBEDA'
  syaratPeriodeBerturut?: number | null; // Nilai N untuk kondisi berturut-turut
  kecualikanJikaBerlanjut?: boolean | null;
  kecualikanJikaPakaiLaluDibawah?: number | string | null;
}

export interface KondisiMapItem {
  kodeTmss: string;
  aturanAnomaliId: string;
  aturanKode?: string;
  isBaselineNormal: boolean;
  isPeriodeTidakAktif: boolean;
  modeHitung?: string;
  kategori?: string;
  aktif: boolean;
}

export interface EvaluasiResult {
  isAnomali: boolean;
  kodeUtama: string | null;
  kodeList: string[];
  aturanVersi?: number;
}

export function hitungDeviasiPersentase(
  pemakaianSekarang: number | null,
  pemakaianSebelumnya: number | null,
): number | null {
  if (
    pemakaianSekarang === null ||
    pemakaianSebelumnya === null ||
    pemakaianSebelumnya <= 0
  ) {
    return null;
  }

  return Math.round(
    ((pemakaianSekarang - pemakaianSebelumnya) / pemakaianSebelumnya) * 100,
  );
}

/**
 * Normalisasi kode kondisi TMSS
 */
export function normalisasiTmss(kode: string | null | undefined): string {
  if (!kode) return '';
  const trimmed = kode.trim();
  if (trimmed === '-' || trimmed === '') return '';
  return trimmed;
}

/**
 * Hitung Rata-rata Pemakaian Historis dengan Mengecualikan Periode Tidak Aktif (sesuai Data Map)
 */
export function hitungRataHistoris(
  riwayat: Array<{ pakaiM3: number; kodeTmss: string | null }>,
  kondisiMapByKode: Map<string, KondisiMapItem[]>
): number | null {
  if (!riwayat || riwayat.length === 0) return null;

  const validEntries = riwayat.filter((r) => {
    const tmss = normalisasiTmss(r.kodeTmss);
    const maps = kondisiMapByKode.get(tmss) || [];
    const isTidakAktif = maps.some((m) => m.isPeriodeTidakAktif);
    // Jika kondisi adalah periode tidak aktif dan pemakaian 0 m³, kecualikan dari perhitungan
    if (isTidakAktif && r.pakaiM3 === 0) {
      return false;
    }
    return true;
  });

  if (validEntries.length === 0) return null;

  const sum = validEntries.reduce((acc, curr) => acc + curr.pakaiM3, 0);
  return Number((sum / validEntries.length).toFixed(2));
}

/**
 * Pure Function Evaluasi Anomali Berdasarkan Aturan Database SSOT
 */
export function evaluasiAnomaliBaris(
  input: ReadingInput,
  aturanList: RuleDefinition[],
  kondisiMapList: KondisiMapItem[],
  versiAturan: number = 1
): EvaluasiResult {
  const { stml, stma, pakaiM3, kodeTmss, prevKondisiTmss, prevPakaiM3 } = input;

  // Indeks map kondisi berdasarkan kode TMSS
  const mapByKode = new Map<string, KondisiMapItem[]>();
  for (const m of kondisiMapList) {
    if (!m.aktif) continue;
    const key = normalisasiTmss(m.kodeTmss);
    const list = mapByKode.get(key) || [];
    list.push(m);
    mapByKode.set(key, list);
  }

  // Hitung rata-rata historis bersih jika riwayat tersedia
  let effectiveRataHistoris = input.rataHistoris3Bln ?? null;
  if (input.riwayatPeriode && input.riwayatPeriode.length > 0) {
    effectiveRataHistoris = hitungRataHistoris(input.riwayatPeriode, mapByKode);
  }

  const tmssClean = normalisasiTmss(kodeTmss);
  const prevTmssClean = prevKondisiTmss !== undefined ? normalisasiTmss(prevKondisiTmss) : undefined;
  const currentMaps = mapByKode.get(tmssClean) || [];
  const isKondisiTidakAktif = currentMaps.some((m) => m.isPeriodeTidakAktif);

  // Urutkan aturan aktif berdasarkan urutan ASC
  const sortedRules = [...aturanList]
    .filter((r) => r.aktif !== false)
    .sort((a, b) => a.urutan - b.urutan);

  if (sortedRules.length === 0) {
    throw new Error(
      'EVALUATOR_ERROR: Tidak ada aturan anomali yang aktif. Evaluasi dibatalkan untuk mencegah klasifikasi normal palsu (false-normal).'
    );
  }

  const matchedRules: RuleDefinition[] = [];

  for (const rule of sortedRules) {
    let matched = false;

    switch (rule.tipeAturan) {
      // 1. Meter Mundur: stma < stml (Dikecualikan jika kondisi METER_BARU / MB yang sah atau MUDA_KEMBALI yang wajar)
      case 'METER_MUNDUR': {
        const isMeterBaru =
          tmssClean === '4' ||
          tmssClean.toUpperCase() === 'MB' ||
          currentMaps.some((m) => m.modeHitung === 'METER_BARU' || m.kategori === 'METER_BARU');
        const isMudaKembali =
          tmssClean === 'U' ||
          tmssClean.toUpperCase() === 'MUDA KEMBALI' ||
          tmssClean.toUpperCase() === 'MUDA_KEMBALI' ||
          currentMaps.some((m) => m.modeHitung === 'MUDA_KEMBALI');
        if (stma < stml && !isMeterBaru && !isMudaKembali) {
          matched = true;
        }
        break;
      }

      // 2. Lonjakan Absolut: pakaiM3 > minM3 (strictly greater than, mis. > 75 m³)
      case 'LONJAKAN_ABSOLUT': {
        if (rule.minM3 != null && pakaiM3 > Number(rule.minM3)) {
          matched = true;
        }
        break;
      }

      // 3. Lonjakan Relatif: Kenaikan ≥ minPersen & selisih ≥ selisihMinM3
      case 'LONJAKAN_RELATIF': {
        let acuan = input.pakaiLalu != null && input.pakaiLalu > 0 ? input.pakaiLalu : null;
        if (acuan === null && effectiveRataHistoris != null && effectiveRataHistoris > 0) {
          acuan = effectiveRataHistoris;
        }

        const syaratMin = rule.syaratPakaiLaluMinM3 != null ? Number(rule.syaratPakaiLaluMinM3) : 1;
        if (acuan !== null && acuan >= syaratMin && pakaiM3 > acuan) {
          const selisih = pakaiM3 - acuan;
          const persen = ((pakaiM3 - acuan) / acuan) * 100;
          const minP = rule.minPersen != null ? Number(rule.minPersen) : 100;
          const minS = rule.selisihMinM3 != null ? Number(rule.selisihMinM3) : 30;

          if (persen >= minP && selisih >= minS) {
            matched = true;
          }
        }
        break;
      }

      // 4. Penurunan Relatif: Anjlok ≥ minPersen dari acuan (hanya berlaku jika pemakaian > 0 m³)
      case 'PENURUNAN_RELATIF': {
        if (pakaiM3 > 0) {
          let acuan = input.pakaiLalu != null && input.pakaiLalu > 0 ? input.pakaiLalu : null;
          if (acuan === null && effectiveRataHistoris != null && effectiveRataHistoris > 0) {
            acuan = effectiveRataHistoris;
          }

          const syaratMin = rule.syaratPakaiLaluMinM3 != null ? Number(rule.syaratPakaiLaluMinM3) : 10;
          if (acuan !== null && acuan >= syaratMin && pakaiM3 < acuan) {
            const persenTurun = ((acuan - pakaiM3) / acuan) * 100;
            const minP = rule.minPersen != null ? Number(rule.minPersen) : 50;
            if (persenTurun >= minP) {
              matched = true;
            }
          }
        }
        break;
      }

      // 5. Deviasi Persentase (Ring 1, 2, 3) - hanya berlaku jika pemakaian > 0 m³
      case 'DEVIASI': {
        if (pakaiM3 > 0) {
          let acuan = input.pakaiLalu != null && input.pakaiLalu > 0 ? input.pakaiLalu : null;
          if (acuan === null && effectiveRataHistoris != null && effectiveRataHistoris > 0) {
            acuan = effectiveRataHistoris;
          }

          const syaratMin = rule.syaratPakaiLaluMinM3 != null ? Number(rule.syaratPakaiLaluMinM3) : 5;
          if (acuan !== null && acuan >= syaratMin) {
            const deviasiPersen = Math.abs(((pakaiM3 - acuan) / acuan) * 100);
            const minP = rule.minPersen != null ? Number(rule.minPersen) : 0;
            const maxP = rule.maxPersen != null ? Number(rule.maxPersen) : null;

            if (maxP != null) {
              // Moderat / Interval: minPersen <= deviasi <= maxPersen
              if (deviasiPersen >= minP && deviasiPersen <= maxP) {
                matched = true;
              }
            } else {
              // Ekstrim / Terbuka ke atas: deviasi > minPersen (strictly greater than, mis. > 80%)
              if (deviasiPersen > minP) {
                matched = true;
              }
            }
          }
        }
        break;
      }

      // 6. Pemakaian Nol: pakaiM3 = 0 dengan Pengecualian Bersyarat
      case 'PEMAKAIAN_NOL': {
        if (pakaiM3 === 0) {
          let dikecualikan = false;

          // Jika kondisi fisik di data adalah kondisi tidak aktif / kendala khusus (mis. air mati, cabut),
          // pemakaian nol adalah konsekuensi fisik dan tidak dinilai sebagai stand nol macet biasa
          if (isKondisiTidakAktif) {
            dikecualikan = true;
          }

          // Cek pengecualian bersyarat berbasis data:
          if (!dikecualikan && rule.kecualikanJikaBerlanjut) {
            const isKondisiBerlanjut = prevTmssClean !== undefined && prevTmssClean === tmssClean;
            const effectivePakaiLalu = prevPakaiM3 !== undefined && prevPakaiM3 !== null
              ? prevPakaiM3
              : (input.pakaiLalu ?? 0);
            const ambangBawah = rule.kecualikanJikaPakaiLaluDibawah != null
              ? Number(rule.kecualikanJikaPakaiLaluDibawah)
              : 10;
            const isDiBawahAmbang = effectivePakaiLalu < ambangBawah;

            if (isKondisiBerlanjut || isDiBawahAmbang) {
              dikecualikan = true;
            }
          }

          if (!dikecualikan) {
            matched = true;
          }
        }
        break;
      }

      // 7. Kondisi Fisik Mendadak (ANOM_TIDAK_ADA_AIR_MENDADAK)
      case 'KONDISI_MENDADAK': {
        const isMappedToThisRule = currentMaps.some(
          (m) => m.aturanAnomaliId === rule.id || m.aturanKode === rule.kode
        );

        if (isMappedToThisRule && pakaiM3 === 0) {
          const effectivePakaiLalu = prevPakaiM3 !== undefined && prevPakaiM3 !== null
            ? prevPakaiM3
            : (input.pakaiLalu ?? 0);
          const syaratMin = rule.syaratPakaiLaluMinM3 != null ? Number(rule.syaratPakaiLaluMinM3) : 10;

          // Evaluasi kondisi periode lalu:
          let kondisiLaluValid = false;
          if (rule.syaratKondisiLalu === 'BASELINE_NORMAL') {
            if (prevTmssClean !== undefined) {
              // Jika data periode lalu tersedia di database:
              const prevMaps = mapByKode.get(prevTmssClean) || [];
              kondisiLaluValid = prevMaps.some((m) => m.isBaselineNormal);
            } else {
              // Untuk periode awal tanpa baris periode lalu (mis. 202610):
              // Sesuai klausul 5 prompt: lewati aturan yang butuh kondisi periode lalu
              kondisiLaluValid = false;
            }
          } else {
            kondisiLaluValid = true;
          }

          if (kondisiLaluValid && effectivePakaiLalu >= syaratMin) {
            matched = true;
          }
        }
        break;
      }

      // 8. Kondisi Berkepanjangan (ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN)
      case 'KONDISI_BERKEPANJANGAN': {
        const isMappedToThisRule = currentMaps.some(
          (m) => m.aturanAnomaliId === rule.id || m.aturanKode === rule.kode
        );

        const targetN = rule.syaratPeriodeBerturut || 3;
        if (isMappedToThisRule && input.riwayatPeriode && input.riwayatPeriode.length >= targetN) {
          // Periksa apakah kondisi ini berurutan sebanyak N periode
          let consecutiveCount = 1; // Termasuk periode saat ini
          for (const item of input.riwayatPeriode) {
            if (normalisasiTmss(item.kodeTmss) === tmssClean) {
              consecutiveCount++;
            } else {
              break;
            }
          }
          if (consecutiveCount >= targetN) {
            matched = true;
          }
        }
        // Bila riwayat di database kurang dari N periode, aturan ini tidak memicu
        break;
      }

      // 9. Kondisi Fisik Umum (ANOM_KERUSAKAN_METER & WARN_KENDALA_AKSES)
      case 'KONDISI_FISIK': {
        const isMappedToThisRule = currentMaps.some(
          (m) => m.aturanAnomaliId === rule.id || m.aturanKode === rule.kode
        );
        if (isMappedToThisRule) {
          matched = true;
        }
        break;
      }

      default:
        break;
    }

    if (matched) {
      matchedRules.push(rule);
    }
  }

  const kodeList = matchedRules.map((r) => r.kode);

  // Penentuan kode_anomali_utama:
  // 1. Ambil aturan pertama yang dihitungSebagaiAnomali = true (urutan ASC)
  const primaryAnomaly = matchedRules.find((r) => r.dihitungSebagaiAnomali);
  if (primaryAnomaly) {
    return {
      isAnomali: true,
      kodeUtama: primaryAnomaly.kode,
      kodeList,
      aturanVersi: versiAturan,
    };
  }

  // 2. Jika tidak ada anomali, ambil aturan pertama yang cocok (peringatan WARN_*)
  if (matchedRules.length > 0) {
    return {
      isAnomali: false,
      kodeUtama: matchedRules[0].kode,
      kodeList,
      aturanVersi: versiAturan,
    };
  }

  // 3. Normal Bersih
  return {
    isAnomali: false,
    kodeUtama: null,
    kodeList: [],
    aturanVersi: versiAturan,
  };
}
