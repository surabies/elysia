import { eq, sql, inArray, desc, and } from 'drizzle-orm';
import {
  db,
  aturanAnomali,
  aturanAnomaliVersi,
  aturanKondisiMeterMap,
  aturanAnomaliAuditLog,
  masterKondisiCatat,
  periodePenagihan,
  caterBacaMeter,
  type AturanAnomali,
  type NewAturanAnomali,
} from '@cater/db';
import {
  evaluasiAnomaliBaris,
  type ReadingInput,
  type RuleDefinition,
  type KondisiMapItem,
  type EvaluasiResult,
} from "@cater/backend/domain/cater/anomali-evaluator";

export interface UserContext {
  userId: string;
  nama: string;
  role: string;
}

export interface UpdateAturanInput {
  nama?: string;
  arah?: string;
  acuanPembanding?: string;
  periodeHistorisJml?: number;
  syaratPakaiLaluMinM3?: number | null;
  selisihMinM3?: number | null;
  minM3?: number | null;
  maxM3?: number | null;
  minPersen?: number | null;
  maxPersen?: number | null;
  dihitungSebagaiAnomali?: boolean;
  ringTingkat?: number;
  tingkatKeparahan?: string;
  badgeTone?: string;
  urutan?: number;
  syaratKondisiLalu?: string;
  syaratPeriodeBerturut?: number | null;
  kecualikanJikaBerlanjut?: boolean;
  kecualikanJikaPakaiLaluDibawah?: number | null;
  deskripsi?: string;
  alasan: string; // Wajib diisi untuk audit log
}

export interface PratinjauDampakResult {
  periode: string;
  totalBaris: number;
  sebelum: { anomali: number; warning: number; normal: number };
  sesudah: { anomali: number; warning: number; normal: number };
  perubahanNetto: { anomali: number; warning: number; normal: number };
  rincianPerKode: Array<{
    kode: string;
    sebelum: number;
    sesudah: number;
    selisih: number;
  }>;
  jumlahBarisBerubah: number;
}

class AturanAnomaliService {
  // In-memory cache yang diinvalidasi berdasarkan nilai max(versi) di database
  private cachedVersi: number | null = null;
  private cachedRules: RuleDefinition[] = [];
  private cachedMaps: KondisiMapItem[] = [];

