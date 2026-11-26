"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  KpiFormErrors,
  KpiOwner,
  KpiUnitOption,
  NewKpiFormData,
  Perspective,
} from "../types/KpiTypes"
import {
  deriveKpiDirection,
  getUnitAdornment,
  isKpiFormDirty,
  parseNumericField,
  validateKpiForm,
  type ParsedNewKpi,
} from "../lib/KpiFormValidation"

interface AddKpiSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  perspectives: Perspective[]
  owners: KpiOwner[]
  selectedPeriod: string
  preselectedObjectiveId?: string | null
  onAddKpi: (parsed: ParsedNewKpi) => void
}

export function AddKpiSheet({
  open,
  onOpenChange,
  perspectives,
  owners,
  selectedPeriod,
  preselectedObjectiveId,
  onAddKpi,
}: AddKpiSheetProps) {
  // Ambil objective awal default
  const defaultObjectiveId = React.useMemo(() => {
    if (preselectedObjectiveId) return preselectedObjectiveId
    const firstPersp = perspectives[0]
    return firstPersp?.objectives[0]?.id ?? ""
  }, [perspectives, preselectedObjectiveId])

  const defaultOwnerId = React.useMemo(() => {
    return owners[0]?.id ?? ""
  }, [owners])

  const [formData, setFormData] = React.useState<NewKpiFormData>({
    name: "",
    objectiveId: defaultObjectiveId,
    ownerId: defaultOwnerId,
    unit: "percent",
    weight: "",
    baseline: "",
    target: "",
    actual: "",
  })

  const [errors, setErrors] = React.useState<KpiFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)

  const nameInputRef = React.useRef<HTMLInputElement | null>(null)

  // Reset form setiap sheet dibuka
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        objectiveId: defaultObjectiveId,
        ownerId: defaultOwnerId,
        unit: "percent",
        weight: "",
        baseline: "",
        target: "",
        actual: "",
      })
      setErrors({})
      setIsSubmitting(false)
      setShowDiscardDialog(false)

      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open, defaultObjectiveId, defaultOwnerId])

  // Hitung unit adornment (prefix/suffix)
  const adornment = React.useMemo(() => {
    return getUnitAdornment(formData.unit)
  }, [formData.unit])

  // Deteksi petunjuk arah dinamis dalam bahasa Indonesia
  const directionHint = React.useMemo(() => {
    const b = parseNumericField(formData.baseline)
    const t = parseNumericField(formData.target)
    if (b === null || t === null) {
      return "Nilai target dibandingkan dengan baseline awal tahun."
    }
    const dir = deriveKpiDirection(b, t)
    if (dir === "higher") {
      return "Makin tinggi makin baik (↑ Sesuai Target)"
    }
    if (dir === "lower") {
      return "Makin rendah makin baik (↓ Sesuai Target)"
    }
    return "Target tidak boleh sama dengan baseline"
  }, [formData.baseline, formData.target])

  // Handler perubahan field
  const handleChangeField = (field: keyof NewKpiFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Permintaan tutup sheet dengan proteksi guard
  const handleRequestClose = () => {
    const isDirty = isKpiFormDirty(formData, defaultObjectiveId, defaultOwnerId)
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onOpenChange(false)
    }
  }

  // Submit form
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    const validation = validateKpiForm(formData)
    if (!validation.isValid || !validation.parsed) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    try {
      onAddKpi(validation.parsed)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRequestClose()
          } else {
            onOpenChange(true)
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex h-full w-full max-w-full flex-col gap-0 p-0 sm:max-w-[520px] bg-background border-l border-border shadow-2xl"
        >
          {/* 1. Header (Fixed di atas) */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 bg-background">
            <div>
              <h2 className="text-base font-bold text-foreground">Tambah Indikator KPI</h2>
              <p className="text-xs text-muted-foreground">
                Periode penilaian aktif: <span className="font-semibold text-foreground">{selectedPeriod}</span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRequestClose}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Tutup (Esc)"
            >
              <X className="size-4" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>

          {/* 2. Isi Form (Scroll vertikal tersendiri) */}
          <form
            id="add-kpi-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-5 space-y-4"
          >
            {/* Kartu 1: Definisi & Penanggung Jawab */}
            <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                <h3 className="text-xs font-semibold text-foreground tracking-tight">
                  Definisi Indikator & Penanggung Jawab
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Penempatan indikator dalam sasaran kerja dan aktor penanggung jawab.
                </p>
              </div>

              <div className="p-4 space-y-3.5">
                {/* Field: Nama KPI */}
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-name" className="text-xs font-medium text-foreground">
                    Nama Indikator KPI
                  </Label>
                  <Input
                    id="kpi-name"
                    ref={nameInputRef}
                    value={formData.name}
                    onChange={(e) => handleChangeField("name", e.target.value)}
                    placeholder="misal: Kepatuhan Radius GPS Catat Meter"
                    className={`h-8 text-xs bg-background ${
                      errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-destructive font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Field: Sasaran Strategis (Objective) */}
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-objective" className="text-xs font-medium text-foreground">
                    Sasaran Strategis (Objektif)
                  </Label>
                  <Select
                    value={formData.objectiveId}
                    onValueChange={(val) => handleChangeField("objectiveId", val)}
                  >
                    <SelectTrigger
                      id="kpi-objective"
                      size="sm"
                      className={`w-full text-xs bg-background ${
                        errors.objectiveId ? "border-destructive" : ""
                      }`}
                    >
                      <SelectValue placeholder="Pilih sasaran kerja" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 text-xs">
                      {perspectives.map((p) => (
                        <SelectGroup key={p.id}>
                          <SelectLabel className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                            {p.name}
                          </SelectLabel>
                          {p.objectives.map((obj) => (
                            <SelectItem key={obj.id} value={obj.id} className="text-xs cursor-pointer">
                              {obj.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.objectiveId && (
                    <p className="text-[11px] text-destructive font-medium">
                      {errors.objectiveId}
                    </p>
                  )}
                </div>

                {/* Row: Penanggung Jawab & Format Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Field: Penanggung Jawab */}
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-owner" className="text-xs font-medium text-foreground">
                      Penanggung Jawab (Aktor)
                    </Label>
                    <Select
                      value={formData.ownerId}
                      onValueChange={(val) => handleChangeField("ownerId", val)}
                    >
                      <SelectTrigger
                        id="kpi-owner"
                        size="sm"
                        className={`w-full text-xs bg-background ${
                          errors.ownerId ? "border-destructive" : ""
                        }`}
                      >
                        <SelectValue placeholder="Pilih penanggung jawab" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {owners.map((owner) => (
                          <SelectItem
                            key={owner.id}
                            value={owner.id}
                            className="text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-[9px] text-foreground border border-border">
                                {owner.initials}
                              </span>
                              <span>{owner.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ownerId && (
                      <p className="text-[11px] text-destructive font-medium">
                        {errors.ownerId}
                      </p>
                    )}
                  </div>

                  {/* Field: Format Satuan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-unit" className="text-xs font-medium text-foreground">
                      Format Satuan
                    </Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(val) => handleChangeField("unit", val as KpiUnitOption)}
                    >
                      <SelectTrigger
                        id="kpi-unit"
                        size="sm"
                        className="w-full text-xs bg-background"
                      >
                        <SelectValue placeholder="Pilih format" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="percent" className="text-xs cursor-pointer">
                          Persentase (%)
                        </SelectItem>
                        <SelectItem value="currency" className="text-xs cursor-pointer">
                          Rupiah (Rp)
                        </SelectItem>
                        <SelectItem value="decimal" className="text-xs cursor-pointer">
                          Angka / Desimal
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Field: Bobot */}
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-weight" className="text-xs font-medium text-foreground">
                    Bobot Kontribusi (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="kpi-weight"
                      type="text"
                      inputMode="numeric"
                      value={formData.weight}
                      onChange={(e) => handleChangeField("weight", e.target.value)}
                      placeholder="misal: 30"
                      className={`h-8 pr-7 text-xs bg-background ${
                        errors.weight ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Porsi bobot indikator terhadap total sasaran kerja terkait.
                  </p>
                  {errors.weight && (
                    <p className="text-[11px] text-destructive font-medium">{errors.weight}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Kartu 2: Rencana Target & Realisasi */}
            <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                <h3 className="text-xs font-semibold text-foreground tracking-tight">
                  Rencana Target & Realisasi
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Progres dihitung dari baseline awal hingga target akhir tahun.
                </p>
              </div>

              <div className="p-4 space-y-3.5">
                {/* Row: Baseline & Target Akhir Tahun */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Field: Baseline Awal */}
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-baseline" className="text-xs font-medium text-foreground">
                      Baseline Awal
                    </Label>
                    <div className="relative">
                      {adornment.prefix && (
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          {adornment.prefix}
                        </span>
                      )}
                      <Input
                        id="kpi-baseline"
                        type="text"
                        inputMode="decimal"
                        value={formData.baseline}
                        onChange={(e) => handleChangeField("baseline", e.target.value)}
                        placeholder="0"
                        className={`h-8 text-xs bg-background ${
                          adornment.prefix ? "pl-6" : ""
                        } ${adornment.suffix ? "pr-7" : ""} ${
                          errors.baseline
                            ? "border-destructive focus-visible:ring-destructive/30"
                            : ""
                        }`}
                      />
                      {adornment.suffix && (
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          {adornment.suffix}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Kondisi riil awal tahun.</p>
                    {errors.baseline && (
                      <p className="text-[11px] text-destructive font-medium">
                        {errors.baseline}
                      </p>
                    )}
                  </div>

                  {/* Field: Target Akhir Tahun */}
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-target" className="text-xs font-medium text-foreground">
                      Target Akhir Tahun
                    </Label>
                    <div className="relative">
                      {adornment.prefix && (
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          {adornment.prefix}
                        </span>
                      )}
                      <Input
                        id="kpi-target"
                        type="text"
                        inputMode="decimal"
                        value={formData.target}
                        onChange={(e) => handleChangeField("target", e.target.value)}
                        placeholder="100"
                        className={`h-8 text-xs bg-background ${
                          adornment.prefix ? "pl-6" : ""
                        } ${adornment.suffix ? "pr-7" : ""} ${
                          errors.target ? "border-destructive focus-visible:ring-destructive/30" : ""
                        }`}
                      />
                      {adornment.suffix && (
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          {adornment.suffix}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {directionHint}
                    </p>
                    {errors.target && (
                      <p className="text-[11px] text-destructive font-medium">{errors.target}</p>
                    )}
                  </div>
                </div>

                {/* Field: Realisasi Aktual (dinamis sesuai selectedPeriod) */}
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-actual" className="text-xs font-medium text-foreground">
                    Realisasi Aktual ({selectedPeriod})
                  </Label>
                  <div className="relative">
                    {adornment.prefix && (
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        {adornment.prefix}
                      </span>
                    )}
                    <Input
                      id="kpi-actual"
                      type="text"
                      inputMode="decimal"
                      value={formData.actual}
                      onChange={(e) => handleChangeField("actual", e.target.value)}
                      placeholder="Belum dilaporkan"
                      className={`h-8 text-xs bg-background ${
                        adornment.prefix ? "pl-6" : ""
                      } ${adornment.suffix ? "pr-7" : ""} ${
                        errors.actual ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                    />
                    {adornment.suffix && (
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        {adornment.suffix}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Biarkan kosong jika periode berjalan belum tutup buku.
                  </p>
                  {errors.actual && (
                    <p className="text-[11px] text-destructive font-medium">{errors.actual}</p>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* 3. Footer Aksi (Fixed di bawah) */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-muted/30 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="h-8 text-xs font-medium bg-background hover:bg-muted"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="add-kpi-form"
              size="sm"
              disabled={isSubmitting}
              className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium px-3.5 text-xs shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Simpan KPI</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Batalkan perubahan?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Ada isian form yang belum disimpan. Seluruh data baru akan hilang jika Anda keluar sekarang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs font-medium">Lanjutkan Mengisi</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowDiscardDialog(false)
                onOpenChange(false)
              }}
            >
              Buang Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
