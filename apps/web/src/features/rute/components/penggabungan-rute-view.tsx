"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPelanggan,
  getPetugas,
  getRute,
  getWilayah,
  wilayahOpsi as fallbackWilayahOpsi,
  type Opsi,
  type Pelanggan,
} from "../data";
import { FieldSelect } from "./field-select";
import { PindahRuteDialog } from "./pindah-rute-dialog";
import { PageHeader, Panel } from "./ui-parts";

export function PenggabunganRuteView() {
  // 1. Filter bertingkat: wilayah > petugas > rute
  const [wilayah, setWilayah] = useState("");
  const [wilayahList, setWilayahList] = useState<Opsi[]>(fallbackWilayahOpsi);
  const [petugas, setPetugas] = useState("");
  const [rute, setRute] = useState("");
  const [petugasOpsi, setPetugasOpsi] = useState<Opsi[]>([]);
  const [ruteOpsi, setRuteOpsi] = useState<Opsi[]>([]);

  // 2. Data tabel + pilihan baris
  const [data, setData] = useState<Pelanggan[] | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);

  // Muat opsi wilayah saat pertama kali komponen dirender
  useEffect(() => {
    getWilayah()
      .then((opts) => {
        if (opts.length > 0) setWilayahList(opts);
      })
      .catch((err) => console.error("Gagal memuat wilayah:", err));
  }, []);

  const ubahWilayah = async (v: string) => {
    setWilayah(v);
    setPetugas("");
    setRute("");
    setRuteOpsi([]);
    try {
      setPetugasOpsi(await getPetugas(v));
    } catch (err) {
      console.error("Gagal memuat petugas:", err);
      toast.error("Gagal memuat daftar petugas");
    }
  };

  const ubahPetugas = async (v: string) => {
    setPetugas(v);
    setRute("");
    try {
      setRuteOpsi(await getRute(v));
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
      const result = await getPelanggan(rute);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data pelanggan");
    } finally {
      setMemuat(false);
    }
  };

  // 3. Logika centang
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

  // 4. Setelah dialog sukses: muat ulang data rute asal dari server
  const selesai = async (ruteBaru: string) => {
    const totalPindah = terpilih.size;
    toast.success(`${totalPindah} pelanggan dipindahkan ke rute ${ruteBaru}`);
    setTerpilih(new Set());
    setDialog(false);

    // Muat ulang data rute asal secara utuh dari server (sesuai instruksi poin 8.5)
    if (rute) {
      setMemuat(true);
      try {
        const freshData = await getPelanggan(rute);
        setData(freshData);
      } catch (err) {
        console.error("Gagal memuat ulang data rute:", err);
      } finally {
        setMemuat(false);
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Kelola rute pencatatan petugas"
        description="Gabungkan atau pindahkan pelanggan dari satu rute baca ke rute petugas lain."
      />

      <Panel title="Filter rute" icon={<Search />}>
        <div className="grid items-end gap-4 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <FieldSelect
            label="Wilayah"
            value={wilayah}
            onChange={ubahWilayah}
            options={wilayahList}
            placeholder="Pilih wilayah"
          />
          <FieldSelect
            label="Petugas"
            value={petugas}
            onChange={ubahPetugas}
            options={petugasOpsi}
            placeholder="Pilih petugas"
            disabled={!wilayah}
          />
          <FieldSelect
            label="Rute"
            value={rute}
            onChange={setRute}
            options={ruteOpsi}
            placeholder="Pilih rute"
            disabled={!petugas}
          />
          <Button
            onClick={cari}
            disabled={!rute || memuat}
            className="md:col-span-2 xl:col-span-1"
          >
            {memuat ? <Loader2 className="animate-spin" /> : <Search />}
            Cari data
          </Button>
        </div>
      </Panel>

      <Panel
        title={
          <>
            Data pelanggan
            {data && (
              <Badge variant="secondary" className="tabular-nums">
                {data.length}
              </Badge>
            )}
          </>
        }
        icon={<Users />}
        actions={
          <div className="flex items-center gap-3">
            {terpilih.size > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {terpilih.size} dipilih
              </span>
            )}
            <Button size="sm" disabled={terpilih.size === 0} onClick={() => setDialog(true)}>
              <ArrowRightLeft />
              Pindahkan ke rute
            </Button>
          </div>
        }
      >
        <div className="max-h-[520px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={semua ? true : sebagian ? "indeterminate" : false}
                    onCheckedChange={toggleSemua}
                    disabled={!data?.length}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="w-14">No</TableHead>
                <TableHead>No. pelanggan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Rute</TableHead>
                <TableHead>Tgl pasang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memuat ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={7}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    {data
                      ? "Tidak ada pelanggan di rute ini."
                      : "Pilih wilayah, petugas, dan rute, lalu klik Cari data."}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((p) => (
                  <TableRow
                    key={p.noPel}
                    data-state={terpilih.has(p.noPel) ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => toggle(p.noPel)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={terpilih.has(p.noPel)}
                        onCheckedChange={() => toggle(p.noPel)}
                        aria-label={`Pilih ${p.nama}`}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">{p.urut}</TableCell>
                    <TableCell className="font-mono">{p.noPel}</TableCell>
                    <TableCell className="font-medium">{p.nama}</TableCell>
                    <TableCell className="text-muted-foreground">{p.alamat}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.rute}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{p.tglPasang}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

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
