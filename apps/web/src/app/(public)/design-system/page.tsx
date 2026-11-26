"use client";

import * as React from "react";
import {
  Button,
  ButtonGroup,
  SplitButton,
  Badge,
  Pill,
  StatusDot,
  Banner,
  Note,
  EmptyState,
  LoadingDots,
  Spinner,
  RelativeTimeCard,
  SearchInput,
  ClearableInput,
  AddressInput,
  MultiSelect,
  FilterBar,
  ChoiceboxGroup,
  ChoiceboxItem,
  CopyButton,
  TextWithCopy,
  ShowMore,
  LoadMoreButton,
  DestructiveConfirmationInput,
  DestructiveActionModal,
  Toolbar,
  DateRangePicker,
  DataPagination,
  Description,
  Snippet,
  Code,
  CodeBlock,
  JsonView,
  FileTree,
  Fieldset,
  Entity,
  EntityList,
  Gauge,
  PieGauge,
  ErrorCard,
  MiddleTruncate,
  Browser,
  Phone,
  Book,
  Video,
  ProjectBanner,
  ContextCard,
  Feedback,
  ThemeSwitcher,
  DotsMenu,
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
  Smartphone,
  Laptop,
  Code2,
  Trash2,
  Edit,
  ExternalLink,
  Share2,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

export default function DesignSystemShowcasePage() {
  // State interaktif
  const [searchValue, setSearchValue] = React.useState("");
  const [clearableValue, setClearableValue] = React.useState("PDAM-SURABAYA-2026");
  const [addressValue, setAddressValue] = React.useState("api/v1/cater/verifikasi");
  const [selectedPlan, setSelectedPlan] = React.useState("R2");
  const [selectedTags, setSelectedTags] = React.useState(["meter", "anomali"]);
  const [showMoreExpanded, setShowMoreExpanded] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(true);
  const [destructiveModalOpen, setDestructiveModalOpen] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<"light" | "dark" | "system">("system");
  const [loadMoreLoading, setLoadMoreLoading] = React.useState(false);

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

  const fileTreeItems = [
    {
      name: "src",
      type: "directory" as const,
      defaultOpen: true,
      children: [
        {
          name: "contracts",
          type: "directory" as const,
          defaultOpen: true,
          children: [
            { name: "tokens.ts", type: "file" as const },
            { name: "component-contracts.ts", type: "file" as const },
            { name: "index.ts", type: "file" as const },
          ],
        },
        {
          name: "ui",
          type: "directory" as const,
          defaultOpen: false,
          children: [
            { name: "button.tsx", type: "file" as const },
            { name: "badge.tsx", type: "file" as const },
            { name: "browser.tsx", type: "file" as const },
            { name: "status-dot.tsx", type: "file" as const },
          ],
        },
      ],
    },
    { name: "package.json", type: "file" as const },
    { name: "README.md", type: "file" as const },
  ];

  const sampleJson = {
    system: "Cater PDAM Enterprise",
    version: "2.4.0",
    environment: "production",
    services: {
      api: { status: "healthy", latency: "14ms" },
      telemetry: { status: "healthy", dmaCount: 42 },
      database: { connections: 18, poolMax: 50 },
    },
    flags: {
      enableAiAnomalies: true,
      highDensityGeistUI: true,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      {/* 1. Announcement Banner */}
      {bannerVisible && (
        <Banner
          variant="default"
          icon={<Sparkles className="size-4 text-amber-500" />}
          action={<a href="#components">Jelajahi Geist UI Catalog</a>}
          onDismiss={() => setBannerVisible(false)}
        >
          Sistem Desain Geist & Kontrak CSS Vercel resmi diterapkan secara penuh di Monorepo PDAM — Presisi Monokromatik & Densitas Tinggi.
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
                  Geist Design System & CSS Contracts
                </h1>
                <Badge variant="gray-subtle" size="sm">
                  v2.0.0
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Katalog Komponen Terstandarisasi Berdasarkan Spesifikasi Vercel Geist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher theme={activeTheme} onThemeChange={setActiveTheme} />
            <Feedback
              onSubmit={async ({ message, score }) => {
                console.log("Feedback dikirim:", { message, score });
              }}
            />
            <Snippet text="pnpm add @cater/ui" />
          </div>
        </div>
      </header>

      {/* Konten Showcase */}
      <main id="components" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* SECTION 1: PROJECT BANNER & CONTEXT CARDS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <StatusDot state="ready" />
              <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
                1. Deployment, Project Banners & Context
              </h2>
            </div>
            <DotsMenu
              items={[
                { label: "Lihat Repository", icon: <ExternalLink />, onClick: () => {} },
                { label: "Bagi Tautan", icon: <Share2 />, onClick: () => {} },
                { label: "Pengaturan Proyek", icon: <Edit />, onClick: () => {} },
              ]}
            />
          </div>

          <ProjectBanner
            name="pdam-surabaya-production"
            url="dashboard.pdam-surabaya.go.id"
            gitBranch="release/2026.11"
            gitCommit="e9fa34c"
            status="ready"
            timeAgo="Dideploy 4 menit lalu"
            framework="Next.js 15 (App Router)"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContextCard
              title="DMA-01 Wilayah Wonokromo"
              subtitle="Sensor Tekanan Pipa Primer"
              description="Memantau 1.450 pelanggan domestik dengan telemetri debit konstan 18.4 L/s."
              badge={<Badge variant="green-subtle" size="sm">Normal</Badge>}
              meta={
                <>
                  <span>ID: DMA-WNK-01</span>
                  <span>•</span>
                  <span>Update: 10s lalu</span>
                </>
              }
              action={
                <DotsMenu
                  items={[
                    { label: "Konfigurasi Sensor", onClick: () => {} },
                    { label: "Uji Ping Telemetri", onClick: () => {} },
                  ]}
                />
              }
            />

            <ContextCard
              title="DMA-04 Wilayah Rungkut Industri"
              subtitle="Aliran Pipa Distribusi Sekunder"
              description="Terjadi fluktuasi penurunan debit pada jam operasional 08:00 - 14:00."
              badge={<Badge variant="amber-subtle" size="sm">Perhatian</Badge>}
              meta={
                <>
                  <span>ID: DMA-RKT-04</span>
                  <span>•</span>
                  <span>Update: 2m lalu</span>
                </>
              }
              action={
                <DotsMenu
                  items={[
                    { label: "Inspeksi Lapangan", onClick: () => {} },
                    { label: "Reset Alarm", destructive: true, onClick: () => {} },
                  ]}
                />
              }
            />
          </div>
        </section>

        {/* SECTION 2: STATUS, BADGES, PILLS & GAUGES */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              2. Status, Badges, Pills & Gauges
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Dot */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">StatusDot (State & Pulse)</span>
              <div className="flex flex-col gap-2.5 text-xs">
                <StatusDot state="ready" label="Server Siap (Ready)" />
                <StatusDot state="building" label="Memproses Data (Building)" />
                <StatusDot state="queued" label="Antrean Verifikasi (Queued)" />
                <StatusDot state="error" label="Gangguan Sensor (Error)" />
                <StatusDot state="canceled" label="Dibatalkan" />
              </div>
            </div>

            {/* Relative Time & Loading Dots */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Relative Time & Loading Dots</span>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sinkronisasi terakhir:</span>
                  <RelativeTimeCard date={new Date(Date.now() - 1000 * 60 * 12)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sinkronisasi berjalan:</span>
                  <LoadingDots size={4} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Spinner primitive:</span>
                  <Spinner className="size-4 text-foreground" />
                </div>
              </div>
            </div>

            {/* Pie Gauges */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Pie Gauges (Donut Metrics)</span>
              <div className="flex items-center justify-around pt-1">
                <PieGauge value={88} variant="success" label="Target" sublabel="88%" size={58} />
                <PieGauge value={54} variant="warning" label="Koreksi" sublabel="54%" size={58} />
                <PieGauge value={12} variant="error" label="Anomali" sublabel="12%" size={58} />
              </div>
            </div>
          </div>

          {/* Badges & Pills Matrix */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <span className="text-xs font-semibold text-foreground">Geist Badges & Dismissible Pills</span>
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
              <Badge variant="teal">teal</Badge>
              <Badge variant="inverted">inverted</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium">Pills:</span>
              <Pill label="Zona Barat" tone="neutral" onRemove={() => {}} />
              <Pill label="Aktif" tone="success" onRemove={() => {}} />
              <Pill label="Peringatan Deviasi" tone="warning" onRemove={() => {}} />
              <Pill label="Sensor Putus" tone="error" onRemove={() => {}} />
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

        {/* SECTION 3: BUTTONS, COPY, SPLIT & DESTRUCTIVE ACTIONS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Layers className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              3. Buttons, Copy Primitives & Destructive Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Button Sizing */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Geist Button Sizing</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small (h-8)</Button>
                <Button size="md">Medium (h-9)</Button>
                <Button size="lg">Large (h-10)</Button>
              </div>
            </div>

            {/* Split Button */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Split Button (Action + Menu)</span>
              <div>
                <SplitButton
                  label="Unduh DRD"
                  onClick={() => alert("Mengunduh DRD...")}
                  items={[
                    { label: "Ekspor Excel (.xlsx)", onClick: () => alert("Excel") },
                    { label: "Ekspor CSV", onClick: () => alert("CSV") },
                    { label: "Cetak PDF", onClick: () => alert("PDF") },
                  ]}
                />
              </div>
            </div>

            {/* Text with Copy */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">Text With Copy & CopyButton</span>
              <div className="space-y-2">
                <TextWithCopy text="SR-0982-1102" label="No. Pelanggan" />
                <div className="flex items-center gap-2">
                  <CopyButton value="PEL-098231" label="Salin Kode ID" />
                  <CopyButton value="PEL-098231" />
                </div>
              </div>
            </div>
          </div>

          {/* Destructive Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-red-200 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/20 p-4">
            <div>
              <h4 className="text-xs font-semibold text-red-700 dark:text-red-400">
                Operasi Kritis & Konfirmasi Bertingkat
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Mencegah kesalahan pengguna pada penghapusan zona atau reset database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setDestructiveModalOpen(true)}
              >
                <Trash2 className="size-3.5" />
                <span>Buka Destructive Modal</span>
              </Button>
            </div>
          </div>

          <DestructiveActionModal
            open={destructiveModalOpen}
            onOpenChange={setDestructiveModalOpen}
            title="Hapus Master Rute 04?"
            description="Tindakan ini tidak dapat dibatalkan. Semua 240 histori pencatatan meter pada rute ini akan dihapus secara permanen dari server utama."
            verificationPhrase="HAPUS-RUTE-04"
            confirmLabel="Ya, Hapus Rute"
            onConfirm={() => {
              alert("Rute berhasil dihapus.");
              setDestructiveModalOpen(false);
            }}
          />
        </section>

        {/* SECTION 4: SPECIALIZED INPUTS & MULTISELECT */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Filter className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              4. Inputs, Search, Clearable & MultiSelect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">SearchInput (dengan Clear)</span>
              <SearchInput
                size="md"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari no. pelanggan / nama..."
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">ClearableInput (Reset Button)</span>
              <ClearableInput
                value={clearableValue}
                onChange={(e) => setClearableValue(e.target.value)}
                placeholder="Ketik sesuatu..."
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">AddressInput (URL / API Prefix)</span>
              <AddressInput
                prefix="https://pdam.co.id/"
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">MultiSelect (Filter Tags)</span>
              <MultiSelect
                options={[
                  { label: "Meter Normal", value: "normal" },
                  { label: "Anomali Mundur", value: "anomali" },
                  { label: "Meter Rusak", value: "rusak" },
                  { label: "Rumah Kosong", value: "kosong" },
                  { label: "Pipa Bocor", value: "bocor" },
                ]}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Pilih filter kondisi meter..."
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-4" />
                <span className="text-xs font-semibold uppercase">Destructive Confirmation Input</span>
              </div>
              <DestructiveConfirmationInput
                phrase="BATALKAN-VERIFIKASI"
                confirmLabel="Batalkan Verifikasi Ini"
                onConfirm={() => alert("Aksi pembatalan dikonfirmasi!")}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: DATA TABLE, TOOLBAR & PAGINATION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Droplets className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              5. Standardized Data Toolbar, Filters & Pagination
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
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
                    <th className="py-2.5 px-3 text-right">Aksi</th>
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
                    <td className="py-2.5 px-3 text-right">
                      <DotsMenu
                        items={[
                          { label: "Lihat Foto Meter", onClick: () => {} },
                          { label: "Koreksi Stand", onClick: () => {} },
                        ]}
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono">01-0982-12</td>
                    <td className="py-2.5 px-3 font-medium">CV. Sumber Rezeki</td>
                    <td className="py-2.5 px-3 font-mono">3.410 m³</td>
                    <td className="py-2.5 px-3 font-mono">3.390 m³</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-destructive">-20 m³</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="destructive" size="sm">Meter Mundur</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <DotsMenu
                        items={[
                          { label: "Lihat Foto Meter", onClick: () => {} },
                          { label: "Jadwalkan Kalibrasi", onClick: () => {} },
                        ]}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalItems={1250}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />

            <div className="pt-2">
              <LoadMoreButton
                loading={loadMoreLoading}
                onLoadMore={() => {
                  setLoadMoreLoading(true);
                  setTimeout(() => setLoadMoreLoading(false), 1200);
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: CODE, DX, FILE TREE & JSON VIEW */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Code2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              6. Code, Syntax Highlighting, FileTree & JSON View
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Tree */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">FileTree Explorer</span>
              <FileTree
                items={fileTreeItems}
                onSelect={(item, path) => console.log("Selected file:", path)}
              />
            </div>

            {/* JSON View */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">JsonView (Collapsible Syntax JSON)</span>
              <JsonView data={sampleJson} />
            </div>
          </div>

          {/* Code Block */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground">CodeBlock (Line numbers & Copy)</span>
            <CodeBlock
              filename="packages/ui/src/contracts/tokens.ts"
              language="typescript"
              code={`export const GEIST_SIZES = {
  sm: { height: "h-8", px: "px-2.5", text: "text-xs" },
  md: { height: "h-9", px: "px-3", text: "text-sm" },
  lg: { height: "h-10", px: "px-4", text: "text-base" },
} as const;

export type GeistSize = "sm" | "md" | "lg";`}
            />
            <p className="text-xs text-muted-foreground">
              Gunakan inline <Code>{"<Code>"}</Code> untuk penandaan token atau parameter di dalam kalimat.
            </p>
          </div>
        </section>

        {/* SECTION 7: MOCKUPS (BROWSER, PHONE, BOOK, VIDEO) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Laptop className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              7. Visual Frames & Mockups (Browser, Phone, Book, Video)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Browser Mockup */}
            <div className="lg:col-span-2 space-y-2">
              <span className="text-xs font-semibold text-foreground">Browser Window Frame</span>
              <Browser url="https://cater.pdam-surabaya.go.id/dashboard">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Ringkasan Harian DMA</span>
                    <Badge variant="green-subtle" size="sm">Online 99.98%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-border p-2">
                      <span className="text-muted-foreground text-[10px]">Total Terbaca</span>
                      <p className="text-base font-semibold font-mono">18.420</p>
                    </div>
                    <div className="rounded border border-border p-2">
                      <span className="text-muted-foreground text-[10px]">Tingkat Anomali</span>
                      <p className="text-base font-semibold font-mono text-emerald-600">0.8%</p>
                    </div>
                  </div>
                </div>
              </Browser>
            </div>

            {/* Phone Mockup */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Phone Device Frame</span>
              <Phone>
                <div className="space-y-3 text-center pt-2">
                  <div className="size-12 rounded-full bg-foreground text-background font-bold text-lg flex items-center justify-center mx-auto">
                    💧
                  </div>
                  <h4 className="text-xs font-bold">Aplikasi Petugas Cater</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Siap mengambil foto meter di Rute 04 Sub-Zona Barat.
                  </p>
                  <Button size="sm" className="w-full text-xs">
                    Mulai Baca Stand
                  </Button>
                </div>
              </Phone>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Book Mockup */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3 flex flex-col items-center sm:flex-row sm:items-center sm:justify-around">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Geist Book Mockup</h4>
                <p className="text-xs text-muted-foreground">
                  Representasi dokumen SOP dan manual operasional sistem.
                </p>
              </div>
              <Book
                title="SOP Pencatatan & Verifikasi Meteran Air"
                author="Divisi Distribusi PDAM"
                color="#0f172a"
              />
            </div>

            {/* Video Player Frame */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Video Player Frame</span>
              <Video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                title="Panduan Kalibrasi Sensor DMA"
              />
            </div>
          </div>
        </section>

        {/* SECTION 8: FIELDSET, CHOICEBOX & EMPTY STATE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Inbox className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              8. Choicebox, Fieldset, Entity & Empty State
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
          </ChoiceboxGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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
