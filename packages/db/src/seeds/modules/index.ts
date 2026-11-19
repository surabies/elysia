import type { SeedModule } from '../types';
import { accountsModule } from './01-accounts';
import { kondisiModule } from './02-kondisi';
import { wilayahGisModule } from './03-wilayah-gis';
import { jaringanPipaModule } from './04-jaringan-pipa';
import { etlPelangganModule } from './05-etl-pelanggan';
import { periodeModule } from './06-periode';
import { broadcastModule } from './07-broadcast';
import { pengaturanModule } from './08-pengaturan';
import { kpiModule } from './09-kpi';
import { pengaduanModule } from './10-pengaduan';

/**
 * Coordinated execution order for all initial seed modules.
 * Dependencies:
 * 1. Accounts (Creates users & roles for foreign keys)
 * 2. Kondisi (Master conditions for reading meters)
 * 3. Wilayah & GIS (Service areas 21 kelurahan & landmark places)
 * 4. Jaringan & Pipa (Water sources & pipeline distribution segments)
 * 5. ETL Pelanggan (Normalizes 22,549 customers, meters, reading records & bills)
 * 6. Periode (Active billing cycle 202601)
 * 7. Broadcast (Public notices & landing page promo banners)
 * 8. Pengaturan (Tolerance configs, contact center, running text)
 * 9. KPI (Balanced Scorecard indicators & realization data)
 * 10. Pengaduan (Complaints lifecycle & audit trail)
 */
export const SEED_MODULES: SeedModule[] = [
  accountsModule,
  kondisiModule,
  wilayahGisModule,
  jaringanPipaModule,
  etlPelangganModule,
  periodeModule,
  broadcastModule,
  pengaturanModule,
  kpiModule,
  pengaduanModule,
];

export {
  accountsModule,
  kondisiModule,
  wilayahGisModule,
  jaringanPipaModule,
  etlPelangganModule,
  periodeModule,
  broadcastModule,
  pengaturanModule,
  kpiModule,
  pengaduanModule,
};
