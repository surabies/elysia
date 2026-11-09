'use client';

import * as React from 'react';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Bell,
  Palette,
  Database,
  CheckCircle2,
  Lock,
  Save,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function PengaturanView() {
  const [activeTab, setActiveTab] = React.useState('profil');
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  // Form states: Profil
  const [namaPengguna, setNamaPengguna] = React.useState('Administrator Billing');
  const [nppPetugas, setNppPetugas] = React.useState('DIR-BILL-2026');
  const [emailUser, setEmailUser] = React.useState('admin.billing@tirtawening.co.id');
  const [rolePengguna, setRolePengguna] = React.useState('SUPERADMIN');

  // Form states: Parameter Operasional
  const [radiusGeofence, setRadiusGeofence] = React.useState('50');
  const [jatuhTempoDefault, setJatuhTempoDefault] = React.useState('20');
  const [beaAdminDefault, setBeaAdminDefault] = React.useState('10000');
  const [ambangEkstrimPersen, setAmbangEkstrimPersen] = React.useState('200');

  // Form states: Notifikasi & Keamanan
  const [notifAnomali, setNotifAnomali] = React.useState(true);
  const [notifClosing, setNotifClosing] = React.useState(true);
  const [autoLockAudit, setAutoLockAudit] = React.useState(true);

  // Form states: Tampilan
  const [kepadatanTabel, setKepadatanTabel] = React.useState<'default' | 'compact'>('default');

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Konfigurasi pengaturan berhasil disimpan ke preferensi sistem.');
    setTimeout(() => {
      setSavedMessage(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Pengaturan Sistem & Preferensi
                </h1>
                <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                  v2.4 Enterprise
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi profil operator, parameter toleransi pembacaan meter, dan preferensi operasional penagihan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSimpan}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Save feedback banner */}
      {savedMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-md border text-xs bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 2. Main Tabbed Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="profil" className="text-xs py-1.5 px-3 gap-1.5">
            <User className="w-3.5 h-3.5" />
            Profil Operator
          </TabsTrigger>
          <TabsTrigger value="parameter" className="text-xs py-1.5 px-3 gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Parameter Billing
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="text-xs py-1.5 px-3 gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Notifikasi & Keamanan
          </TabsTrigger>
          <TabsTrigger value="sistem" className="text-xs py-1.5 px-3 gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Status Sistem
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: PROFIL OPERATOR                                         */}
        {/* ============================================================== */}
        <TabsContent value="profil" className="space-y-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Informasi Akun Operator</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Data identitas login dan wewenang pengguna dalam sistem billing Tirtawening.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nama Lengkap:</label>
                  <Input
                    value={namaPengguna}
                    onChange={(e) => setNamaPengguna(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">NPP / NIK Pegawai:</label>
                  <Input
                    value={nppPetugas}
                    onChange={(e) => setNppPetugas(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Dinas:</label>
                <Input
                  type="email"
                  value={emailUser}
                  onChange={(e) => setEmailUser(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Peran / Hak Akses (RBAC):</label>
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs">{rolePengguna}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Hak akses penuh ke seluruh modul konfigurasi dan eksekusi closing billing.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Ubah Kata Sandi</p>
                <p className="text-[11px] text-muted-foreground">
                  Perbarui kata sandi akun untuk menjaga keamanan akses.
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Ganti Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PARAMETER OPERASIONAL BILLING                           */}
        {/* ============================================================== */}
        <TabsContent value="parameter" className="space-y-4">
          <Card className="p-6 max-w-2xl space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Parameter Operasional & Batas Toleransi</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Batas baku aturan perhitungan tarif dan validasi geofence GPS pembacaan lapangan.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Radius Toleransi Geofence GPS (meter):
                  </label>
                  <span className="font-mono text-xs font-bold text-primary">{radiusGeofence} meter</span>
                </div>
                <Input
                  type="number"
                  value={radiusGeofence}
                  onChange={(e) => setRadiusGeofence(e.target.value)}
                  className="text-xs font-mono max-w-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Jarak maksimal pembacaan petugas dari titik koordinat meter pelanggan sebelum ditandai anomali lokasi (*anti-nembak*).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tanggal Jatuh Tempo Default Rekening Air:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Setiap tanggal</span>
                  <Input
                    type="number"
                    value={jatuhTempoDefault}
                    onChange={(e) => setJatuhTempoDefault(e.target.value)}
                    className="text-xs font-mono w-20 text-center"
                  />
                  <span className="text-xs text-muted-foreground">bulan penagihan.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Standar Biaya Administrasi Tagihan (Rp):
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <span className="text-xs font-mono text-muted-foreground">Rp</span>
                  <Input
                    type="number"
                    value={beaAdminDefault}
                    onChange={(e) => setBeaAdminDefault(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ambang Batas Deteksi Lonjakan Ekstrem (%):
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    type="number"
                    value={ambangEkstrimPersen}
                    onChange={(e) => setAmbangEkstrimPersen(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <span className="text-xs font-mono text-muted-foreground">% dari rata-rata</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: NOTIFIKASI & KEAMANAN                                   */}
        {/* ============================================================== */}
        <TabsContent value="notifikasi" className="space-y-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Notifikasi Otomatis & Kontrol Audit</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pengaturan peringatan dini dan proteksi audit trail transaksi pembacaan.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-semibold text-foreground">Peringatan Anomali Ekstrem</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tampilkan badge waspada saat petugas mencatat kenaikan kubikasi di atas batas toleransi.
                  </p>
                </div>
                <Switch checked={notifAnomali} onCheckedChange={setNotifAnomali} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-semibold text-foreground">Notifikasi Kesiapan Tutup Bulan</p>
                  <p className="text-[11px] text-muted-foreground">
                    Kirim notifikasi saat read rate mencapai 100% dan seluruh bacaan siap closing.
                  </p>
                </div>
                <Switch checked={notifClosing} onCheckedChange={setNotifClosing} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-semibold text-foreground">Auto-Lock Audit Trail</p>
                  <p className="text-[11px] text-muted-foreground">
                    Otomatis kunci riwayat koreksi stand setelah disahkan oleh Verifikator Ring 2.
                  </p>
                </div>
                <Switch checked={autoLockAudit} onCheckedChange={setAutoLockAudit} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: STATUS SISTEM & KONEKSI                                 */}
        {/* ============================================================== */}
        <TabsContent value="sistem" className="space-y-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Integritas Arsitektur Sistem</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Status koneksi database, lapisan mesin tarif, dan framework backend.
              </p>
            </div>

            <div className="space-y-2.5 text-xs font-mono pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <span className="text-muted-foreground">Basis Data:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PostgreSQL via Drizzle ORM
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <span className="text-muted-foreground">Ekstensi Spasial:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PostGIS (Geography Point)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <span className="text-muted-foreground">Mesin Kalkulasi Tarif:</span>
                <span className="font-bold text-foreground">TagihanEngine Progressive Block 4</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <span className="text-muted-foreground">Framework UI / Backend:</span>
                <span className="font-bold text-foreground">Next.js 16 + Elysia API Gateway</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <span className="text-muted-foreground">Versi Aplikasi:</span>
                <span className="font-bold text-primary">v2.4 Enterprise Production</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
