import {
  pgTable,
  text,
  varchar,
  timestamp,
  pgEnum,
  boolean,
  primaryKey,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { wilayahAdministrasi, ruteCater } from './wilayah';
import { caterBacaMeter } from './cater';

// 1. Tingkatan Jabatan Kepegawaian (HR Level - 6 Tingkat)
export const employeeLevelEnum = pgEnum('employee_level', [
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF_PENYELIA',
  'PELAKSANA',
]);

// 2. Peran Sistem RBAC
export const appRoleEnum = pgEnum('app_role', [
  'SUPERADMIN',
  'EXECUTIVE',            // Direksi (Dashboard, Analitik, Override V3)
  'VERIFIKATOR_3',        // Senior Manager / Head of Billing (Final release)
  'VERIFIKATOR_2',        // Manager Cabang / Area (Approval regional)
  'VERIFIKATOR_1',        // Supervisor (Initial Screening tingkat rute)
  'STAFF_ADMIN_BILLING',  // Staff Administrasi Rute, GIS, Closing & Koreksi Pasca-Verifikasi
  'PENCATAT',             // Pelaksana Lapangan (Mobile App)
  'PELAKSANA',            // Pelaksana Non-Cater
  'USER',                 // Warga / Pelanggan Mandiri
]);

// 3. Status Siklus Verifikasi Baca Meter (3-Tier + Staff Correction)
export const caterVerificationStatusEnum = pgEnum('cater_verification_status', [
  'DRAFT',                // Draft offline di perangkat mobile
  'SUBMITTED',            // Berhasil diunggah ke backend, menunggu V1
  'NEED_RESURVEY',        // Perintah cek fisik ulang di lapangan
  'VERIFIED_L1',          // Disetujui Supervisor (V1)
  'VERIFIED_L2',          // Disetujui Manager Cabang (V2)
  'APPROVED_FINAL',       // Disahkan Senior Manager / Direksi (V3)
  'CORRECTED_POST_VERIF', // Telah dikoreksi administratif oleh Staff Pasca-Verifikasi
  'LOCKED_BILLING',       // Sudah dieksekusi closing ke DRD (Locked)
]);

// 4. Tabel Master Pegawai & Hirarki Organisasi
export const pegawai = pgTable(
  'pegawai',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    nip: varchar('nip', { length: 30 }).notNull().unique(),
    namaLengkap: varchar('nama_lengkap', { length: 150 }).notNull(),
    level: employeeLevelEnum('level').notNull().default('PELAKSANA'),
    jabatanNama: varchar('jabatan_nama', { length: 100 }), // e.g. "Supervisor Cater Wilayah Cibeunying"
    unitKerja: varchar('unit_kerja', { length: 100 }),    // e.g. "Seksi Pembacaan Meter Wilayah 4"
    atasanId: text('atasan_id').references((): any => pegawai.id, { onDelete: 'set null' }),
    noHp: varchar('no_hp', { length: 30 }),
    aktif: boolean('aktif').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pegawai_nip_idx').on(table.nip),
    index('pegawai_user_id_idx').on(table.userId),
    index('pegawai_level_idx').on(table.level),
  ]
);

// 5. Tabel User Roles (Many-to-Many User ke Role Sistem)
export const userRoles = pgTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: appRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.role] }),
    index('user_roles_user_id_idx').on(table.userId),
  ]
);

// 6. Tabel Scope Otoritas Wilayah Administrasi / Cabang
export const userWilayahScope = pgTable(
  'user_wilayah_scope',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    wiladmKode: varchar('wiladm_kode', { length: 10 })
      .notNull()
      .references(() => wilayahAdministrasi.kode, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.wiladmKode] }),
    index('user_wilayah_scope_user_id_idx').on(table.userId),
  ]
);

// 7. Tabel Penugasan Rute Catat Meter (Petugas ke Rute per Periode)
export const userRuteAssignment = pgTable(
  'user_rute_assignment',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ruteKode: varchar('rute_kode', { length: 20 })
      .notNull()
      .references(() => ruteCater.kode, { onDelete: 'cascade' }),
    periodeThbl: varchar('periode_thbl', { length: 6 }).notNull(), // e.g. '202601'
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.ruteKode, table.periodeThbl] }),
    index('user_rute_assignment_user_id_idx').on(table.userId),
    index('user_rute_assignment_thbl_rute_idx').on(table.periodeThbl, table.ruteKode),
  ]
);

// 8. Tabel Audit Log Verifikasi Berjenjang & Koreksi Pasca-Verifikasi
export const caterVerifikasiLog = pgTable(
  'cater_verifikasi_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    caterId: text('cater_id')
      .notNull()
      .references(() => caterBacaMeter.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    
    // Stage: 'V1' | 'V2' | 'V3' | 'STAFF_CORRECTION'
    stage: varchar('stage', { length: 20 }).notNull(),
    
    // Action: 'APPROVE' | 'REQUEST_RESURVEY' | 'ADJUST_STAND' | 'STAFF_POST_CORRECT'
    action: varchar('action', { length: 30 }).notNull(),
    
    stmaSebelum: numeric('stma_sebelum', { precision: 10, scale: 2 }),
    stmaSesudah: numeric('stma_sesudah', { precision: 10, scale: 2 }),
    pakaiSebelum: numeric('pakai_sebelum', { precision: 10, scale: 2 }),
    pakaiSesudah: numeric('pakai_sesudah', { precision: 10, scale: 2 }),
    
    nomorTiketKomplain: varchar('nomor_tiket_komplain', { length: 50 }),
    alasan: text('alasan').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('cater_verifikasi_log_cater_id_idx').on(table.caterId),
    index('cater_verifikasi_log_user_id_idx').on(table.userId),
  ]
);

// 9. Tabel Matriks Hak Akses & Perizinan Modul RBAC (Dapat Dimodifikasi)
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    modulKey: varchar('modul_key', { length: 50 }).notNull().unique(),
    modulNama: varchar('modul_nama', { length: 100 }).notNull(),
    kategori: varchar('kategori', { length: 50 }).notNull().default('OPERASIONAL'),
    deskripsi: text('deskripsi'),
    urutan: numeric('urutan', { precision: 4, scale: 0 }).notNull().default('0'),

    // Perizinan per Role
    superadmin: boolean('superadmin').notNull().default(true),
    staffBilling: boolean('staff_billing').notNull().default(false),
    verifikator1: boolean('verifikator_1').notNull().default(false),
    verifikator2: boolean('verifikator_2').notNull().default(false),
    verifikator3: boolean('verifikator_3').notNull().default(false),
    executive: boolean('executive').notNull().default(false),
    pelaksana: boolean('pelaksana').notNull().default(false),

    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('role_permissions_modul_key_idx').on(table.modulKey),
    index('role_permissions_kategori_idx').on(table.kategori),
  ]
);

// Types Inferences
export type EmployeeLevel = (typeof employeeLevelEnum.enumValues)[number];
export type AppRole = (typeof appRoleEnum.enumValues)[number];
export type CaterVerificationStatus = (typeof caterVerificationStatusEnum.enumValues)[number];

export type Pegawai = typeof pegawai.$inferSelect;
export type NewPegawai = typeof pegawai.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type UserWilayahScope = typeof userWilayahScope.$inferSelect;
export type UserRuteAssignment = typeof userRuteAssignment.$inferSelect;
export type CaterVerifikasiLog = typeof caterVerifikasiLog.$inferSelect;
export type NewCaterVerifikasiLog = typeof caterVerifikasiLog.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
