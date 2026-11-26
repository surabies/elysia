// features/dashboard/import/components/shared/ImportSafetyModal.tsx
import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IconStack } from "@/components/reui/icon-stack";

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
      <DialogContent className="max-w-2xl sm:max-w-3xl p-6">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-4">
            <IconStack className="text-ds-amber-600 shrink-0 scale-90">
              <ShieldAlert className="size-5 text-ds-amber-600" />
            </IconStack>
            <div>
              <DialogTitle className="text-label-18 font-semibold text-foreground">
                Konfirmasi Keamanan: Data Periode Sudah Ada
              </DialogTitle>
              <DialogDescription className="text-copy-13 text-muted-foreground mt-0.5">
                Sistem mendeteksi data pembacaan meter untuk periode{" "}
                <strong className="text-foreground font-mono">{preflightInfo.thbl}</strong> sudah tercatat
                di database.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Ringkasan Status Database Saat Ini (Vercel Clean Surface) */}
        <div className="rounded-lg border border-border bg-ds-gray-100 p-3.5 space-y-2.5 dark:bg-ds-gray-200/40">
          <div className="flex items-center justify-between text-copy-13 font-medium">
            <span className="text-foreground">Status Data Tersimpan ({preflightInfo.thbl})</span>
            {isLocked ? (
              <Badge variant="red-subtle" className="flex items-center gap-1">
                <Lock className="size-3" />
                Periode Terkunci Billing
              </Badge>
            ) : (
              <Badge variant="green-subtle">
                Periode Aktif
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2.5 pt-0.5">
            <div className="rounded-md border border-border bg-card p-2 text-center">
              <span className="text-label-11 text-muted-foreground block">Total di DB</span>
              <strong className="text-label-16-mono text-foreground">
                {preflightInfo.totalExisting.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-ds-green-400/60 bg-ds-green-100/60 p-2 text-center dark:bg-ds-green-950/20">
              <span className="text-label-11 block font-medium text-ds-green-900 dark:text-ds-green-300">Lolos V3</span>
              <strong className="text-label-16-mono font-bold text-ds-green-700 dark:text-ds-green-400">
                {preflightInfo.verifiedV3.toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-ds-blue-400/60 bg-ds-blue-100/60 p-2 text-center dark:bg-ds-blue-950/20">
              <span className="text-label-11 block font-medium text-ds-blue-900 dark:text-ds-blue-300">Lolos V2/V1</span>
              <strong className="text-label-16-mono font-bold text-ds-blue-700 dark:text-ds-blue-400">
                {(preflightInfo.verifiedV2 + preflightInfo.verifiedV1).toLocaleString("id-ID")}
              </strong>
            </div>
            <div className="rounded-md border border-border bg-card p-2 text-center">
              <span className="text-label-11 text-muted-foreground block">Menunggu</span>
              <strong className="text-label-16-mono text-muted-foreground">
                {preflightInfo.submitted.toLocaleString("id-ID")}
              </strong>
            </div>
          </div>
        </div>

        {/* Pilihan Mode Impor (Vercel Clean Surface / No Heavy Rings) */}
        <div className="space-y-3 pt-1">
          <span className="text-label-13 font-medium text-foreground">
            Pilih tindakan penanganan untuk {totalRowsToImport.toLocaleString("id-ID")} baris data impor:
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Opsi 1: Mode Aman (Default) */}
            <div
              onClick={() => setSelectedMode("SKIP_EXISTING")}
              className={cn(
                "relative flex cursor-pointer items-start gap-3.5 rounded-lg border p-3.5 transition-colors duration-150",
                selectedMode === "SKIP_EXISTING"
                  ? "border-ds-green-600 bg-ds-green-100/40 dark:border-ds-green-500 dark:bg-ds-green-950/20"
                  : "border-border bg-card hover:border-ds-gray-500 hover:bg-ds-gray-100 dark:hover:bg-ds-gray-200"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selectedMode === "SKIP_EXISTING"
                    ? "border-ds-green-600 bg-ds-green-600 text-white"
                    : "border-border bg-card"
                )}
              >
                {selectedMode === "SKIP_EXISTING" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-ds-green-700 dark:text-ds-green-400" />
                  <span className="text-label-14 font-semibold text-foreground">
                    Mode Aman: Lewati Data yang Sudah Ada (Direkomendasikan)
                  </span>
                  <Badge variant="pill" className="text-label-10">Bawaan</Badge>
                </div>
                <p className="text-copy-13 text-muted-foreground leading-relaxed">
                  Hanya menambahkan pelanggan baru yang belum terdaftar. Data yang sudah ada{" "}
                  <strong className="text-foreground">dilewati (tidak ditimpa)</strong>. Status verifikasi V1/V2/V3 dan hasil koreksi tetap utuh 100%.
                </p>
              </div>
            </div>

            {/* Opsi 2: Mode Darurat (Force Reset Overwrite) */}
            <div
              onClick={() => !isLocked && setSelectedMode("FORCE_RESET_OVERWRITE")}
              className={cn(
                "relative flex items-start gap-3.5 rounded-lg border p-3.5 transition-colors duration-150",
                isLocked
                  ? "cursor-not-allowed border-border/50 bg-ds-gray-100 opacity-60 dark:bg-ds-gray-200"
                  : "cursor-pointer",
                selectedMode === "FORCE_RESET_OVERWRITE" && !isLocked
                  ? "border-ds-red-600 bg-ds-red-100/35 dark:border-ds-red-500 dark:bg-ds-red-950/20"
                  : !isLocked && "border-border bg-card hover:border-ds-gray-500 hover:bg-ds-gray-100 dark:hover:bg-ds-gray-200"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selectedMode === "FORCE_RESET_OVERWRITE"
                    ? "border-ds-red-600 bg-ds-red-600 text-white"
                    : "border-border bg-card"
                )}
              >
                {selectedMode === "FORCE_RESET_OVERWRITE" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-ds-red-700 dark:text-ds-red-400" />
                  <span className="text-label-14 font-semibold text-ds-red-700 dark:text-ds-red-400">
                    Mode Pemulihan: Timpa Stand & Reset Verifikasi
                  </span>
                  {isLocked && <Badge variant="red-subtle">Terkunci</Badge>}
                </div>
                <p className="text-copy-13 text-muted-foreground leading-relaxed">
                  Khusus koreksi salah berkas/taksasi masal. Menimpa angka stand lama,{" "}
                  <strong className="text-foreground">menghapus revisi manual</strong>, dan{" "}
                  <strong className="text-ds-red-700 dark:text-ds-red-400">
                    mereset status verifikasi {preflightInfo.verifiedV3 > 0 ? `(${preflightInfo.verifiedV3} lolos V3)` : ""} kembali ke Menunggu (SUBMITTED)
                  </strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Kotak Konfirmasi Pengaman jika Memilih Timpa Penuh */}
          {isOverwrite && !isLocked && (
            <div className="rounded-lg border border-ds-red-400/50 bg-ds-red-100/30 p-3 space-y-2 animate-in fade-in duration-150 dark:bg-ds-red-950/25">
              <div className="flex items-center gap-2 text-copy-13 font-medium text-ds-red-900 dark:text-ds-red-200">
                <AlertTriangle className="size-4 shrink-0 text-ds-red-600" />
                <span>
                  Konfirmasi Pengaman: Ketik kata <strong className="font-mono underline">TIMPA</strong> untuk membuka tombol eksekusi:
                </span>
              </div>
              <Input
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Ketik TIMPA..."
                className="font-mono text-copy-14 bg-card"
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            variant={isOverwrite ? "destructive" : "default"}
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
