"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OpsiItem, PelangganItem } from "../types";
import { FieldSelect } from "./field-select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pelanggan: PelangganItem[];
  ruteAsal: string;
  onSelesai: (ruteBaru: string) => void;
};

export function PindahRuteDialog({
  open,
  onOpenChange,
  pelanggan,
  ruteAsal,
  onSelesai,
}: Props) {
  const [opsi, setOpsi] = useState<OpsiItem[]>([]);
  const [ruteBaru, setRuteBaru] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRuteBaru("");
    fetch(`/api/rute/tujuan?kecuali=${encodeURIComponent(ruteAsal)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setOpsi(json.data);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat rute tujuan:", err);
        toast.error("Gagal memuat daftar rute tujuan");
      });
  }, [open, ruteAsal]);

  const simpan = async () => {
    if (!ruteBaru) {
      toast.error("Pilih rute baru terlebih dahulu");
      return;
    }
    setMenyimpan(true);
    try {
      const res = await fetch("/api/rute/penggabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noPelList: pelanggan.map((p) => p.noPel),
          ruteTujuan: ruteBaru,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memindahkan rute pelanggan");
      }
      onSelesai(ruteBaru);
    } catch (err: any) {
      toast.error(err.message || "Gagal memindahkan rute pelanggan");
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pindahkan pelanggan ke rute lain</DialogTitle>
          <DialogDescription>
            {pelanggan.length} pelanggan dari rute {ruteAsal} akan dipindahkan.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">No</TableHead>
                <TableHead>No. pelanggan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Rute</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pelanggan.map((p, i) => (
                <TableRow key={p.noPel}>
                  <TableCell className="tabular-nums">{i + 1}</TableCell>
                  <TableCell className="font-mono">{p.noPel}</TableCell>
                  <TableCell>{p.nama}</TableCell>
                  <TableCell className="text-muted-foreground">{p.alamat}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.rute}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <FieldSelect
          label="Dipindahkan ke rute"
          value={ruteBaru}
          onChange={setRuteBaru}
          options={opsi}
          placeholder="Pilih rute baru"
        />

        {ruteBaru && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2 font-mono text-xs">
            <span>{ruteAsal}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className="font-semibold">{ruteBaru}</span>
            <span className="text-muted-foreground">· {pelanggan.length} pelanggan</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={menyimpan}>
            Batal
          </Button>
          <Button onClick={simpan} disabled={!ruteBaru || menyimpan}>
            {menyimpan && <Loader2 className="animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
