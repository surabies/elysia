"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Route, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cariPelanggan,
  getRiwayat,
  getWilayah,
  getZona,
  simpanMutasi,
  wilayahOpsi as fallbackWilayahOpsi,
  type Opsi,
  type Pelanggan,
  type RiwayatMutasi,
} from "../data";
import { FieldSelect } from "./field-select";
import { InfoRow, Kbd, PageHeader, Panel } from "./ui-parts";

type Errors = Partial<Record<"wilayah" | "zona" | "rute" | "urut", string>>;

export function MutasiRuteView() {
  // 1. Pencarian pelanggan
  const [noPel, setNoPel] = useState("");
  const [pelanggan, setPelanggan] = useState<Pelanggan | null>(null);
  const [mencari, setMencari] = useState(false);
  const [cariError, setCariError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Form tujuan mutasi
  const [wilayah, setWilayah] = useState("");
  const [wilayahList, setWilayahList] = useState<Opsi[]>(fallbackWilayahOpsi);
  const [zona, setZona] = useState("");
  const [zonaOpsi, setZonaOpsi] = useState<Opsi[]>([]);
  const [rute, setRute] = useState("");
  const [urut, setUrut] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [menyimpan, setMenyimpan] = useState(false);

  // 3. Riwayat mutasi
  const [riwayat, setRiwayat] = useState<RiwayatMutasi[]>([]);
  const [memuat, setMemuat] = useState(false);

  // Load wilayah options from DB
  useEffect(() => {
    getWilayah()
      .then((opts) => {
        if (opts.length > 0) setWilayahList(opts);
      })
      .catch((err) => console.error("Gagal memuat wilayah:", err));
  }, []);

  const muatRiwayat = useCallback(async () => {
    setMemuat(true);
    try {
      const data = await getRiwayat();
      setRiwayat(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat riwayat mutasi");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muatRiwayat();
  }, [muatRiwayat]);

  // 4. Shortcut keyboard: F2 = cari, F3 = refresh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "F3") {
        e.preventDefault();
        muatRiwayat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [muatRiwayat]);

  // 5. Handler
  const cari = async () => {
    if (!noPel.trim()) return setCariError("Masukkan nomor pelanggan");
    setCariError("");
    setMencari(true);
    try {
      const hasil = await cariPelanggan(noPel.trim());
      if (!hasil) {
        setPelanggan(null);
        setCariError("Pelanggan tidak ditemukan");
      } else {
        setPelanggan(hasil);
      }
    } catch (err: any) {
      setCariError(err.message || "Gagal mencari data pelanggan");
    } finally {
      setMencari(false);
    }
  };

  const ubahWilayah = async (v: string) => {
    setWilayah(v);
    setZona("");
    try {
      const z = await getZona();
      setZonaOpsi(z);
    } catch (err) {
      console.error("Gagal memuat zona:", err);
    }
  };

  const reset = () => {
    setNoPel("");
    setPelanggan(null);
    setWilayah("");
    setZona("");
    setZonaOpsi([]);
    setRute("");
    setUrut("");
    setErrors({});
    setCariError("");
  };

  const simpan = async () => {
    if (!pelanggan) return;
    const e: Errors = {};
    if (!wilayah) e.wilayah = "Pilih wilayah tujuan";
    if (!zona) e.zona = "Pilih zona";
    if (!rute.trim()) e.rute = "Isi rute tujuan";
    if (!urut || Number(urut) < 1) e.urut = "Minimal 1";
    setErrors(e);
    if (Object.keys(e).length) return;

    setMenyimpan(true);
    try {
      const log = await simpanMutasi(
        pelanggan,
        {
          wil: wilayah,
          rute: rute.trim().toUpperCase(),
          urut: Number(urut),
        },
        zona
      );
      setRiwayat((r) => [log, ...r]);
      toast.success(`Pelanggan ${pelanggan.noPel} dipindahkan ke rute ${log.baru.rute}`);
      reset();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan mutasi rute");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Mutasi rute pelanggan"
        description="Pindahkan satu pelanggan ke rute baca dan nomor urut baru."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Panel title="Form mutasi" icon={<Route />}>
          <div className="space-y-5 p-4">
            {/* Cari pelanggan */}
            <div className="grid gap-1.5">
              <Label htmlFor="no-pel" className="text-xs font-medium text-muted-foreground">
                No. pelanggan
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="no-pel"
                    ref={inputRef}
                    value={noPel}
                    onChange={(e) => setNoPel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && cari()}
                    placeholder="00800400550"
                    className="pl-8 pr-10 font-mono"
                    aria-invalid={!!cariError}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Kbd>F2</Kbd>
                  </span>
                </div>
                <Button variant="outline" onClick={cari} disabled={mencari}>
                  {mencari ? <Loader2 className="animate-spin" /> : "Cari"}
                </Button>
              </div>
              {cariError && <p className="text-xs text-destructive">{cariError}</p>}
            </div>

            {/* Rute saat ini (read-only) */}
            <div className="rounded-lg border bg-muted/30 px-3">
              {pelanggan ? (
                <dl className="divide-y">
                  <InfoRow label="Nama">{pelanggan.nama}</InfoRow>
                  <InfoRow label="Gol. tarif">
                    <Badge variant="secondary">{pelanggan.golTarif}</Badge>
                  </InfoRow>
                  <InfoRow label="Alamat">{pelanggan.alamat}</InfoRow>
                  <InfoRow label="Wilayah">{pelanggan.wilayah}</InfoRow>
                  <InfoRow label="Rute lama">
                    <span className="font-mono">{pelanggan.rute}</span>
                  </InfoRow>
                  <InfoRow label="No. urut lama">
                    <span className="font-mono tabular-nums">{pelanggan.urut}</span>
                  </InfoRow>
                </dl>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Cari nomor pelanggan untuk melihat rute saat ini.
                </p>
              )}
            </div>

            <Separator />

            {/* Tujuan mutasi */}
            <div className="space-y-4">
              <FieldSelect
                label="Wilayah tujuan"
                value={wilayah}
                onChange={ubahWilayah}
                options={wilayahList}
                placeholder="Pilih wilayah"
                disabled={!pelanggan}
                error={errors.wilayah}
              />
              <FieldSelect
                label="Zona"
                value={zona}
                onChange={setZona}
                options={zonaOpsi}
                placeholder="Pilih zona"
                disabled={!wilayah}
                error={errors.zona}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Rute baru</Label>
                  <Input
                    value={rute}
                    onChange={(e) => setRute(e.target.value)}
                    placeholder="BD601"
                    className="font-mono uppercase"
                    disabled={!pelanggan}
                    aria-invalid={!!errors.rute}
                  />
                  {errors.rute && <p className="text-xs text-destructive">{errors.rute}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">No. urut baru</Label>
                  <Input
                    type="number"
                    min={1}
                    value={urut}
                    onChange={(e) => setUrut(e.target.value)}
                    className="font-mono tabular-nums"
                    disabled={!pelanggan}
                    aria-invalid={!!errors.urut}
                  />
                  {errors.urut && <p className="text-xs text-destructive">{errors.urut}</p>}
                </div>
              </div>

              {/* Pratinjau perubahan */}
              {pelanggan && rute && urut && (
                <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2 font-mono text-xs">
                  <span>
                    {pelanggan.rute} #{pelanggan.urut}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="font-semibold">
                    {rute.toUpperCase()} #{urut}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-muted/30 px-4 py-3">
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
            <Button onClick={simpan} disabled={!pelanggan || menyimpan}>
              {menyimpan && <Loader2 className="animate-spin" />}
              Simpan mutasi
            </Button>
          </div>
        </Panel>

        {/* Tabel riwayat mutasi */}
        <Panel
          title={
            <>
              Riwayat mutasi
              {riwayat.length > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {riwayat.length}
                </Badge>
              )}
            </>
          }
          icon={<RefreshCw className={memuat ? "animate-spin" : undefined} />}
          actions={
            <Button variant="ghost" size="sm" onClick={muatRiwayat} disabled={memuat}>
              Segarkan
              <Kbd>F3</Kbd>
            </Button>
          }
        >
          <div className="max-h-[620px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-28">Tgl input</TableHead>
                  <TableHead>No. pelanggan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Rute lama</TableHead>
                  <TableHead>Rute baru</TableHead>
                  <TableHead>Petugas input</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memuat && riwayat.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell colSpan={7}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : riwayat.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      Belum ada riwayat mutasi rute.
                    </TableCell>
                  </TableRow>
                ) : (
                  riwayat.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {r.tglInput}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {r.noPel}
                      </TableCell>
                      <TableCell className="font-medium">{r.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{r.kodeWilayah}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {r.lama.rute} #{r.lama.urut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="font-mono">
                          {r.baru.rute} #{r.baru.urut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.inputBy}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
