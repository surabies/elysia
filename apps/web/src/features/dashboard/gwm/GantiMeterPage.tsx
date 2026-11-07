"use client";

import * as React from "react";
import { RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRbac } from "@/components/layout/shell/RbacContext";

type AlasanMutasi =
  | "RUSAK"
  | "MATI"
  | "BURAM"
  | "HILANG"
  | "TERA_ULANG"
  | "UKURAN_BERUBAH"
  | "LAINNYA";

type StatusMutasi = "PENDING" | "APPROVED" | "REJECTED";

interface MutasiMeter {
  id: string;
  nolg: string;
  namaPelanggan: string;
  alamatPelanggan: string;
  noMeterAktif: string | null;
  periode: number;
  alasan: AlasanMutasi;
  keterangan: string | null;
  noMeterLama: string;
  standAngkat: number;
  noMeterBaru: string;
  merkBaru: string | null;
  ukuranBaru: string | null;
  standPasang: number;
  statusVerifikasi: StatusMutasi;
  catatanVerifikasi: string | null;
  standLaluLaporan: string | null;
  standAkhirLaporan: string | null;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

const LABEL_ALASAN: Record<AlasanMutasi, string> = {
  RUSAK: "Meter rusak",
  MATI: "Meter mati",
  BURAM: "Kaca meter buram",
  HILANG: "Meter hilang",
  TERA_ULANG: "Tera ulang",
  UKURAN_BERUBAH: "Perubahan ukuran",
  LAINNYA: "Lainnya",
};

async function request<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let envelope: Envelope<T>;
  try {
    envelope = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca.");
  }

  if (!response.ok || !envelope.success || envelope.data === undefined) {
    throw new Error(envelope.error?.message ?? "Permintaan gagal diproses.");
  }

