import { eq, and, sql, asc, desc } from 'drizzle-orm';
import { db } from './client';
import {
  periodePenagihan,
  daftarCatat,
  pelanggan,
  caterBacaMeter,
  ruteCater,
  masterKondisiCatat,
  riwayatPemakaianHistoris,
  type ModeHitungKondisi,
} from './schema';

const UKURAN_BATCH = 1000;

export interface KondisiRowLookup {
  kodeTmss: string;
  nama: string;
  modeHitung: string;
}

export interface ResolvedKondisiPriority {
  kodeTmss: string;
  ketCatat: string;
  modeHitung: ModeHitungKondisi;
  isMismatch: boolean;
  auditNote: string | null;
}

/**
 * Resolusi kondisi catat ketika kode (Kd_kel / tmss) dan nama (Nm_Kel / ketcatat) tidak sinkron.
 * Aturan Bisnis Resmi:
 * - Gunakan prioritas kondisi non-Normal (jika salah satu kode/nama menunjuk Normal dan yang lain non-Normal, pilih non-Normal).
 * - Catat perbedaan aslinya di catatan bacaan untuk keperluan audit.
 */
export function resolveKondisiCatatWithPriority(
  rawKode: string | null | undefined,
  rawNama: string | null | undefined,
  kondisiRows: KondisiRowLookup[]
): ResolvedKondisiPriority {
  const byKode = new Map<string, KondisiRowLookup>();
  const byNama = new Map<string, KondisiRowLookup>();

  for (const k of kondisiRows) {
    byKode.set(k.kodeTmss.trim(), k);
    byNama.set(k.nama.trim().toUpperCase(), k);
  }

  const kodeTrim = (rawKode ?? '').trim();
  const namaTrim = (rawNama ?? '').trim();
  const namaUpper = namaTrim.toUpperCase();

  const fromKode = byKode.get(kodeTrim) ?? (kodeTrim === '' ? byKode.get(' ') ?? byKode.get('-') : undefined);
  const fromNama = namaUpper ? byNama.get(namaUpper) : undefined;

  const isNormal = (item?: KondisiRowLookup) =>
    !item ||
    item.nama.trim().toUpperCase() === 'NORMAL' ||
    item.kodeTmss.trim() === '' ||
    item.kodeTmss.trim() === '-';

  if (fromKode && fromNama) {
    if (fromKode.nama.trim().toUpperCase() === fromNama.nama.trim().toUpperCase()) {
      return {
        kodeTmss: fromKode.kodeTmss,
        ketCatat: fromKode.nama,
        modeHitung: fromKode.modeHitung as ModeHitungKondisi,
        isMismatch: false,
        auditNote: null,
      };
    }

    const kodeIsNormal = isNormal(fromKode);
    const namaIsNormal = isNormal(fromNama);
    // Prioritaskan kondisi non-Normal
    const chosen = !namaIsNormal ? fromNama : !kodeIsNormal ? fromKode : fromNama;

    return {
      kodeTmss: chosen.kodeTmss,
      ketCatat: chosen.nama,
      modeHitung: chosen.modeHitung as ModeHitungKondisi,
      isMismatch: true,
      auditNote: `[AUDIT_KONDISI] Kode '${kodeTrim || ' '}' (${fromKode.nama}) != Nama '${namaTrim}' (${fromNama.nama}); diprioritaskan kondisi non-Normal '${chosen.kodeTmss.trim() || '-'} | ${chosen.nama}'`,
    };
  }

  const fallback = fromNama ?? fromKode;
  if (fallback) {
    return {
      kodeTmss: fallback.kodeTmss,
      ketCatat: fallback.nama,
      modeHitung: fallback.modeHitung as ModeHitungKondisi,
      isMismatch: false,
      auditNote: null,
    };
  }

  return {
    kodeTmss: kodeTrim || ' ',
    ketCatat: namaTrim || 'Normal',
    modeHitung: 'SELISIH_FISIK',
    isMismatch: false,
    auditNote: null,
  };
}

/**
 * Menghitung periode berikutnya (N+1) dari string YYYYMM secara dinamis & aman lintas tahun
 * Contoh: '202610' -> '202611', '202612' -> '202701'
 */
