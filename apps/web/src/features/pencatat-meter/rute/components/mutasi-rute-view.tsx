"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Route, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { ruteApi } from "../api";
import type { OpsiItem, PelangganItem, RiwayatMutasiItem } from "../types";
import { wilayahPelayananOpsi } from "../types";
import { FieldSelect } from "./field-select";

type Errors = Partial<Record<"wilayah" | "rute" | "urut", string>>;

export function MutasiRuteView() {
  // 1. Pencarian pelanggan
  const [noPel, setNoPel] = useState("");
  const [pelanggan, setPelanggan] = useState<PelangganItem | null>(null);
  const [mencari, setMencari] = useState(false);
  const [cariError, setCariError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Form tujuan mutasi (Default WP 5)
  const [wilayah, setWilayah] = useState("WP 5");
  const [wilayahList, setWilayahList] = useState<OpsiItem[]>(wilayahPelayananOpsi);
  const [rute, setRute] = useState("");
  const [urut, setUrut] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [menyimpan, setMenyimpan] = useState(false);

  // 3. Riwayat mutasi
  const [riwayat, setRiwayat] = useState<RiwayatMutasiItem[]>([]);
  const [memuat, setMemuat] = useState(false);

  // Muat opsi wilayah dari API client
  useEffect(() => {
    ruteApi
      .getWilayah()
      .then((opts) => {
        if (opts.length > 0) setWilayahList(opts);
      })
      .catch((err) => console.error("Gagal memuat wilayah:", err));
  }, []);

  const muatRiwayat = useCallback(async () => {
    setMemuat(true);
    try {
      const data = await ruteApi.getRiwayat();
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

  // Shortcut keyboard: F2 = fokus cari, F3 = refresh riwayat
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

  // Handler Cari
  const cari = async () => {
    if (!noPel.trim()) return setCariError("Masukkan nomor pelanggan");
    setCariError("");
    setMencari(true);
    try {
      const hasil = await ruteApi.cariPelanggan(noPel.trim());
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

  const reset = () => {
    setNoPel("");
    setPelanggan(null);
    setWilayah("WP 5");
    setRute("");
    setUrut("");
    setErrors({});
    setCariError("");
  };

  const simpan = async () => {
    if (!pelanggan) return;
    const e: Errors = {};
    if (!wilayah) e.wilayah = "Pilih wilayah tujuan";
    if (!rute.trim()) e.rute = "Isi rute tujuan";
    if (!urut || Number(urut) < 1) e.urut = "Minimal 1";
    setErrors(e);
    if (Object.keys(e).length) return;

    setMenyimpan(true);
    try {
      const log = await ruteApi.simpanMutasi({
        noPel: pelanggan.noPel,
        wilayahId: wilayah,
        ruteKode: rute.trim().toUpperCase(),
        noUrut: Number(urut),
      });

      setRiwayat((r) => [log, ...r]);
      toast.success(`Pelanggan ${pelanggan.noPel} dipindahkan ke rute ${rute.trim().toUpperCase()}`);
      reset();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan mutasi rute");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] min-h-[640px] max-w-[1720px] mx-auto w-full p-3 sm:p-5 gap-3 overflow-hidden">
      {/* 1. Header Toolbar Konsisten */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-foreground text-background">
              <Route className="size-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Mutasi Rute Pelanggan
            </h1>
            <Badge variant="outline" className="font-mono text-label-11">
              WP 5 Aktif
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground font-sans">
            Pindahkan satu pelanggan ke rute baca dan nomor urut baru di wilayah pelayanan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={muatRiwayat}
            disabled={memuat}
            className="h-8 gap-1.5 text-label-12 font-mono"
          >
            <RefreshCw className={cn("size-3.5", memuat && "animate-spin")} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. Grid Layout Dua Kolom */}
      <div className="grid items-stretch gap-3 lg:grid-cols-[400px_minmax(0,1fr)] flex-1 min-h-0 overflow-hidden">
        {/* Kolom Kiri: Form Mutasi */}
        <Card className="border-border bg-card shadow-2xs flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/20 shrink-0">
            <CardTitle className="text-label-12 font-bold flex items-center gap-2 text-foreground">
              <Route className="size-3.5 text-muted-foreground" />
              Form Mutasi Rute
            </CardTitle>
            <CardDescription className="text-xs">
              Cari nomor pelanggan lalu tentukan rute dan nomor urut baru
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-3 sm:p-3.5 overflow-y-auto flex-1 min-h-0">
            {/* Cari pelanggan dengan button yang selaras tinggi inputnya */}
            <div className="grid gap-1.5">
              <Label htmlFor="no-pel" className="text-xs font-medium text-muted-foreground">
                Nomor Pelanggan
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="no-pel"
                    ref={inputRef}
                    value={noPel}
                    onChange={(e) => setNoPel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && cari()}
                    placeholder="Contoh: 00700250273"
                    className="h-9 pl-8 font-mono text-xs"
                    aria-invalid={!!cariError}
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-9 px-4 text-xs shrink-0"
                  onClick={cari}
                  disabled={mencari}
                >
                  {mencari ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Cari
                </Button>
              </div>
              {cariError && <p className="text-xs text-destructive">{cariError}</p>}
            </div>

            {/* Informasi Pelanggan Saat Ini */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
              {pelanggan ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium text-foreground text-right">{pelanggan.nama}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Golongan Tarif</span>
                    <Badge variant="secondary" className="font-mono text-label-11">
                      {pelanggan.golTarif}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Alamat</span>
                    <span className="text-right text-muted-foreground max-w-[200px] truncate">
                      {pelanggan.alamat}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Wilayah Pelayanan</span>
                    <span className="font-mono">{pelanggan.wilayah}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rute Lama</span>
                    <Badge variant="outline" className="font-mono">
                      {pelanggan.rute}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nomor Urut Lama</span>
                    <span className="font-mono font-semibold tabular-nums">{pelanggan.urut}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Masukkan nomor pelanggan di atas untuk memuat rute saat ini.
                </div>
              )}
            </div>

            <Separator />

            {/* Input Rute & Urut Tujuan */}
            <div className="space-y-3">
              <FieldSelect
                label="Wilayah Pelayanan Tujuan"
                value={wilayah}
                onChange={setWilayah}
                options={wilayahList}
                placeholder="Pilih wilayah pelayanan"
                disabled={!pelanggan}
                error={errors.wilayah}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Rute Baru</Label>
                  <Input
                    value={rute}
                    onChange={(e) => setRute(e.target.value)}
                    placeholder="Contoh: BD502"
                    className="h-9 font-mono uppercase text-xs"
                    disabled={!pelanggan}
                    aria-invalid={!!errors.rute}
                  />
                  {errors.rute && <p className="text-xs text-destructive">{errors.rute}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Nomor Urut Baru</Label>
                  <Input
                    type="number"
                    min={1}
                    value={urut}
                    onChange={(e) => setUrut(e.target.value)}
                    className="h-9 font-mono tabular-nums text-xs"
                    disabled={!pelanggan}
                    aria-invalid={!!errors.urut}
                  />
                  {errors.urut && <p className="text-xs text-destructive">{errors.urut}</p>}
                </div>
              </div>

              {/* Pratinjau Perubahan */}
              {pelanggan && rute && urut && (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-muted/40 p-2 font-mono text-xs">
                  <span>
                    {pelanggan.rute} #{pelanggan.urut}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {rute.toUpperCase()} #{urut}
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-border/50 bg-muted/20 px-3 py-2.5 shrink-0">
            <Button variant="outline" size="sm" onClick={reset} disabled={menyimpan}>
              Batal
            </Button>
            <Button size="sm" onClick={simpan} disabled={!pelanggan || menyimpan}>
              {menyimpan && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Simpan
            </Button>
          </CardFooter>
        </Card>

        {/* Kolom Kanan: Tabel Riwayat Mutasi */}
        <Card className="border-border bg-card shadow-2xs flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-label-12 font-bold text-foreground">
                  Riwayat Mutasi Rute Pelanggan
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar transaksi mutasi posisi rute baca pelanggan yang telah tersimpan
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-label-11">
                {riwayat.length} Catatan
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
            <Table containerClassName="h-full overflow-auto">
              <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-xs [&_th]:z-20">
                <TableRow className="h-8">
                  <TableHead className="w-12 text-center font-mono text-label-11">No</TableHead>
                  <TableHead className="font-mono text-label-11">Waktu Input</TableHead>
                  <TableHead className="font-mono text-label-11">No. Pelanggan</TableHead>
                  <TableHead className="font-mono text-label-11">Nama Pelanggan</TableHead>
                  <TableHead className="font-mono text-label-11">Rute Lama</TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="font-mono text-label-11">Rute Baru</TableHead>
                  <TableHead className="font-mono text-label-11">Petugas Input</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memuat && riwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                      Memuat data riwayat mutasi...
                    </TableCell>
                  </TableRow>
                ) : riwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada riwayat mutasi rute yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  riwayat.map((r, i) => (
                    <TableRow key={r.id} className="h-9 hover:bg-muted/40">
                      <TableCell className="text-center text-xs tabular-nums text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {r.tglInput}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {r.noPel}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {r.nama}
                      </TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        <Badge variant="outline" className="font-mono text-label-11">
                          {r.lama.rute} #{r.lama.urut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs px-1 text-muted-foreground text-center">
                        <ArrowRight className="size-3" />
                      </TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono text-label-11">
                          {r.baru.rute} #{r.baru.urut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {r.inputBy}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