  return envelope.data;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function GantiMeterPage() {
  const { hasAnyRole } = useRbac();
  const bolehVerifikasi = hasAnyRole(["VERIFIKATOR_1", "VERIFIKATOR_2"]);
  const [statusFilter, setStatusFilter] = React.useState<StatusMutasi | "ALL">(
    "PENDING",
  );
  const [mutasi, setMutasi] = React.useState<MutasiMeter[]>([]);
  const [pembacaanBaru, setPembacaanBaru] = React.useState<
    Record<string, string>
  >({});
  const [memuat, setMemuat] = React.useState(true);
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [aksiId, setAksiId] = React.useState<string | null>(null);

  const [nolg, setNolg] = React.useState("");
  const [periode, setPeriode] = React.useState("");
  const [alasan, setAlasan] = React.useState<AlasanMutasi>("RUSAK");
  const [noMeterLama, setNoMeterLama] = React.useState("");
  const [standAngkat, setStandAngkat] = React.useState("");
  const [noMeterBaru, setNoMeterBaru] = React.useState("");
  const [standPasang, setStandPasang] = React.useState("0");
  const [merkBaru, setMerkBaru] = React.useState("");
  const [ukuranBaru, setUkuranBaru] = React.useState("");
  const [petugasPasang, setPetugasPasang] = React.useState("");
  const [keterangan, setKeterangan] = React.useState("");

  const muatMutasi = React.useCallback(async (filter = statusFilter) => {
    setMemuat(true);
    try {
      const query =
        filter === "ALL" ? "" : `?status=${filter}`;
      const rows = await request<MutasiMeter[]>(
        `/api/cater/gwm/mutasi${query}`,
        "GET",
      );
      setMutasi(rows);
      setPembacaanBaru((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (next[row.id] === undefined && row.standAkhirLaporan != null) {
            next[row.id] = String(row.standAkhirLaporan);
          }
        }
        return next;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data mutasi.",
      );
    } finally {
      setMemuat(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void muatMutasi();
  }, [muatMutasi]);

  async function catatMutasi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMenyimpan(true);
    try {
      await request("/api/cater/gwm/mutasi", "POST", {
        nolg: nolg.trim(),
        periode: Number(periode),
        alasan,
        noMeterLama: noMeterLama.trim(),
        standAngkat: Number(standAngkat),
        noMeterBaru: noMeterBaru.trim(),
        standPasang: Number(standPasang),
        ...(merkBaru.trim() && { merkBaru: merkBaru.trim() }),
        ...(ukuranBaru.trim() && { ukuranBaru: ukuranBaru.trim() }),
        ...(petugasPasang.trim() && { petugasPasang: petugasPasang.trim() }),
        ...(keterangan.trim() && { keterangan: keterangan.trim() }),
      });
      toast.success("Data ganti meter dicatat dan menunggu verifikasi.");
      setNolg("");
      setPeriode("");
      setAlasan("RUSAK");
      setNoMeterLama("");
      setStandAngkat("");
      setNoMeterBaru("");
      setStandPasang("0");
      setMerkBaru("");
      setUkuranBaru("");
      setPetugasPasang("");
      setKeterangan("");
      setStatusFilter("PENDING");
      await muatMutasi("PENDING");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mencatat ganti meter.",
      );
    } finally {
      setMenyimpan(false);
    }
  }

  async function verifikasi(
    row: MutasiMeter,
    action: "APPROVE" | "REJECT",
  ) {
    const reading = pembacaanBaru[row.id];
    if (action === "APPROVE" && (!reading || !Number.isInteger(Number(reading)))) {
      toast.error("Stand baca meter baru harus diisi dengan bilangan bulat.");
      return;
    }
    if (
      action === "REJECT" &&
      !window.confirm(`Tolak pengajuan ganti meter pelanggan ${row.nolg}?`)
    ) {
      return;
    }

    setAksiId(row.id);
    try {
      await request("/api/cater/gwm/mutasi/verify", "POST", {
        mutasiId: row.id,
        action,
        ...(action === "APPROVE" && { standBacaBaru: Number(reading) }),
        ...(action === "REJECT" && { catatan: "Ditolak melalui halaman Ganti Meter." }),
      });
      toast.success(
        action === "APPROVE"
          ? "Mutasi disetujui dan ditautkan ke laporan pembacaan."
          : "Pengajuan mutasi ditolak.",
      );
      await muatMutasi();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memproses verifikasi mutasi.",
      );
    } finally {
      setAksiId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
          <Wrench className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-heading-24 font-semibold">Ganti Water Meter</h1>
          <p className="mt-1 text-copy-13 text-muted-foreground">
            Catat berita acara penggantian meter dan tautkan mutasi ke laporan
            pembacaan setelah diverifikasi.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-heading-16 font-semibold">
          Catat berita acara ganti meter
        </h2>
        <p className="mt-1 text-copy-13 text-muted-foreground">
          Gunakan nomor langganan dan periode yang sama dengan laporan baca
          meter pelanggan.
        </p>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => void catatMutasi(event)}
        >
          <Field label="No. Langganan">
            <Input
              required
              value={nolg}
              onChange={(event) => setNolg(event.target.value)}
              placeholder="Nomor langganan pelanggan"
            />
          </Field>
          <Field label="Periode laporan (YYYYMM)">
            <Input
              required
              type="number"
              min={200001}
              max={209912}
              step={1}
              value={periode}
              onChange={(event) => setPeriode(event.target.value)}
              placeholder="Contoh: 202611"
            />
          </Field>
          <Field label="Alasan penggantian">
            <Select
              value={alasan}
              onValueChange={(value) => setAlasan(value as AlasanMutasi)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABEL_ALASAN).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nomor meter lama">
            <Input
              required
              value={noMeterLama}
              onChange={(event) => setNoMeterLama(event.target.value)}
            />
          </Field>
          <Field label="Stand angkat meter lama">
            <Input
              required
              type="number"
              min={0}
              step={1}
              value={standAngkat}
              onChange={(event) => setStandAngkat(event.target.value)}
            />
          </Field>
          <Field label="Nomor meter baru">
            <Input
              required
              value={noMeterBaru}
              onChange={(event) => setNoMeterBaru(event.target.value)}
            />
          </Field>
          <Field label="Stand pasang meter baru">
            <Input
              required
              type="number"
              min={0}
              step={1}
              value={standPasang}
              onChange={(event) => setStandPasang(event.target.value)}
            />
          </Field>
          <Field label="Merk meter baru (opsional)">
            <Input
              value={merkBaru}
              onChange={(event) => setMerkBaru(event.target.value)}
            />
          </Field>
          <Field label="Ukuran meter baru (opsional)">
            <Input
              value={ukuranBaru}
              onChange={(event) => setUkuranBaru(event.target.value)}
              placeholder="Contoh: 1/2"
            />
          </Field>
          <Field label="Petugas pemasang (opsional)">
            <Input
              value={petugasPasang}
              onChange={(event) => setPetugasPasang(event.target.value)}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Keterangan (opsional)">
              <Textarea
                value={keterangan}
                onChange={(event) => setKeterangan(event.target.value)}
                rows={2}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={menyimpan}>
              {menyimpan ? "Menyimpan..." : "Simpan berita acara"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-heading-16 font-semibold">
              Daftar mutasi meter
            </h2>
            <p className="mt-1 text-copy-13 text-muted-foreground">
              Persetujuan menautkan berita acara ke laporan periode pelanggan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as StatusMutasi | "ALL")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Menunggu verifikasi</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="ALL">Semua status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Muat ulang daftar mutasi"
              onClick={() => void muatMutasi()}
              disabled={memuat}
            >
              <RefreshCw className={memuat ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {memuat ? (
            <p className="py-6 text-center text-copy-13 text-muted-foreground">
              Memuat data mutasi...
            </p>
          ) : mutasi.length === 0 ? (
            <p className="py-6 text-center text-copy-13 text-muted-foreground">
              Tidak ada data mutasi untuk status ini.
            </p>
          ) : (
            mutasi.map((row) => {
              const laporanAda = row.standLaluLaporan != null;
              const statusLabel =
                row.statusVerifikasi === "PENDING"
                  ? "Menunggu verifikasi"
                  : row.statusVerifikasi === "APPROVED"
                    ? "Disetujui"
                    : "Ditolak";

              return (
                <article
                  key={row.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-label-14 font-semibold">
                        {row.namaPelanggan} · {row.nolg}
                      </h3>
                      <p className="mt-1 text-copy-13 text-muted-foreground">
                        Periode {row.periode} · {LABEL_ALASAN[row.alasan]} ·{" "}
                        {statusLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-label-12 text-muted-foreground">
                      {statusLabel}
                    </span>
                  </div>

                  <dl className="mt-3 grid gap-x-5 gap-y-2 text-copy-13 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">Meter lama</dt>
                      <dd className="font-medium">
                        {row.noMeterLama} · stand angkat{" "}
                        {row.standAngkat.toLocaleString("id-ID")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Meter baru</dt>
                      <dd className="font-medium">
                        {row.noMeterBaru} · stand pasang{" "}
                        {row.standPasang.toLocaleString("id-ID")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Alamat</dt>
                      <dd className="line-clamp-2 font-medium">
                        {row.alamatPelanggan}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Meter terdaftar
                      </dt>
                      <dd className="font-medium">
                        {row.noMeterAktif ?? "Tidak tercatat"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Laporan baca meter</dt>
                      <dd className="font-medium">
                        {laporanAda
                          ? `Stand lalu ${Number(row.standLaluLaporan).toLocaleString("id-ID")} · stand baca ${Number(row.standAkhirLaporan).toLocaleString("id-ID")}`
                          : "Belum tersedia"}
                      </dd>
                    </div>
                  </dl>

                  {row.keterangan && (
                    <p className="mt-3 text-copy-13 text-muted-foreground">
                      {row.keterangan}
                    </p>
                  )}
                  {row.catatanVerifikasi && (
                    <p className="mt-2 text-copy-13 text-muted-foreground">
                      Catatan verifikasi: {row.catatanVerifikasi}
                    </p>
                  )}

                  {row.statusVerifikasi === "PENDING" && bolehVerifikasi && (
                    <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-3">
                      <Field label="Stand baca meter baru">
                        <Input
                          required
                          type="number"
                          min={0}
                          step={1}
                          className="w-48"
                          value={pembacaanBaru[row.id] ?? ""}
                          onChange={(event) =>
                            setPembacaanBaru((current) => ({
                              ...current,
                              [row.id]: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Button
                        type="button"
                        disabled={
                          !laporanAda ||
                          !pembacaanBaru[row.id] ||
                          aksiId === row.id
                        }
                        onClick={() => void verifikasi(row, "APPROVE")}
                      >
                        Setujui & tautkan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={aksiId === row.id}
                        onClick={() => void verifikasi(row, "REJECT")}
                      >
                        Tolak
                      </Button>
                      {!laporanAda && (
                        <p className="basis-full text-copy-13 text-muted-foreground">
                          Persetujuan tersedia setelah laporan pembacaan
                          pelanggan pada periode ini masuk.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
