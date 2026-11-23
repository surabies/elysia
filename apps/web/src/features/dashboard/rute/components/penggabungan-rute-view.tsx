"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { OpsiItem, PelangganItem } from "../types";
import { wilayahPelayananOpsi } from "../types";
import { FieldSelect } from "./field-select";
import { PindahRuteDialog } from "./pindah-rute-dialog";

export function PenggabunganRuteView() {
  // 1. Filter bertingkat: Wilayah > Petugas > Rute (Default: WP 5)
  const [wilayah, setWilayah] = useState("WP 5");
  const [wilayahList, setWilayahList] = useState<OpsiItem[]>(wilayahPelayananOpsi);
  const [petugas, setPetugas] = useState("");
  const [rute, setRute] = useState("");
  const [petugasOpsi, setPetugasOpsi] = useState<OpsiItem[]>([]);
  const [ruteOpsi, setRuteOpsi] = useState<OpsiItem[]>([]);

  // 2. Data tabel & pilihan baris
  const [data, setData] = useState<PelangganItem[] | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);

  const ubahWilayah = async (v: string) => {
    setWilayah(v);
    setPetugas("");
    setRute("");
    setRuteOpsi([]);
    try {
      const opts = await ruteApi.getPetugas(v);
      setPetugasOpsi(opts);
    } catch (err) {
      console.error("Gagal memuat petugas:", err);
      toast.error("Gagal memuat daftar petugas");
    }
  };

  // Muat opsi wilayah dan pre-load petugas untuk WP 5 saat pertama kali komponen dirender
  useEffect(() => {
    ruteApi
      .getWilayah()
      .then((opts) => {
        if (opts.length > 0) setWilayahList(opts);
      })
      .catch((err) => console.error("Gagal memuat wilayah:", err));

    ubahWilayah("WP 5");
  }, []);

  const ubahPetugas = async (v: string) => {
    setPetugas(v);
    setRute("");
    try {
      const opts = await ruteApi.getRuteByPetugas(v);
      setRuteOpsi(opts);
    } catch (err) {
      console.error("Gagal memuat rute:", err);
      toast.error("Gagal memuat daftar rute petugas");
    }
  };

  const cari = async () => {
    if (!rute) return;
    setMemuat(true);
    setTerpilih(new Set());
    try {
      const result = await ruteApi.getPelangganByRute(rute);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data pelanggan");
    } finally {
      setMemuat(false);
    }
  };

  // 3. Logika centang checkbox
  const semua = !!data?.length && terpilih.size === data.length;
  const sebagian = terpilih.size > 0 && !semua;

  const toggle = (noPel: string) =>
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(noPel)) next.delete(noPel);
      else next.add(noPel);
      return next;
    });

  const toggleSemua = () =>
    setTerpilih(semua || !data ? new Set() : new Set(data.map((p) => p.noPel)));

  const dipilih = data?.filter((p) => terpilih.has(p.noPel)) ?? [];

  // 4. Setelah dialog sukses: muat ulang data rute asal secara utuh dari server
  const selesai = async (ruteBaru: string) => {
    const totalPindah = terpilih.size;
    toast.success(`${totalPindah} pelanggan berhasil dipindahkan ke rute ${ruteBaru}`);
    setTerpilih(new Set());
    setDialog(false);

    if (rute) {
      setMemuat(true);
      try {
        const fresh = await ruteApi.getPelangganByRute(rute);
        setData(fresh);
      } catch (err) {
        console.error("Gagal memuat ulang data rute:", err);
      } finally {
        setMemuat(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar Konsisten */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-foreground text-background">
              <Users className="size-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Kelola Rute Pencatatan Petugas
            </h1>
            <Badge variant="outline" className="font-mono text-label-11">
              Penggabungan Rute
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-sans">
            Gabungkan atau pindahkan pelanggan dari satu rute baca ke rute petugas lain
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cari}
            disabled={memuat || !rute}
            className="h-8 gap-1.5 text-label-12 font-mono"
          >
            <RefreshCw className={cn("size-3.5", memuat && "animate-spin")} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. Filter Rute */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Search className="size-4 text-muted-foreground" />
            Filter Rute Asal Pelanggan
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih wilayah pelayanan, petugas, dan rute baca untuk menampilkan data pelanggan
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <FieldSelect
              label="Wilayah Pelayanan"
              value={wilayah}
              onChange={ubahWilayah}
              options={wilayahList}
              placeholder="Pilih wilayah pelayanan"
            />
            <FieldSelect
              label="Petugas Pencatat"
              value={petugas}
              onChange={ubahPetugas}
              options={petugasOpsi}
              placeholder="Pilih petugas"
              disabled={!wilayah}
            />
            <FieldSelect
              label="Kode Rute"
              value={rute}
              onChange={setRute}
              options={ruteOpsi}
              placeholder="Pilih rute"
              disabled={!petugas}
            />
            <Button
              onClick={cari}
              disabled={!rute || memuat}
              className="h-9 gap-1.5 px-4 text-xs shrink-0"
            >
              {memuat ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Search className="size-4 mr-1.5" />
              )}
              Tampilkan Pelanggan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabel Pelanggan Rute Asal */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-border/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Daftar Pelanggan Rute
              </CardTitle>
              {rute && (
                <Badge variant="outline" className="font-mono text-label-11">
                  Rute {rute}
                </Badge>
              )}
              {data && (
                <Badge variant="secondary" className="font-mono text-label-11">
                  {data.length} Pelanggan
                </Badge>
              )}
              {terpilih.size > 0 && (
                <Badge className="bg-primary text-primary-foreground font-mono text-label-11">
                  {terpilih.size} Terpilih
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              disabled={terpilih.size === 0}
              onClick={() => setDialog(true)}
              className="h-8 gap-1.5 text-label-12"
            >
              <ArrowRightLeft className="size-3.5" />
              Pindahkan Rute
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xs z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={semua ? true : sebagian ? "indeterminate" : false}
                      onCheckedChange={toggleSemua}
                      disabled={!data?.length}
                      aria-label="Pilih semua baris"
                    />
                  </TableHead>
                  <TableHead className="w-16">No. Urut</TableHead>
                  <TableHead>No. Pelanggan</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Gol. Tarif</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Rute</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memuat ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2" />
                      Memuat data pelanggan rute...
                    </TableCell>
                  </TableRow>
                ) : !data ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      Pilih filter rute di atas lalu klik Tampilkan Pelanggan.
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      Tidak ada pelanggan yang terdaftar pada rute ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((p) => {
                    const aktif = terpilih.has(p.noPel);
                    return (
                      <TableRow
                        key={p.noPel}
                        data-state={aktif ? "selected" : undefined}
                        className={cn(aktif && "bg-muted/50")}
                      >
                        <TableCell>
                          <Checkbox
                            checked={aktif}
                            onCheckedChange={() => toggle(p.noPel)}
                            aria-label={`Pilih ${p.nama}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {p.urut}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          {p.noPel}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {p.nama}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="font-mono text-label-11">
                            {p.golTarif}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                          {p.alamat}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <Badge variant="outline">{p.rute}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Modal Dialog Pindah Rute */}
      <PindahRuteDialog
        open={dialog}
        onOpenChange={setDialog}
        pelanggan={dipilih}
        ruteAsal={rute}
        onSelesai={selesai}
      />
    </div>
  );
}