export function nextPeriode(thbl: string): string {
  if (!thbl || thbl.length !== 6) {
    throw new Error(`Format periode THBL tidak valid: '${thbl}' (harus YYYYMM).`);
  }
  const year = parseInt(thbl.slice(0, 4), 10);
  const month = parseInt(thbl.slice(4, 6), 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Nilai tahun/bulan periode tidak valid: '${thbl}'.`);
  }
  if (month === 12) {
    return `${year + 1}01`;
  }
  return `${year}${String(month + 1).padStart(2, '0')}`;
}

/**
 * Menghitung periode sebelumnya (N-1) dari string YYYYMM secara dinamis & aman lintas tahun
 * Contoh: '202611' -> '202610', '202701' -> '202612'
 */
export function prevPeriode(thbl: string): string {
  if (!thbl || thbl.length !== 6) {
    throw new Error(`Format periode THBL tidak valid: '${thbl}' (harus YYYYMM).`);
  }
  const year = parseInt(thbl.slice(0, 4), 10);
  const month = parseInt(thbl.slice(4, 6), 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Nilai tahun/bulan periode tidak valid: '${thbl}'.`);
  }
  if (month === 1) {
    return `${year - 1}12`;
  }
  return `${year}${String(month - 1).padStart(2, '0')}`;
}

/**
 * Mengambil periode aktif (status = 'BERJALAN') dari database (tanpa hardcode bulan/tahun).
 * Jika semua periode berstatus 'TERKUNCI', mengembalikan periode terbaru di tabel periode_penagihan.
 */
