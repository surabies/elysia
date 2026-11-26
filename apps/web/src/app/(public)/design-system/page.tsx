"use client";

import * as React from "react";
import {
  Button,
  ButtonGroup,
  SplitButton,
  Badge,
  StatusDot,
  Banner,
  Note,
  EmptyState,
  LoadingDots,
  RelativeTimeCard,
  SearchInput,
  ClearableInput,
  AddressInput,
  FilterBar,
  ChoiceboxGroup,
  ChoiceboxItem,
  CopyButton,
  ShowMore,
  DestructiveConfirmationInput,
  Toolbar,
  DateRangePicker,
  DataPagination,
  Description,
  Snippet,
  Fieldset,
  Entity,
  EntityList,
  Gauge,
  ErrorCard,
  MiddleTruncate,
} from "@cater/ui";
import {
  Sparkles,
  Inbox,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Droplets,
  Layers,
  ShieldAlert,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

export default function DesignSystemShowcasePage() {
  // State interaktif untuk mendemonstrasikan fungsionalitas komponen
  const [searchValue, setSearchValue] = React.useState("");
  const [clearableValue, setClearableValue] = React.useState("PDAM-SURABAYA-2026");
  const [addressValue, setAddressValue] = React.useState("api/v1/cater/verifikasi");
  const [selectedPlan, setSelectedPlan] = React.useState("R2");
  const [showMoreExpanded, setShowMoreExpanded] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2026, 10, 1),
    to: new Date(2026, 10, 26),
  });
  const [pageIndex, setPageIndex] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [filters, setFilters] = React.useState([
    { id: "1", keyLabel: "Zona", valueLabel: "Wilayah Barat (01)", onRemove: () => removeFilter("1") },
    { id: "2", keyLabel: "Status Meter", valueLabel: "Anomali Mundur", onRemove: () => removeFilter("2") },
  ]);

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      {/* 1. Announcement Banner */}
      {bannerVisible && (
        <Banner
          variant="default"
          icon={<Sparkles className="size-4 text-amber-500" />}
          action={<a href="#components">Pelajari Komponen</a>}
          onDismiss={() => setBannerVisible(false)}
        >
          Sistem Desain Geist resmi aktif di Monorepo Cater PDAM — Konsistensi UI/UX & Densitas Tinggi.
        </Banner>
      )}

      {/* Header Halaman */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background font-bold text-base">
              Δ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm sm:text-base tracking-tight">
                  Geist Design System
                </h1>
                <Badge variant="gray-subtle" size="sm">
                  v1.0.0
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Katalog Komponen Terstandarisasi untuk Backoffice & Web Publik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Snippet text="pnpm add @cater/ui" />
          </div>
        </div>
      </header>

      {/* Konten Showcase */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* SECTION 1: STATUS, BADGE & INDIKATOR */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <StatusDot state="ready" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              1. Status, Badges & Micro-Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Dot */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">StatusDot (Live State & Pulse)</span>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <StatusDot state="ready" label="Server Siap (Ready)" />
                <StatusDot state="building" label="Memproses Data (Building)" />
                <StatusDot state="queued" label="Antrean Verifikasi (Queued)" />
                <StatusDot state="error" label="Gangguan Pipa (Error)" />
                <StatusDot state="canceled" label="Dibatalkan" />
              </div>
            </div>

            {/* Relative Time Card & Loading Dots */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Relative Time & Inline Loading Dots</span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span>Waktu Terakhir Verifikasi:</span>
                  <RelativeTimeCard date={new Date(Date.now() - 1000 * 60 * 15)} />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Menyinkronkan data bacaan meteran</span>
                  <LoadingDots size={4} />
                </div>
              </div>
            </div>
          </div>

          {/* Badges Matrix */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <span className="text-xs font-semibold text-foreground">Badge Scale (Geist Subtle & Inverted)</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="gray">gray</Badge>
              <Badge variant="gray-subtle">gray-subtle</Badge>
              <Badge variant="blue">blue</Badge>
              <Badge variant="blue-subtle">blue-subtle</Badge>
              <Badge variant="green">green</Badge>
              <Badge variant="green-subtle">green-subtle</Badge>
              <Badge variant="amber">amber</Badge>
              <Badge variant="amber-subtle">amber-subtle</Badge>
              <Badge variant="red">red</Badge>
              <Badge variant="red-subtle">red-subtle</Badge>
              <Badge variant="purple">purple</Badge>
              <Badge variant="purple-subtle">purple-subtle</Badge>
              <Badge variant="teal">teal</Badge>
              <Badge variant="teal-subtle">teal-subtle</Badge>
              <Badge variant="inverted">inverted</Badge>
              <Badge variant="pill">pill variant</Badge>
            </div>
          </div>

          {/* Notes Callouts */}
          <div className="space-y-2">
            <Note label="INFO" variant="info" action={<Button size="xs" variant="outline">Lihat Detail</Button>}>
              Tenggat waktu verifikasi mandiri periode November 2026 akan berakhir dalam 3 hari kalender.
            </Note>
            <Note label="PERINGATAN" variant="warning" action={<Button size="xs" variant="outline">Periksa Rute</Button>}>
              Terdapat deviasi angka stand meter drastis pada Rute 04 Sub-Zona Barat.
            </Note>
          </div>
        </section>

        {/* SECTION 2: TOMBOL & AKSI TERPADU */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Layers className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              2. Buttons, Button Groups & Split Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Button Sizing */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Button Sizes (h-8, h-9, h-10)</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small (h-8)</Button>
                <Button size="md">Medium (h-9)</Button>
                <Button size="lg">Large (h-10)</Button>
              </div>
            </div>

            {/* Split Button & Dropdown */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Split Button (Action + Sub-menu)</span>
              <div>
                <SplitButton
                  label="Unduh DRD"
                  onClick={() => alert("Mengunduh DRD format standar...")}
                  items={[
                    { label: "Ekspor Format Excel (.xlsx)", onClick: () => alert("Excel") },
                    { label: "Ekspor Format CSV", onClick: () => alert("CSV") },
                    { label: "Cetak Bukti PDF", onClick: () => alert("PDF") },
                  ]}
                />
              </div>
            </div>

            {/* Copy Button */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">CopyButton (Icon-Only & With Label)</span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-muted-foreground truncate">ID: PEL-098231</span>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton value="PEL-098231" />
                  <CopyButton value="PEL-098231" label="Salin ID" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INPUTS, SEARCH & FORM KONTRAK */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Filter className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              3. Specialized Inputs, Search & Address
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">SearchInput (dengan Clear & ⌘K)</span>
              <SearchInput
                size="md"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari no. pelanggan / nama..."
              />
              <p className="text-[11px] text-muted-foreground">
                Nilai pencarian aktif: <span className="font-mono">{searchValue || "(kosong)"}</span>
              </p>
            </div>

            {/* Clearable Input */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">ClearableInput (Reset Otomatis)</span>
              <ClearableInput
                value={clearableValue}
                onChange={(e) => setClearableValue(e.target.value)}
                placeholder="Ketik sesuatu..."
              />
            </div>

            {/* Address Input */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">AddressInput (Endpoint / URL)</span>
              <AddressInput
                prefix="https://pdam.co.id/"
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
              />
            </div>
          </div>

          {/* Destructive Confirmation Input */}
          <div className="rounded-lg border border-border bg-card p-4 max-w-lg space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              <span className="text-xs font-semibold uppercase">Destructive Confirmation Input</span>
            </div>
            <DestructiveConfirmationInput
              phrase="BATALKAN-VERIFIKASI-FINAL"
              confirmLabel="Batalkan Verifikasi Ini"
              onConfirm={() => alert("Aksi pembatalan dikonfirmasi!")}
            />
          </div>
        </section>

        {/* SECTION 4: DATA TABLE, TOOLBAR & PAGINATION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Droplets className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              4. Standardized Data Toolbar, Filters & Pagination
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            {/* Toolbar Lengkap */}
            <Toolbar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder="Filter catatan meter..."
              filterSlot={
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  size="sm"
                />
              }
              actionSlot={
                <Button size="sm" variant="default" className="gap-1.5">
                  <Plus className="size-3.5" />
                  <span>Tambah Data</span>
                </Button>
              }
            />

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onClearAll={() => setFilters([])}
              triggerSlot={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() =>
                    setFilters((prev) => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        keyLabel: "Petugas",
                        valueLabel: "Budi Santoso",
                        onRemove: () => removeFilter(String(Date.now())),
                      },
                    ])
                  }
                >
                  <Plus className="size-3" />
                  <span>Tambah Filter</span>
                </Button>
              }
            />

            {/* Table Mockup */}
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">No. Sambungan</th>
                    <th className="py-2.5 px-3">Nama Pelanggan</th>
                    <th className="py-2.5 px-3">Stand Lalu</th>
                    <th className="py-2.5 px-3">Stand Ini</th>
                    <th className="py-2.5 px-3">Pemakaian</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono">01-0982-11</td>
                    <td className="py-2.5 px-3 font-medium">Ahmad Fauzi</td>
                    <td className="py-2.5 px-3 font-mono">1.240 m³</td>
                    <td className="py-2.5 px-3 font-mono">1.265 m³</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">25 m³</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="green-subtle" size="sm">Diverifikasi V1</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono">01-0982-12</td>
                    <td className="py-2.5 px-3 font-medium">CV. Sumber Rezeki</td>
                    <td className="py-2.5 px-3 font-mono">3.410 m³</td>
                    <td className="py-2.5 px-3 font-mono">3.390 m³</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-destructive">-20 m³</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="red-subtle" size="sm">Meter Mundur</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Data Pagination Terpadu */}
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalItems={1250}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />
          </div>
        </section>

        {/* SECTION 5: CHOICEBOX & SELECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Inbox className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              5. Choicebox & Interactive Selection
            </h2>
          </div>

          <ChoiceboxGroup>
            <ChoiceboxItem
              title="Golongan R-1 (Rumah Tangga Sangat Sederhana)"
              description="Beban tarif subsidi dasar untuk pemakaian air domestik hingga 10 m³ per bulan."
              badge={<Badge variant="blue-subtle" size="sm">Tarif Subsidi</Badge>}
              selected={selectedPlan === "R1"}
              onSelect={() => setSelectedPlan("R1")}
            />
            <ChoiceboxItem
              title="Golongan R-2 (Rumah Tangga Menengah)"
              description="Tarif reguler untuk hunian keluarga standar dengan akses pipa PDAM 1/2 inch."
              badge={<Badge variant="green-subtle" size="sm">Reguler</Badge>}
              selected={selectedPlan === "R2"}
              onSelect={() => setSelectedPlan("R2")}
            />
            <ChoiceboxItem
              title="Golongan N-1 (Niaga Kecil & Ruko)"
              description="Pemakaian komersial mikro, warung makan, atau kantor ruko skala kecil."
              badge={<Badge variant="amber-subtle" size="sm">Komersial</Badge>}
              selected={selectedPlan === "N1"}
              onSelect={() => setSelectedPlan("N1")}
            />
            <ChoiceboxItem
              title="Golongan Industri & Pabrik"
              description="Kebutuhan volume air berkapasitas besar dengan pipa distribusi khusus 2 inch."
              badge={<Badge variant="purple-subtle" size="sm">Industri</Badge>}
              selected={selectedPlan === "IND"}
              onSelect={() => setSelectedPlan("IND")}
            />
          </ChoiceboxGroup>

          {/* Show More Demo */}
          <ShowMore
            expanded={showMoreExpanded}
            count={6}
            onToggle={() => setShowMoreExpanded(!showMoreExpanded)}
          />

          {showMoreExpanded && (
            <div className="rounded-md border border-border p-3 text-xs text-muted-foreground bg-muted/10">
              Menampilkan 6 golongan tarif khusus lainnya (Sosial, Yayasan, Kantor Pemerintah, dan Pelabuhan).
            </div>
          )}
        </section>

        {/* SECTION 6: EMPTY STATE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              6. Empty State Pattern
            </span>
          </div>

          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Tidak Ada Pengaduan Tertunda"
            description="Semua tiket pengaduan pipa bocor dan keluhan meteran pada zona ini telah berhasil ditangani oleh tim lapangan."
            action={
              <Button size="sm" variant="default" className="gap-1.5">
                <RefreshCw className="size-3.5" />
                <span>Segarkan Data</span>
              </Button>
            }
          />
        </section>

        {/* SECTION 7: FIELDSET, ENTITY, GAUGE & ERROR CARD */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              7. Fieldset, Entity, Gauge & ErrorCard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fieldset */}
            <Fieldset
              title="Pengaturan Impor LapDataMeter"
              description="Konfigurasi batas deviasi dan verifikasi otomatis stand meteran."
              footer="Perubahan akan langsung aktif untuk batch impor berikutnya."
              footerActions={
                <Button size="sm" variant="default">
                  Simpan Pengaturan
                </Button>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Toleransi Deviasi Ekstrim</span>
                  <Badge variant="amber-subtle">± 50%</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>ID Sambungan Demo (MiddleTruncate)</span>
                  <MiddleTruncate text="01-SURABAYA-BARAT-998822110099" start={8} end={6} />
                </div>
              </div>
            </Fieldset>

            {/* Gauge Circular Metrics */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Gauge (Capaian & Akurasi)</h4>
                <p className="text-xs text-muted-foreground">Visualisasi meteran melingkar untuk persentase capaian target.</p>
              </div>
              <div className="flex items-center justify-around py-2">
                <Gauge value={85} size={72} strokeWidth={6} variant="success" label="Capaian Verifikasi" />
                <Gauge value={42} size={72} strokeWidth={6} variant="warning" label="Koreksi Anomali" />
                <Gauge value={98} size={72} strokeWidth={6} variant="info" label="Akurasi Petugas" />
              </div>
            </div>
          </div>

          {/* Entity List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Entity List (Daftar Petugas / Sambungan)</h4>
            <EntityList>
              <Entity
                icon={<div className="size-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">BS</div>}
                title="Budi Santoso"
                subtitle="Petugas Lapangan Wilayah Barat"
                meta="245 / 250 Meter Terbaca"
                status={<Badge variant="green-subtle" size="sm">Online</Badge>}
                action={<Button size="xs" variant="outline">Lihat Rute</Button>}
              />
              <Entity
                icon={<div className="size-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">AH</div>}
                title="Agus Haryanto"
                subtitle="Petugas Lapangan Wilayah Timur"
                meta="180 / 250 Meter Terbaca"
                status={<Badge variant="amber-subtle" size="sm">Menyinkronkan</Badge>}
                action={<Button size="xs" variant="outline">Lihat Rute</Button>}
              />
            </EntityList>
          </div>

          {/* Error Card */}
          <ErrorCard
            title="Gagal Terhubung ke Meteran IoT DMA-04"
            code="ERR_SENSOR_TIMEOUT_504"
            message="Koneksi telemetri ke sensor tekanan pipa DMA-04 terputus sejak 15 menit lalu. Harap periksa catu daya modul."
            onRetry={() => alert("Mencoba menghubungkan ulang sensor...")}
          />
        </section>
      </main>
    </div>
  );
}
