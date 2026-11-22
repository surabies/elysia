// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/ModalEditAturan.tsx
// Modal Dialog Edit Parameter Aturan & Simulator Dampak (Dry-Run)

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, Play } from 'lucide-react';
import type { RuleItem, EditFormData, PreviewData } from './types';

interface ModalEditAturanProps {
  rule: RuleItem | null;
  formData: EditFormData;
  canEdit: boolean;
  isPreviewing: boolean;
  isSubmitting: boolean;
  previewData: PreviewData | null;
  alasanPerubahan: string;
  onClose: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<EditFormData>>;
  onAlasanChange: (val: string) => void;
  onPreview: () => void;
  onSubmit: () => void;
}

export function ModalEditAturan({
  rule,
  formData,
  canEdit,
  isPreviewing,
  isSubmitting,
  previewData,
  alasanPerubahan,
  onClose,
  onFormChange,
  onAlasanChange,
  onPreview,
  onSubmit,
}: ModalEditAturanProps) {
  if (!rule) return null;

  return (
    <Dialog open={Boolean(rule)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-5 space-y-4">
        <DialogHeader className="p-0 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-label-14 font-semibold text-foreground">
              Edit Parameter Aturan Anomali
            </DialogTitle>
            <Badge variant="blue-subtle" className="font-mono text-[10px]">
              {rule.kode}
            </Badge>
          </div>
          <DialogDescription className="text-copy-13 text-muted-foreground">
            {rule.nama} &mdash; {rule.deskripsi}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Switch Keaktifan */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-label-13 font-medium text-foreground">
                Status Keaktifan Aturan
              </Label>
              <p className="text-label-11 text-muted-foreground">
                Bila nonaktif, aturan ini akan dilewati selama proses evaluasi pembacaan meter.
              </p>
            </div>
            <Switch
              disabled={!canEdit}
              checked={formData.aktif}
              onCheckedChange={(val) => onFormChange((prev) => ({ ...prev, aktif: val }))}
            />
          </div>

          {/* Form Field Ambang M3 */}
          {(rule.minM3 !== null || rule.maxM3 !== null || rule.kode.includes('M3')) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-label-12 font-medium text-foreground">Ambang Bawah (Min M³)</Label>
                <Input
                  disabled={!canEdit}
                  type="number"
                  placeholder="Contoh: 75"
                  value={formData.minM3}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, minM3: e.target.value }))}
                  className="h-8 text-xs font-mono bg-card"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-label-12 font-medium text-foreground">Ambang Atas (Max M³)</Label>
                <Input
                  disabled={!canEdit}
                  type="number"
                  placeholder="Opsional"
                  value={formData.maxM3}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, maxM3: e.target.value }))}
                  className="h-8 text-xs font-mono bg-card"
                />
              </div>
            </div>
          )}

          {/* Form Field Ambang Persen */}
          {(rule.minPersen !== null ||
            rule.maxPersen !== null ||
            rule.kode.includes('DEVIASI') ||
            rule.kode.includes('RELATIF')) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-label-12 font-medium text-foreground">Ambang Bawah (Min %)</Label>
                <Input
                  disabled={!canEdit}
                  type="number"
                  placeholder="Contoh: 30"
                  value={formData.minPersen}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, minPersen: e.target.value }))}
                  className="h-8 text-xs font-mono bg-card"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-label-12 font-medium text-foreground">Ambang Atas (Max %)</Label>
                <Input
                  disabled={!canEdit}
                  type="number"
                  placeholder="Contoh: 50"
                  value={formData.maxPersen}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, maxPersen: e.target.value }))}
                  className="h-8 text-xs font-mono bg-card"
                />
              </div>
            </div>
          )}

          {/* Acuan Pembanding & Arah Deviasi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-label-12 font-medium text-foreground">Acuan Pembanding</Label>
              <Select
                disabled={!canEdit}
                value={formData.acuanPembanding}
                onValueChange={(val) => onFormChange((prev) => ({ ...prev, acuanPembanding: val }))}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Pilih acuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAKAI_LALU" className="text-xs">
                    Pemakaian Bulan Lalu (Flat)
                  </SelectItem>
                  <SelectItem value="RATA_HISTORIS" className="text-xs">
                    Rata-rata Historis (SNI)
                  </SelectItem>
                  <SelectItem value="STAND_AWAL" className="text-xs">
                    Stand Awal (Fisik)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-label-12 font-medium text-foreground">Arah Deviasi</Label>
              <Select
                disabled={!canEdit}
                value={formData.arahDeviasi}
                onValueChange={(val) => onFormChange((prev) => ({ ...prev, arahDeviasi: val }))}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Pilih arah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NAIK" className="text-xs">
                    Lonjakan Saja (Naik)
                  </SelectItem>
                  <SelectItem value="TURUN" className="text-xs">
                    Penurunan Saja (Turun)
                  </SelectItem>
                  <SelectItem value="KEDUANYA" className="text-xs">
                    Kedua Arah (Deviasi ±)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parameter Tambahan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-label-12 font-medium text-foreground">
                Syarat Pemakaian Lalu (M³)
              </Label>
              <Input
                disabled={!canEdit}
                type="number"
                placeholder="Contoh: 10"
                value={formData.syaratPakaiLaluDibawah}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, syaratPakaiLaluDibawah: e.target.value }))
                }
                className="h-8 text-xs font-mono bg-card"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-label-12 font-medium text-foreground">
                Syarat Periode Berturut (Nilai N)
              </Label>
              <Input
                disabled={!canEdit}
                type="number"
                placeholder="Contoh: 3"
                value={formData.syaratPeriodeBerturut}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, syaratPeriodeBerturut: e.target.value }))
                }
                className="h-8 text-xs font-mono bg-card"
              />
            </div>
          </div>

          {/* Box Hasil Pratinjau Dampak (Dry-Run Result) */}
          {previewData && (
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-label-12 font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Hasil Pratinjau Dampak (Dry-Run)
                </span>
                <Badge variant="teal-subtle" className="text-[10px] font-mono">
                  {previewData.jumlahBarisBerubah ?? previewData.totalBarisBerubah ?? 0} baris berubah
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-label-11">
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground block">Anomali</span>
                  <span className="font-mono font-semibold text-foreground">
                    {previewData.sebelum?.anomali ?? 0} &rarr; {previewData.sesudah?.anomali ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground block">Peringatan</span>
                  <span className="font-mono font-semibold text-foreground">
                    {previewData.sebelum?.warning ?? previewData.sebelum?.peringatan ?? 0} &rarr;{' '}
                    {previewData.sesudah?.warning ?? previewData.sesudah?.peringatan ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground block">Normal</span>
                  <span className="font-mono font-semibold text-foreground">
                    {previewData.sebelum?.normal ?? 0} &rarr; {previewData.sesudah?.normal ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Input Alasan Perubahan (Wajib) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-label-12 font-medium text-foreground">
                Alasan Perubahan Parameter (Wajib Tercatat di Audit Log)
              </Label>
              <span className="text-label-11 text-muted-foreground">Minimal 5 karakter</span>
            </div>
            <Textarea
              disabled={!canEdit}
              placeholder="Contoh: Penyesuaian ambang lonjakan kubikasi sesuai SK Direksi No. 42/2026..."
              value={alasanPerubahan}
              onChange={(e) => onAlasanChange(e.target.value)}
              className="text-xs min-h-[70px] bg-card"
            />
          </div>
        </div>

        <DialogFooter className="p-0 pt-2 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onPreview}
            disabled={isPreviewing}
            className="h-8 text-xs gap-1.5"
          >
            <Play className={`size-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
            {isPreviewing ? 'Menghitung Simulasi…' : 'Pratinjau Dampak (Dry-Run)'}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            {canEdit && (
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={onSubmit}
                disabled={isSubmitting || alasanPerubahan.trim().length < 5}
                className="h-8 text-xs gap-1.5"
              >
                {isSubmitting ? 'Menerapkan…' : 'Simpan & Terapkan'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