export async function getActivePeriode(database: typeof db = db): Promise<string> {
  const [berjalan] = await database
    .select({ periode: periodePenagihan.periode })
    .from(periodePenagihan)
    .where(eq(periodePenagihan.status, 'BERJALAN'))
    .orderBy(desc(periodePenagihan.periode))
    .limit(1);

  if (berjalan?.periode) {
    return berjalan.periode;
  }

  const [terbaru] = await database
    .select({ periode: periodePenagihan.periode })
    .from(periodePenagihan)
    .orderBy(desc(periodePenagihan.periode))
    .limit(1);

  if (terbaru?.periode) {
    return terbaru.periode;
  }

  const [fromDpm] = await database
    .select({ periode: sql<string>`max(${daftarCatat.periode})` })
    .from(daftarCatat);

  if (fromDpm?.periode) {
    return fromDpm.periode;
  }

  const [fromCater] = await database
    .select({ periode: sql<string>`max(${caterBacaMeter.thbl})` })
    .from(caterBacaMeter);

  if (fromCater?.periode) {
    return fromCater.periode;
  }

  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Mengambil periode terkunci (closed) terakhir dari database
 */
export async function getLastClosedPeriode(database: typeof db = db): Promise<string> {
  const [terkunci] = await database
    .select({ periode: periodePenagihan.periode })
    .from(periodePenagihan)
    .where(eq(periodePenagihan.status, 'TERKUNCI'))
    .orderBy(desc(periodePenagihan.periode))
    .limit(1);

  if (terkunci?.periode) {
    return terkunci.periode;
  }

  const active = await getActivePeriode(database);
  return prevPeriode(active);
}

export interface CarryForwardPeriodeInput {
  periodeLalu: string;
  periodeBaru: string;
  userId?: string | null;
}

export interface CarryForwardPeriodeResult {
  periodeLalu: string;
  periodeBaru: string;
  totalDpmDiterbitkan: number;
  dilewatiDicabut: number;
}

/**
 * SATU MEKANISME CARRY-FORWARD TUNGGAL (Dipakai bersama oleh Seed dan Proses Closing / Buka Bulan Baru)
 *
 * Aturan Bisnis Resmi:
 * 1. Periode lalu (N) harus berstatus 'TERKUNCI'.
 * 2. Membuka periode baru (N+1) dengan status 'BERJALAN', total_m3 = NULL, total_tagihan = NULL.
 * 3. Pelanggan yang berstatus 'DICABUT' atau bacaan terakhirnya ket_catat = 'DICABUT' / tmss = 'D'
 *    ATAU daftar_catat(N).status = 'DICABUT' dilewati dari DPM periode baru (N+1).
 * 4. Untuk seluruh pelanggan aktif lainnya:
 *    - stand_awal(N+1) = COALESCE(stma_revisi, stma) dari bacaan periode N
 *      (fallback ke daftar_catat(N).stand_awal jika bulan N terlewat/belum terbaca, fallback ke stand terakhir historis).
 *    - pakai_lalu(N+1) = COALESCE(pakai_tagih, pakai_m3_revisi, pakai_m3) dari bacaan periode N
 *      (fallback ke daftar_catat(N).pakai_lalu).
 *    - urutan(N+1) = diwarisi dari master pelanggan.no_urut_rute (atau daftar_catat(N).urutan).
 *    - petugas_id(N+1) = daftar_catat(N).petugas_id ?? rute_cater.pencatat_default.
 * 5. Idempoten: Aman dijalankan berulang tanpa membuat duplikat.
 */
export async function carryForwardPeriode(
  input: CarryForwardPeriodeInput,
  database: typeof db = db
): Promise<CarryForwardPeriodeResult> {
  const { periodeLalu, periodeBaru, userId = null } = input;

  // 1. Validasi periodeLalu wajib sudah TERKUNCI
  const [periodeLaluRow] = await database
    .select()
    .from(periodePenagihan)
    .where(eq(periodePenagihan.periode, periodeLalu));

  if (!periodeLaluRow || periodeLaluRow.status !== 'TERKUNCI') {
    throw new Error(
      `Jadwal bulan baru ${periodeBaru} belum dapat dibuka karena periode sebelumnya (${periodeLalu}) belum dikunci (status saat ini: ${periodeLaluRow?.status ?? 'BELUM_ADA'}).`
    );
  }

  // 2. Validasi periodeBaru belum pernah TERKUNCI
  const [existingPeriodeBaru] = await database
    .select()
    .from(periodePenagihan)
    .where(eq(periodePenagihan.periode, periodeBaru));

  if (existingPeriodeBaru && existingPeriodeBaru.status === 'TERKUNCI') {
    throw new Error(
      `Periode ${periodeBaru} sudah pernah ditutup dan berstatus TERKUNCI. Tidak ada data yang diubah.`
    );
  }

  // 3. Muat data master pelanggan, rute, kondisi catat, DPM periodeLalu, dan bacaan meter periodeLalu
  const [masterRows, kondisiRows, dpmLaluRows, caterLaluRows, priorCaterCountRes, infolangPhysRows] = await Promise.all([
    database
      .select({
        nolg: pelanggan.nolg,
        status: pelanggan.status,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        pencatatDefault: ruteCater.pencatatDefault,
      })
      .from(pelanggan)
      .leftJoin(ruteCater, eq(pelanggan.ruteKode, ruteCater.kode))
      .orderBy(asc(pelanggan.ruteKode), asc(pelanggan.noUrutRute), asc(pelanggan.nolg)),
    database
      .select({
        kodeTmss: masterKondisiCatat.kodeTmss,
        nama: masterKondisiCatat.nama,
        modeHitung: masterKondisiCatat.modeHitung,
      })
      .from(masterKondisiCatat),
    database
      .select({
        nolg: daftarCatat.nolg,
        ruteKode: daftarCatat.ruteKode,
        petugasId: daftarCatat.petugasId,
        urutan: daftarCatat.urutan,
        standAwal: daftarCatat.standAwal,
        pakaiLalu: daftarCatat.pakaiLalu,
        akumulasiTaksasiM3: daftarCatat.akumulasiTaksasiM3,
        akumulasiPerluVerifikasi: daftarCatat.akumulasiPerluVerifikasi,
        status: daftarCatat.status,
      })
      .from(daftarCatat)
      .where(eq(daftarCatat.periode, periodeLalu)),
    database
      .select({
        nolg: caterBacaMeter.nolg,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        stmaRevisi: caterBacaMeter.stmaRevisi,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        tmss: caterBacaMeter.tmss,
        ketCatat: caterBacaMeter.ketCatat,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, periodeLalu)),
    database
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .where(sql`${caterBacaMeter.thbl} < ${periodeLalu}`),
    database
      .select({ nolg: riwayatPemakaianHistoris.nolg })
      .from(riwayatPemakaianHistoris)
      .where(
        and(
          sql`${riwayatPemakaianHistoris.periode} <= ${periodeLalu}`,
          eq(riwayatPemakaianHistoris.isTaksasi, false)
        )
      ),
  ]);

  const hasPriorCaterPeriod = (priorCaterCountRes[0]?.count ?? 0) > 0;
  const verifiedInfolangNolgs = new Set(infolangPhysRows.map((r) => r.nolg));

  const dpmLaluMap = new Map(dpmLaluRows.map((d) => [d.nolg, d]));
  const caterLaluMap = new Map(caterLaluRows.map((c) => [c.nolg, c]));

  // Jika ada pelanggan yang tidak punya bacaan di periodeLalu dan tidak punya standAwal di dpmLalu,
  // ambil bacaan historis terakhir sebelum periodeBaru.
  const missingStandNolgs = masterRows
    .filter((m) => !caterLaluMap.has(m.nolg) && !dpmLaluMap.has(m.nolg))
    .map((m) => m.nolg);

  const fallbackHistMap = new Map<string, { stma: string; pakai: string }>();
  if (missingStandNolgs.length > 0) {
    const histRows = await database.execute(sql`
      SELECT DISTINCT ON (nolg)
        nolg,
        COALESCE(stma_revisi, stma, '0')::text AS stma_akhir,
        COALESCE(pakai_tagih, pakai_m3_revisi, pakai_m3, '0')::text AS pakai_akhir
      FROM cater_baca_meter
      WHERE thbl < ${periodeBaru}
      ORDER BY nolg, thbl DESC
    `);
    for (const r of histRows as any[]) {
      fallbackHistMap.set(String(r.nolg), {
        stma: String(r.stma_akhir ?? '0'),
        pakai: String(r.pakai_akhir ?? '0'),
      });
    }
  }

  const targetDpmRows: Array<{
    id: string;
    periode: string;
    nolg: string;
    ruteKode: string | null;
    petugasId: string | null;
    urutan: number;
    standAwal: string;
    pakaiLalu: string;
    akumulasiTaksasiM3: string;
    akumulasiPerluVerifikasi: boolean;
    sumber: 'CARRY_OVER';
    status: 'BELUM_DICATAT';
  }> = [];

  let dilewatiDicabut = 0;

  for (const m of masterRows) {
    const dpmLalu = dpmLaluMap.get(m.nolg);
    const caterLalu = caterLaluMap.get(m.nolg);

    const isDicabutMaster = m.status === 'DICABUT';
    const isDicabutDpm = dpmLalu?.status === 'DICABUT';
    const isDicabutCater =
      caterLalu?.ketCatat === 'DICABUT' || caterLalu?.tmss?.trim() === 'D';

    if (isDicabutMaster || isDicabutDpm || isDicabutCater) {
      dilewatiDicabut++;
      continue;
    }

    // Carry-forward stand_awal = stand_akhir periodeLalu & hitung akumulasi_taksasi_m3 kumulatif
    let standAwalBaru = '0';
    let pakaiLaluBaru = '0';
    let akumulasiTaksasiBaru = '0.00';
    let akumulasiPerluVerifikasiBaru = false;
    const prevAkumulasi = Number(dpmLalu?.akumulasiTaksasiM3 ?? 0);
    const prevPerluVerifikasi = Boolean(dpmLalu?.akumulasiPerluVerifikasi ?? false);

    if (caterLalu) {
      const stmlNum = Number(caterLalu.stml ?? 0);
      const stmaNum = Number(caterLalu.stmaRevisi ?? caterLalu.stma ?? 0);
      const pakaiNum = Number(
        caterLalu.pakaiTagih ?? caterLalu.pakaiM3Revisi ?? caterLalu.pakaiM3 ?? 0
      );
      standAwalBaru = String(caterLalu.stmaRevisi ?? caterLalu.stma ?? '0');
      pakaiLaluBaru = String(
        caterLalu.pakaiTagih ?? caterLalu.pakaiM3Revisi ?? caterLalu.pakaiM3 ?? '0'
      );

      const resolvedKondisi = resolveKondisiCatatWithPriority(
        caterLalu.tmss,
        caterLalu.ketCatat,
        kondisiRows
      );
      const modeKondisi = resolvedKondisi.modeHitung;

      // 1. Jika di periodeLalu berstatus M | KELEBIHAN (mode_hitung === 'KREDIT_TAKSASI'):
      //    akumulasi_taksasi_m3 dikurangi sebesar selisih fisik (max(0, stma - stml)), sisanya dibawa ke periode berikutnya.
      // 2. Jika di periodeLalu pelanggan ditaksir (stma == stml dan pakai > 0):
      //    tambahkan pemakaian taksasi bulan tersebut secara KUMULATIF ke akumulasi_taksasi_m3.
      // 3. Sebaliknya jika di periodeLalu meter terbaca fisik (stma != stml), maka akumulasi di-reset ke 0!
      if (modeKondisi === 'KREDIT_TAKSASI') {
        const selisihFisik = Math.max(0, stmaNum - stmlNum);
        akumulasiTaksasiBaru = Math.max(0, prevAkumulasi - selisihFisik).toFixed(2);
      } else if (stmaNum === stmlNum && pakaiNum > 0) {
        akumulasiTaksasiBaru = (prevAkumulasi + pakaiNum).toFixed(2);
      } else {
        akumulasiTaksasiBaru = '0.00';
      }
    } else if (dpmLalu) {
      // Bulan terlewat (tidak ada pembacaan di periodeLalu): stand_awal & akumulasi_taksasi_m3 tetap dibawa
      standAwalBaru = String(dpmLalu.standAwal ?? '0');
      pakaiLaluBaru = String(dpmLalu.pakaiLalu ?? '0');
      akumulasiTaksasiBaru = prevAkumulasi.toFixed(2);
    } else if (fallbackHistMap.has(m.nolg)) {
      const hist = fallbackHistMap.get(m.nolg)!;
      standAwalBaru = hist.stma;
      pakaiLaluBaru = hist.pakai;
      akumulasiTaksasiBaru = '0.00';
    }

    // Penentuan akumulasi_perlu_verifikasi:
    // Jika akumulasiTaksasiBaru > 0, tandai perlu verifikasi apabila:
    // - periodeLalu sudah membawa flag akumulasiPerluVerifikasi = true, ATAU
    // - periodeLalu adalah periode awal (tidak ada periode cater sebelumnya) dan belum ada pembacaan fisik terverifikasi di infolang
    if (Number(akumulasiTaksasiBaru) > 0) {
      if (prevPerluVerifikasi) {
        akumulasiPerluVerifikasiBaru = true;
      } else if (!hasPriorCaterPeriod && !verifiedInfolangNolgs.has(m.nolg)) {
        akumulasiPerluVerifikasiBaru = true;
      }
    }

    const ruteKode = m.ruteKode ?? dpmLalu?.ruteKode ?? null;
    const petugasId = m.pencatatDefault ?? dpmLalu?.petugasId ?? null;
    const urutan =
      m.noUrutRute && m.noUrutRute > 0
        ? m.noUrutRute
        : dpmLalu?.urutan && dpmLalu.urutan > 0
          ? dpmLalu.urutan
          : 1;

    targetDpmRows.push({
      id: `dpm-${periodeBaru}-${m.nolg}`,
      periode: periodeBaru,
      nolg: m.nolg,
      ruteKode,
      petugasId,
      urutan,
      standAwal: standAwalBaru,
      pakaiLalu: pakaiLaluBaru,
      akumulasiTaksasiM3: akumulasiTaksasiBaru,
      akumulasiPerluVerifikasi: akumulasiPerluVerifikasiBaru,
      sumber: 'CARRY_OVER',
      status: 'BELUM_DICATAT',
    });
  }

  await database.transaction(async (tx) => {
    // 1. Upsert periodePenagihan(periodeBaru) dengan status BERJALAN
    await tx
      .insert(periodePenagihan)
      .values({
        periode: periodeBaru,
        status: 'BERJALAN',
        dibukaAt: new Date(),
        dibukaById: userId,
        jumlahSl: targetDpmRows.length,
        totalM3: null,
        totalTagihan: null,
      })
      .onConflictDoUpdate({
        target: periodePenagihan.periode,
        set: {
          status: 'BERJALAN',
          jumlahSl: targetDpmRows.length,
          totalM3: null,
          totalTagihan: null,
          updatedAt: new Date(),
        },
      });

    // 2. Batch upsert daftar_catat(periodeBaru)
    for (let i = 0; i < targetDpmRows.length; i += UKURAN_BATCH) {
      const batch = targetDpmRows.slice(i, i + UKURAN_BATCH);
      await tx
        .insert(daftarCatat)
        .values(batch)
        .onConflictDoUpdate({
          target: [daftarCatat.periode, daftarCatat.nolg],
          set: {
            ruteKode: sql`EXCLUDED.rute_kode`,
            petugasId: sql`EXCLUDED.petugas_id`,
            urutan: sql`CASE WHEN ${daftarCatat.urutan} > 0 THEN ${daftarCatat.urutan} ELSE EXCLUDED.urutan END`,
            standAwal: sql`EXCLUDED.stand_awal`,
            pakaiLalu: sql`EXCLUDED.pakai_lalu`,
            akumulasiTaksasiM3: sql`EXCLUDED.akumulasi_taksasi_m3`,
            akumulasiPerluVerifikasi: sql`EXCLUDED.akumulasi_perlu_verifikasi`,
            updatedAt: new Date(),
          },
        });
    }
  });

  return {
    periodeLalu,
    periodeBaru,
    totalDpmDiterbitkan: targetDpmRows.length,
    dilewatiDicabut,
  };
}

/**
 * Jalur Resmi Sambung Kembali (Reaktivasi Pelanggan DICABUT -> PELANGGAN AKTIF)
 * Mengubah status pelanggan menjadi 'PELANGGAN AKTIF' dan langsung memasukkan pelanggan
 * ke DPM (daftar_catat) periode yang sedang BERJALAN dengan stand_awal = stand_akhir terakhir yang tercatat.
 */
export async function sambungKembaliPelanggan(
  input: { nolg: string; periodeAktif?: string; catatan?: string },
  database: typeof db = db
) {
  const { nolg, catatan } = input;
  const targetPeriode = input.periodeAktif || (await getActivePeriode(database));

  const [cust] = await database
    .select({
      nolg: pelanggan.nolg,
      nama: pelanggan.nama,
      status: pelanggan.status,
      ruteKode: pelanggan.ruteKode,
      noUrutRute: pelanggan.noUrutRute,
      pencatatDefault: ruteCater.pencatatDefault,
    })
    .from(pelanggan)
    .leftJoin(ruteCater, eq(pelanggan.ruteKode, ruteCater.kode))
    .where(eq(pelanggan.nolg, nolg));

  if (!cust) {
    throw new Error(`Pelanggan dengan nomor langganan ${nolg} tidak ditemukan.`);
  }

  // Ambil stand akhir terakhir yang tercatat di cater_baca_meter
  const [lastReading] = await database
    .select({
      thbl: caterBacaMeter.thbl,
      stma: caterBacaMeter.stma,
      stmaRevisi: caterBacaMeter.stmaRevisi,
      pakaiM3: caterBacaMeter.pakaiM3,
      pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
      pakaiTagih: caterBacaMeter.pakaiTagih,
    })
    .from(caterBacaMeter)
    .where(eq(caterBacaMeter.nolg, nolg))
    .orderBy(desc(caterBacaMeter.thbl))
    .limit(1);

  const standAwal = String(lastReading?.stmaRevisi ?? lastReading?.stma ?? '0');
  const pakaiLalu = String(
    lastReading?.pakaiTagih ?? lastReading?.pakaiM3Revisi ?? lastReading?.pakaiM3 ?? '0'
  );

  await database.transaction(async (tx) => {
    // 1. Update status master pelanggan menjadi PELANGGAN AKTIF
    await tx
      .update(pelanggan)
      .set({
        status: 'PELANGGAN AKTIF',
        catatanVerifikasi: catatan
          ? `[SAMBUNG KEMBALI ${targetPeriode}] ${catatan}`
          : `[SAMBUNG KEMBALI ${targetPeriode}] Diaktifkan kembali dari status ${cust.status}`,
        updatedAt: new Date(),
      })
      .where(eq(pelanggan.nolg, nolg));

    // 2. Masukkan atau aktifkan di daftar_catat periode yang sedang open (BERJALAN)
    await tx
      .insert(daftarCatat)
      .values({
        id: `dpm-${targetPeriode}-${nolg}`,
        periode: targetPeriode,
        nolg,
        ruteKode: cust.ruteKode,
        petugasId: cust.pencatatDefault ?? null,
        urutan: cust.noUrutRute && cust.noUrutRute > 0 ? cust.noUrutRute : 1,
        standAwal,
        pakaiLalu,
        sumber: 'MANUAL',
        status: 'BELUM_DICATAT',
        catatan: catatan || `Sambung kembali pada periode ${targetPeriode}`,
      })
      .onConflictDoUpdate({
        target: [daftarCatat.periode, daftarCatat.nolg],
        set: {
          status: 'BELUM_DICATAT',
          standAwal,
          pakaiLalu,
          catatan: catatan || `Sambung kembali pada periode ${targetPeriode}`,
          updatedAt: new Date(),
        },
      });

    // 3. Sinkronkan jumlah_sl pada periodePenagihan(targetPeriode)
    const [dpmCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(daftarCatat)
      .where(and(eq(daftarCatat.periode, targetPeriode), sql`${daftarCatat.status} != 'DICABUT'`));

    await tx
      .update(periodePenagihan)
      .set({
        jumlahSl: dpmCount?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(periodePenagihan.periode, targetPeriode));
  });

  return {
    nolg,
    nama: cust.nama,
    periode: targetPeriode,
    statusBaru: 'PELANGGAN AKTIF',
    standAwal: Number(standAwal),
    pakaiLalu: Number(pakaiLalu),
    referensiPeriodeTerakhir: lastReading?.thbl ?? null,
  };
}