  /**
   * Mengambil definisi aturan & pemetaan kondisi aktif dengan caching berbasis versi DB
   */
  async getCachedEngineContext(): Promise<{
    rules: RuleDefinition[];
    maps: KondisiMapItem[];
    versi: number;
  }> {
    // 1. Cek versi tertinggi di database
    const [latest] = await db
      .select({ maxVersi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 1)` })
      .from(aturanAnomaliVersi);

    const dbVersi = latest ? Number(latest.maxVersi) : 1;

    // 2. Jika cache valid, gunakan cache memory
    if (this.cachedVersi === dbVersi && this.cachedRules.length > 0) {
      return {
        rules: this.cachedRules,
        maps: this.cachedMaps,
        versi: dbVersi,
      };
    }

    // 3. Cache invalid / belum dimuat: Muat segar dari database
    const rules = await db.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
    const maps = await db
      .select({
        kodeTmss: aturanKondisiMeterMap.kodeTmss,
        aturanAnomaliId: aturanKondisiMeterMap.aturanAnomaliId,
        aturanKode: aturanAnomali.kode,
        isBaselineNormal: aturanKondisiMeterMap.isBaselineNormal,
        isPeriodeTidakAktif: aturanKondisiMeterMap.isPeriodeTidakAktif,
        aktif: aturanKondisiMeterMap.aktif,
      })
      .from(aturanKondisiMeterMap)
      .innerJoin(aturanAnomali, eq(aturanKondisiMeterMap.aturanAnomaliId, aturanAnomali.id))
      .where(eq(aturanKondisiMeterMap.aktif, true));

    this.cachedVersi = dbVersi;
    this.cachedRules = rules as any;
    this.cachedMaps = maps as any;

    return {
      rules: this.cachedRules,
      maps: this.cachedMaps,
      versi: dbVersi,
    };
  }

  /**
   * Ambil daftar seluruh aturan untuk dashboard / pengaturan operator (Always Fresh dari DB)
   */
  async getDaftarAturan() {
    const [latest] = await db
      .select({ maxVersi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 1)` })
      .from(aturanAnomaliVersi);
    const versi = latest ? Number(latest.maxVersi) : 1;
    const rules = await db.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);

    // Sinkronkan cache in-memory engine
    this.cachedVersi = versi;
    this.cachedRules = rules as any;

    return {
      versi,
      total: rules.length,
      data: rules,
    };
  }

  /**
   * Ambil detail satu aturan berdasarkan ID atau Kode
   */
  async getAturanById(idOrKode: string) {
    const [row] = await db
      .select()
      .from(aturanAnomali)
      .where(
        sql`${aturanAnomali.id} = ${idOrKode} OR ${aturanAnomali.kode} = ${idOrKode}`
      );
    return row || null;
  }

  /**
   * Ambil seluruh pemetaan kondisi meter (TMSS)
   */
  async getDaftarKondisiMap() {
    const maps = await db
      .select({
        id: aturanKondisiMeterMap.id,
        kodeTmss: aturanKondisiMeterMap.kodeTmss,
        namaTmss: masterKondisiCatat.nama,
        kategoriTmss: masterKondisiCatat.kategori,
        aturanId: aturanKondisiMeterMap.aturanAnomaliId,
        aturanKode: aturanAnomali.kode,
        aturanNama: aturanAnomali.nama,
        isBaselineNormal: aturanKondisiMeterMap.isBaselineNormal,
        isPeriodeTidakAktif: aturanKondisiMeterMap.isPeriodeTidakAktif,
        aktif: aturanKondisiMeterMap.aktif,
        keterangan: aturanKondisiMeterMap.keterangan,
      })
      .from(aturanKondisiMeterMap)
      .innerJoin(masterKondisiCatat, eq(aturanKondisiMeterMap.kodeTmss, masterKondisiCatat.kodeTmss))
      .innerJoin(aturanAnomali, eq(aturanKondisiMeterMap.aturanAnomaliId, aturanAnomali.id))
      .orderBy(masterKondisiCatat.kodeTmss);

    return maps;
  }

  /**
   * Ambil daftar kondisi meter yang belum terpetakan di aturan
   */
  async getKondisiBelumTerpetakan() {
    const unmapped = await db
      .select({
        kodeTmss: masterKondisiCatat.kodeTmss,
        keterangan: masterKondisiCatat.nama,
        kategori: masterKondisiCatat.kategori,
        jumlahMuncul: sql<number>`0`,
      })
      .from(masterKondisiCatat)
      .where(
        sql`${masterKondisiCatat.kodeTmss} NOT IN (
          SELECT kode_tmss FROM aturan_kondisi_meter_map WHERE aktif = true
        )`
      )
      .orderBy(masterKondisiCatat.kodeTmss);

    return unmapped;
  }

  /**
   * Ambil riwayat versi dan snapshot aturan
   */
  async getRiwayatVersi() {
    return await db
      .select()
      .from(aturanAnomaliVersi)
      .orderBy(desc(aturanAnomaliVersi.versi));
  }

  /**
   * Ambil audit log perubahan operator
   */
  async getAuditLog(limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(aturanAnomaliAuditLog)
      .orderBy(desc(aturanAnomaliAuditLog.waktu))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Pratinjau Dampak Perubahan Aturan (Dry-Run / Preview Tanpa Menulis ke DB)
   */
  async pratinjauDampak(
    aturanId: string,
    perubahan: Partial<RuleDefinition>,
    targetPeriode?: string
  ): Promise<PratinjauDampakResult> {
    const { rules, maps, versi } = await this.getCachedEngineContext();

    // 1. Tentukan periode yang akan diuji (periode berjalan yang belum closing atau periode yang memiliki data)
    let per = targetPeriode;
    if (!per) {
      const [openPer] = await db
        .select({ periode: periodePenagihan.periode })
        .from(periodePenagihan)
        .where(eq(periodePenagihan.status, 'BERJALAN'))
        .orderBy(desc(periodePenagihan.periode))
        .limit(1);

      if (openPer) {
        // Periksa apakah periode berjalan sudah memiliki pembacaan meter
        const [hasData] = await db
          .select({ cnt: sql<number>`count(*)` })
          .from(caterBacaMeter)
          .where(eq(caterBacaMeter.thbl, openPer.periode));

        if (Number(hasData?.cnt || 0) > 0) {
          per = openPer.periode;
        }
      }

      if (!per) {
        // Fallback ke periode terbesar di cater_baca_meter yang memiliki data
        const [maxCater] = await db
          .select({ thbl: caterBacaMeter.thbl })
          .from(caterBacaMeter)
          .orderBy(desc(caterBacaMeter.thbl))
          .limit(1);
        per = maxCater?.thbl || '202610';
      }
    }

    // 2. Siapkan ruleset simulasi
    const simulatedRules = rules.map((r) => {
      if (r.id === aturanId || r.kode === aturanId) {
        return { ...r, ...perubahan };
      }
      return r;
    });

    // 3. Muat data periode berjalan beserta data bulan lalu (N-1) agar identik dengan evaluasi simpan
    const rows = await db.execute(sql`
      SELECT 
        c.id,
        c.thbl,
        c.nolg,
        c.tmss,
        c.stml,
        c.stma,
        c.pakai_m3,
        c.pakai_lalu,
        c.is_anomali,
        c.kode_anomali_utama,
        prev.tmss as prev_tmss,
        prev.pakai_m3 as prev_pakai_m3
      FROM cater_baca_meter c
      LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
        AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
      WHERE c.thbl = ${per}
    `);

    // 4. Hitung simulasi
    const sebelumStat = { anomali: 0, warning: 0, normal: 0 };
    const sesudahStat = { anomali: 0, warning: 0, normal: 0 };
    const distSebelum: Record<string, number> = {};
    const distSesudah: Record<string, number> = {};
    let jumlahBarisBerubah = 0;

    for (const r of rows as any[]) {
      const kSebelum = r.kode_anomali_utama || 'NORMAL_BERSIH';
      distSebelum[kSebelum] = (distSebelum[kSebelum] || 0) + 1;
      if (r.is_anomali) sebelumStat.anomali++;
      else if (kSebelum.startsWith('WARN_')) sebelumStat.warning++;
      else sebelumStat.normal++;

      // Evaluasi dengan ruleset simulasi (memakai input komprehensif yang sama dengan evaluasi real)
      const input: ReadingInput = {
        stml: Number(r.stml),
        stma: Number(r.stma),
        pakaiM3: Number(r.pakai_m3),
        pakaiLalu: r.pakai_lalu !== null ? Number(r.pakai_lalu) : null,
        kodeTmss: r.tmss,
        prevKondisiTmss: r.prev_tmss,
        prevPakaiM3: r.prev_pakai_m3 !== null ? Number(r.prev_pakai_m3) : null,
      };

      const res = evaluasiAnomaliBaris(input, simulatedRules, maps, versi);
      const kSesudah = res.kodeUtama || 'NORMAL_BERSIH';
      distSesudah[kSesudah] = (distSesudah[kSesudah] || 0) + 1;
      if (res.isAnomali) sesudahStat.anomali++;
      else if (kSesudah.startsWith('WARN_')) sesudahStat.warning++;
      else sesudahStat.normal++;

      if (r.is_anomali !== res.isAnomali || r.kode_anomali_utama !== res.kodeUtama) {
        jumlahBarisBerubah++;
      }
    }

    const allKeys = Array.from(new Set([...Object.keys(distSebelum), ...Object.keys(distSesudah)])).sort();
    const rincianPerKode = allKeys.map((k) => ({
      kode: k,
      sebelum: distSebelum[k] || 0,
      sesudah: distSesudah[k] || 0,
      selisih: (distSesudah[k] || 0) - (distSebelum[k] || 0),
    }));

    return {
      periode: per,
      totalBaris: rows.length,
      sebelum: sebelumStat,
      sesudah: sesudahStat,
      perubahanNetto: {
        anomali: sesudahStat.anomali - sebelumStat.anomali,
        warning: sesudahStat.warning - sebelumStat.warning,
        normal: sesudahStat.normal - sebelumStat.normal,
      },
      rincianPerKode,
      jumlahBarisBerubah,
    };
  }

  /**
   * Update Aturan Anomali (Atomic Transaction: Validate -> Update -> Snapshot -> Audit Log -> Recalculate Open Periods)
   */
  async updateAturan(id: string, input: UpdateAturanInput, userContext: UserContext) {
    if (!input.alasan || input.alasan.trim().length < 5) {
      throw new Error('Alasan perubahan aturan wajib diisi minimal 5 karakter untuk audit log.');
    }

    // Validasi parameter agar tidak kontradiktif
    if (input.minPersen != null && input.maxPersen != null) {
      if (Number(input.minPersen) > Number(input.maxPersen)) {
        throw new Error('Ambang bawah (minPersen) tidak boleh lebih besar dari ambang atas (maxPersen).');
      }
    }
    if (input.minM3 != null && input.maxM3 != null) {
      if (Number(input.minM3) > Number(input.maxM3)) {
        throw new Error('Volume minimum (minM3) tidak boleh lebih besar dari volume maksimum (maxM3).');
      }
    }

    return await db.transaction(async (tx) => {
      // Serialisasi pembuatan versi menggunakan PostgreSQL Transaction Advisory Lock (anti race-condition)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(8472910)`);

      // 1. Ambil nilai lama
      const [oldRule] = await tx
        .select()
        .from(aturanAnomali)
        .where(eq(aturanAnomali.id, id));

      if (!oldRule) {
        throw new Error(`Aturan anomali dengan ID '${id}' tidak ditemukan.`);
      }

      // Pastikan kode aturan immutable
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (input.nama !== undefined) updateData.nama = input.nama;
      if (input.arah !== undefined) updateData.arah = input.arah;
      if (input.acuanPembanding !== undefined) updateData.acuanPembanding = input.acuanPembanding;
      if (input.periodeHistorisJml !== undefined) updateData.periodeHistorisJml = input.periodeHistorisJml;
      if (input.syaratPakaiLaluMinM3 !== undefined) updateData.syaratPakaiLaluMinM3 = input.syaratPakaiLaluMinM3 !== null ? String(input.syaratPakaiLaluMinM3) : null;
      if (input.selisihMinM3 !== undefined) updateData.selisihMinM3 = input.selisihMinM3 !== null ? String(input.selisihMinM3) : null;
      if (input.minM3 !== undefined) updateData.minM3 = input.minM3 !== null ? String(input.minM3) : null;
      if (input.maxM3 !== undefined) updateData.maxM3 = input.maxM3 !== null ? String(input.maxM3) : null;
      if (input.minPersen !== undefined) updateData.minPersen = input.minPersen !== null ? String(input.minPersen) : null;
      if (input.maxPersen !== undefined) updateData.maxPersen = input.maxPersen !== null ? String(input.maxPersen) : null;
      if (input.dihitungSebagaiAnomali !== undefined) updateData.dihitungSebagaiAnomali = input.dihitungSebagaiAnomali;
      if (input.ringTingkat !== undefined) updateData.ringTingkat = input.ringTingkat;
      if (input.tingkatKeparahan !== undefined) updateData.tingkatKeparahan = input.tingkatKeparahan;
      if (input.badgeTone !== undefined) updateData.badgeTone = input.badgeTone;
      if (input.urutan !== undefined) updateData.urutan = input.urutan;
      if (input.syaratKondisiLalu !== undefined) updateData.syaratKondisiLalu = input.syaratKondisiLalu;
      if (input.syaratPeriodeBerturut !== undefined) updateData.syaratPeriodeBerturut = input.syaratPeriodeBerturut;
      if (input.kecualikanJikaBerlanjut !== undefined) updateData.kecualikanJikaBerlanjut = input.kecualikanJikaBerlanjut;
      if (input.kecualikanJikaPakaiLaluDibawah !== undefined) updateData.kecualikanJikaPakaiLaluDibawah = input.kecualikanJikaPakaiLaluDibawah !== null ? String(input.kecualikanJikaPakaiLaluDibawah) : null;
      if (input.deskripsi !== undefined) updateData.deskripsi = input.deskripsi;

      // 2. Eksekusi update aturan
      await tx.update(aturanAnomali).set(updateData).where(eq(aturanAnomali.id, id));

      // 3. Dapatkan versi baru
      const [latest] = await tx
        .select({ maxVersi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 0)` })
        .from(aturanAnomaliVersi);
      const newVersi = (latest ? Number(latest.maxVersi) : 0) + 1;

      // 4. Ambil snapshot seluruh aturan dan simpan versi baru
      const allRules = await tx.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
      await tx.insert(aturanAnomaliVersi).values({
        versi: newVersi,
        snapshot: allRules,
        alasan: input.alasan,
        diterbitkanOleh: `${userContext.nama} (${userContext.role})`,
      });

      // 5. Catat audit log
      await tx.insert(aturanAnomaliAuditLog).values({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        aturanId: id,
        aksi: 'UPDATE',
        nilaiLama: oldRule,
        nilaiBaru: { ...oldRule, ...updateData },
        alasan: input.alasan,
        diubahOleh: `${userContext.nama} (${userContext.role})`,
      });

      // 6. Invalidate memory cache
      this.cachedVersi = null;

      // 7. Hitung ulang periode berjalan yang belum closing
      await this.evaluasiUlangPeriodeBerjalan(tx, newVersi);

      return {
        success: true,
        versi: newVersi,
        message: `Aturan '${oldRule.kode}' berhasil diperbarui ke versi ${newVersi}.`,
      };
    });
  }

  /**
   * Toggle Aktif / Nonaktif Aturan (Tidak Ada Hapus)
   */
  async toggleAktifAturan(id: string, aktif: boolean, alasan: string, userContext: UserContext) {
    if (!alasan || alasan.trim().length < 5) {
      throw new Error('Alasan perubahan status aturan wajib diisi minimal 5 karakter untuk audit log.');
    }

    return await db.transaction(async (tx) => {
      // Serialisasi pembuatan versi menggunakan PostgreSQL Transaction Advisory Lock (anti race-condition)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(8472910)`);

      const [oldRule] = await tx.select().from(aturanAnomali).where(eq(aturanAnomali.id, id));
      if (!oldRule) {
        throw new Error(`Aturan dengan ID '${id}' tidak ditemukan.`);
      }

      // Idempotent Guard: Jika status aturan sudah sesuai dengan target, kembalikan tanpa membuat versi duplikat
      if (oldRule.aktif === aktif) {
        const [current] = await tx
          .select({ maxVersi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 1)` })
          .from(aturanAnomaliVersi);
        return {
          success: true,
          versi: current ? Number(current.maxVersi) : 1,
          message: `Status aturan '${oldRule.kode}' sudah ${aktif ? 'Aktif' : 'Nonaktif'}.`,
        };
      }

      await tx.update(aturanAnomali).set({ aktif, updatedAt: new Date() }).where(eq(aturanAnomali.id, id));

      const [latest] = await tx
        .select({ maxVersi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 0)` })
        .from(aturanAnomaliVersi);
      const newVersi = (latest ? Number(latest.maxVersi) : 0) + 1;

      const allRules = await tx.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
      await tx.insert(aturanAnomaliVersi).values({
        versi: newVersi,
        snapshot: allRules,
        alasan: `Toggle status aktif menjadi ${aktif}: ${alasan}`,
        diterbitkanOleh: `${userContext.nama} (${userContext.role})`,
      });

      await tx.insert(aturanAnomaliAuditLog).values({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        aturanId: id,
        aksi: 'TOGGLE_AKTIF',
        nilaiLama: { aktif: oldRule.aktif },
        nilaiBaru: { aktif },
        alasan,
        diubahOleh: `${userContext.nama} (${userContext.role})`,
      });

      this.cachedVersi = null;
      await this.evaluasiUlangPeriodeBerjalan(tx, newVersi);

      return {
        success: true,
        versi: newVersi,
        message: `Status aturan '${oldRule.kode}' berhasil diubah menjadi ${aktif ? 'Aktif' : 'Nonaktif'} (Versi ${newVersi}).`,
      };
    });
  }

  /**
   * Evaluasi Ulang Periode Berjalan yang Belum Closing (Atomic Batch Update)
   */
  async evaluasiUlangPeriodeBerjalan(txClient?: any, versi: number = 1) {
    const client = txClient || db;

    // Cari periode yang berstatus 'BERJALAN' di periode_penagihan
    const openPeriods = await client
      .select({ periode: periodePenagihan.periode })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.status, 'BERJALAN'));

    const periodes = openPeriods.map((p: any) => p.periode);
    if (periodes.length === 0) {
      // Jika tidak ada data di periode_penagihan, ambil periode terbaru di cater_baca_meter
      const [maxCater] = await client
        .select({ thbl: caterBacaMeter.thbl })
        .from(caterBacaMeter)
        .orderBy(desc(caterBacaMeter.thbl))
        .limit(1);
      if (maxCater) {
        periodes.push(maxCater.thbl);
      }
    }

    // Ambil rules & map
    const rules = await client.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
    const maps = await client
      .select({
        kodeTmss: aturanKondisiMeterMap.kodeTmss,
        aturanAnomaliId: aturanKondisiMeterMap.aturanAnomaliId,
        aturanKode: aturanAnomali.kode,
        isBaselineNormal: aturanKondisiMeterMap.isBaselineNormal,
        isPeriodeTidakAktif: aturanKondisiMeterMap.isPeriodeTidakAktif,
        aktif: aturanKondisiMeterMap.aktif,
      })
      .from(aturanKondisiMeterMap)
      .innerJoin(aturanAnomali, eq(aturanKondisiMeterMap.aturanAnomaliId, aturanAnomali.id))
      .where(eq(aturanKondisiMeterMap.aktif, true));

    for (const per of periodes) {
      // Pastikan periode ini bukan closing (double check status TERKUNCI)
      const [isLocked] = await client
        .select({ status: periodePenagihan.status })
        .from(periodePenagihan)
        .where(and(eq(periodePenagihan.periode, per), eq(periodePenagihan.status, 'TERKUNCI')));

      if (isLocked) {
        console.warn(`Periode ${per} berstatus TERKUNCI/CLOSING. Evaluasi ulang dilewati.`);
        continue;
      }

      // Muat data baris periode ini beserta baris bulan lalu
      const rows = await client.execute(sql`
        SELECT 
          c.id,
          c.thbl,
          c.nolg,
          c.tmss,
          c.stml,
          c.stma,
          c.pakai_m3,
          c.pakai_lalu,
          prev.tmss as prev_tmss,
          prev.pakai_m3 as prev_pakai_m3
        FROM cater_baca_meter c
        LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
          AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
        WHERE c.thbl = ${per}
      `);

      const updates: Array<{
        id: string;
        is_anomali: boolean;
        kode_anomali_utama: string | null;
        kode_anomali_list: string[];
        aturan_versi: number;
      }> = [];

      for (const r of rows) {
        const input: ReadingInput = {
          stml: Number(r.stml),
          stma: Number(r.stma),
          pakaiM3: Number(r.pakai_m3),
          pakaiLalu: r.pakai_lalu !== null ? Number(r.pakai_lalu) : null,
          kodeTmss: r.tmss,
          prevKondisiTmss: r.prev_tmss,
          prevPakaiM3: r.prev_pakai_m3 !== null ? Number(r.prev_pakai_m3) : null,
        };

        const res = evaluasiAnomaliBaris(input, rules as any, maps as any, versi);
        updates.push({
          id: r.id,
          is_anomali: res.isAnomali,
          kode_anomali_utama: res.kodeUtama,
          kode_anomali_list: res.kodeList,
          aturan_versi: versi,
        });
      }

      // Batch update chunks 2,000
      const chunkSize = 2000;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const valuesSql = chunk
          .map(
            (u) =>
              `('${u.id}'::text, ${u.is_anomali}::boolean, ${
                u.kode_anomali_utama ? `'${u.kode_anomali_utama}'` : 'NULL'
              }::varchar, ARRAY[${u.kode_anomali_list
                .map((k) => `'${k}'`)
                .join(',')}]::text[], ${u.aturan_versi}::integer)`
          )
          .join(',\n');

        await client.execute(sql.raw(`
          UPDATE cater_baca_meter AS c
          SET 
            is_anomali = v.is_anomali,
            kode_anomali_utama = v.kode_anomali_utama,
            kode_anomali_list = v.kode_anomali_list,
            aturan_versi = v.aturan_versi
          FROM (VALUES ${valuesSql}) AS v(id, is_anomali, kode_anomali_utama, kode_anomali_list, aturan_versi)
          WHERE c.id = v.id;
        `));
      }
    }
  }

  /**
   * Koreksi Kondisi/Stand pada Periode N-1 memicu evaluasi ulang baris periode berikutnya (N)
   * Sesuai Klausul Bagian A.6: Koreksi pada N-1 mengevaluasi ulang baris N yang belum closing.
   */
  async evaluasiUlangBarisDependen(nolg: string, thblKoreksi: string, txClient?: any) {
    const client = txClient || db;

    // 1. Tentukan periode berikutnya N = N-1 + 1 bulan
    const [nextPer] = await client.execute(sql`
      SELECT to_char(to_date(${thblKoreksi}, 'YYYYMM') + interval '1 month', 'YYYYMM') as "nextThbl"
    `);
    const nextThbl = nextPer?.nextThbl;
    if (!nextThbl) return;

    // 2. Pastikan periode N belum closing
    const [isLocked] = await client
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(and(eq(periodePenagihan.periode, nextThbl), eq(periodePenagihan.status, 'TERKUNCI')));

    if (isLocked) {
      console.log(`Periode ${nextThbl} sudah closing. Baris dependen tidak dihitung ulang.`);
      return;
    }

    // 3. Ambil baris periode N pelanggan ini
    const [rowN] = await client
      .select()
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.nolg, nolg), eq(caterBacaMeter.thbl, nextThbl)));

    if (!rowN) return;

    // 4. Ambil baris hasil koreksi N-1 sebagai baseline
    const [rowPrev] = await client
      .select()
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.nolg, nolg), eq(caterBacaMeter.thbl, thblKoreksi)));

    // 5. Muat rules & map terkini
    const { rules, maps, versi } = await this.getCachedEngineContext();

    const input: ReadingInput = {
      stml: Number(rowN.stml),
      stma: Number(rowN.stma),
      pakaiM3: Number(rowN.pakaiM3),
      pakaiLalu: rowPrev ? Number(rowPrev.pakaiM3) : (rowN.pakaiLalu !== null ? Number(rowN.pakaiLalu) : null),
      kodeTmss: rowN.tmss,
      prevKondisiTmss: rowPrev?.tmss || null,
      prevPakaiM3: rowPrev ? Number(rowPrev.pakaiM3) : null,
    };

    const res = evaluasiAnomaliBaris(input, rules, maps, versi);

    // 6. Update baris periode N
    await client
      .update(caterBacaMeter)
      .set({
        isAnomali: res.isAnomali,
        kodeAnomaliUtama: res.kodeUtama,
        kodeAnomaliList: res.kodeList,
        aturanVersi: versi,
      })
      .where(eq(caterBacaMeter.id, rowN.id));

    return {
      nolg,
      thblUpdated: nextThbl,
      evaluasiBaru: res,
    };
  }
}

export const aturanAnomaliService = new AturanAnomaliService();
