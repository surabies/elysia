// features/dashboard/import/components/shared/ImportSafetyModal.tsx
"use client";

import * as React from "react";
import {
  AlertTriangle,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  StatusDot,
} from "@cater/ui";
import { cn } from "@/lib/utils";

export type ImportMode = "SKIP_EXISTING" | "FORCE_RESET_OVERWRITE";

export interface LapDataMeterPreflightInfo {
  thbl: string;
  isLocked: boolean;
  isLockedPeriode: boolean;
  hasLockedBilling: boolean;
  totalExisting: number;
  verifiedV3: number;
  verifiedV2: number;
  verifiedV1: number;
  submitted: number;
}

export interface ImportSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
  isSubmitting?: boolean;
  preflightInfo: LapDataMeterPreflightInfo | null;
  totalRowsToImport: number;
}

export function ImportSafetyModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  preflightInfo,
  totalRowsToImport,
}: ImportSafetyModalProps) {
  const [selectedMode, setSelectedMode] = React.useState<ImportMode>("SKIP_EXISTING");
  const [confirmKeyword, setConfirmKeyword] = React.useState("");

  // Reset state tiap kali modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMode("SKIP_EXISTING");
      setConfirmKeyword("");
    }
  }, [isOpen]);

  if (!preflightInfo) return null;

  const isLocked = preflightInfo.isLocked;
  const isOverwrite = selectedMode === "FORCE_RESET_OVERWRITE";
  const canProceed = !isOverwrite || confirmKeyword.trim().toUpperCase() === "TIMPA";

  const handleConfirm = () => {
    if (!canProceed || isSubmitting) return;
    onConfirm(selectedMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-xl sm:max-w-2xl p-6">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Konfirmasi Keamanan: Data Periode Sudah Ada
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Sistem mendeteksi data pembacaan meter untuk periode{" "}
                <strong className="text-foreground font-mono">{preflightInfo.thbl}</strong> sudah tercatat
                di database.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Ringkasan Status Database Saat Ini (Vercel Clean Surface) */}
        <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground">Status Data Tersimpan ({preflightInfo.thbl})</span>
            {isLocked ? (
              <Badge variant="destructive" className="flex items-center gap-1 font-mono text-[10px]">
                <Lock className="size-3" />
                Periode Terkunci Billing
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                <StatusDot state="ready" size="sm" showPulse />
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Periode Aktif
                </Badge>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            <div className="rounded-md border border-border bg-card p-2 text-center shadow-2xs">
              <span className="text-[11px] text-muted-foreground block">Total di DB</span>
              <strong className="font-mono text-sm font-semibold text-foreground">
                {preflightInfo.totalExisting.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-center shadow-2xs dark:bg-emerald-500/10">
              <span className="text-[11px] block font-medium text-emerald-700 dark:text-emerald-400">Lolos V3</span>
              <strong className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {preflightInfo.verifiedV3.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-2 text-center shadow-2xs dark:bg-blue-500/10">
              <span className="text-[11px] block font-medium text-blue-700 dark:text-blue-400">Lolos V2/V1</span>
              <strong className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                {(preflightInfo.verifiedV2 + preflightInfo.verifiedV1).toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-border bg-card p-2 text-center shadow-2xs">
              <span className="text-[11px] text-muted-foreground block">Menunggu</span>
              <strong className="font-mono text-sm font-semibold text-muted-foreground">
                {preflightInfo.submitted.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>
        </div>

        {/* Pilihan Mode Impor (Vercel Choicebox pattern) */}
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-medium text-foreground">
            Pilih tindakan penanganan untuk {totalRowsToImport.toLocaleString("id-ID")} baris data impor:
          </span>

          <div className="grid grid-cols-1 gap-2">
            {/* Opsi 1: Mode Aman (Default) */}
            <div
              onClick={() => setSelectedMode("SKIP_EXISTING")}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-150",
                selectedMode === "SKIP_EXISTING"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-2xs dark:bg-emerald-500/10"
                  : "border-border bg-card hover:bg-muted/50 hover:border-border"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selectedMode === "SKIP_EXISTING"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-card"
                )}
              >
                {selectedMode === "SKIP_EXISTING" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">
                    Mode Aman: Lewati Data yang Sudah Ada (Direkomendasikan)
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">Bawaan</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Hanya menambahkan pelanggan baru yang belum terdaftar. Data yang sudah ada{" "}
                  <strong className="text-foreground">dilewati (tidak ditimpa)</strong>. Status verifikasi V1/V2/V3 dan hasil koreksi tetap utuh 100%.
                </p>
              </div>
            </div>

            {/* Opsi 2: Mode Darurat (Force Reset Overwrite) */}
            <div
              onClick={() => !isLocked && setSelectedMode("FORCE_RESET_OVERWRITE")}
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-3 transition-all duration-150",
                isLocked
                  ? "cursor-not-allowed border-border/50 bg-muted/30 opacity-60"
                  : "cursor-pointer",
                selectedMode === "FORCE_RESET_OVERWRITE" && !isLocked
                  ? "border-red-300 bg-red-50/30 dark:border-red-900/60 dark:bg-red-950/20 shadow-2xs"
                  : !isLocked && "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selectedMode === "FORCE_RESET_OVERWRITE"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-border bg-card"
                )}
              >
                {selectedMode === "FORCE_RESET_OVERWRITE" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Mode Pemulihan: Timpa Stand & Reset Verifikasi
                  </span>
                  {isLocked ? (
                    <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0">
                      Terkunci
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0">
                      Risiko Tinggi
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Khusus koreksi salah berkas/taksasi masal. Menimpa angka stand lama,{" "}
                  <strong className="text-foreground">menghapus revisi manual</strong>, dan{" "}
                  <strong className="text-red-700 dark:text-red-400 font-medium">
                    mereset status verifikasi {preflightInfo.verifiedV3 > 0 ? `(${preflightInfo.verifiedV3} lolos V3)` : ""} kembali ke Menunggu (SUBMITTED)
                  </strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Operasi Kritis & Konfirmasi Bertingkat jika Memilih Timpa Penuh */}
          {isOverwrite && !isLocked && (
            <div className="rounded-lg border border-red-200 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/20 p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                  <AlertTriangle className="size-4" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-400">
                      Operasi Kritis & Konfirmasi Bertingkat
                    </h4>
                    <Badge variant="destructive" className="font-mono text-[9px] px-1.5 py-0">
                      Irreversible
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Operasi ini akan menimpa data pembacaan meter dan membatalkan seluruh status verifikasi sebelumnya.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-red-200/50 dark:border-red-900/30">
                <p className="text-xs text-muted-foreground">
                  Ketik kata verifikasi{" "}
                  <span className="font-mono font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded text-[11px]">
                    TIMPA
                  </span>{" "}
                  untuk mengaktifkan tombol eksekusi:
                </p>
                <Input
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="Ketik TIMPA untuk konfirmasi..."
                  className="font-mono text-xs uppercase bg-card border-red-200 dark:border-red-900/60 focus-visible:ring-red-500/20 focus-visible:border-red-500 h-8"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            variant={isOverwrite ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              "Memproses..."
            ) : isOverwrite ? (
              "Timpa & Reset"
            ) : (
              "Lanjutkan Impor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
