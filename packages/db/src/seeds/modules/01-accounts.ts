import { db } from '../../client';
import { user, account, userRoles, pegawai, petugasCater } from '../../schema';
import { hashPassword } from 'better-auth/crypto';
import type { AppRole, EmployeeLevel } from '../../schema/rbac';
import { eq, inArray, sql } from 'drizzle-orm';
import type { SeedModule, SeedOptions } from '../types';

export interface SeedAccountDef {
  id: string;
  name: string;
  email: string;
  password?: string;
  roles: AppRole[];
  nip: string;
  level: EmployeeLevel;
  bagian: string;
  wilayahKerja: string;
  jabatanNama: string;
  unitKerja: string;
  petugasId?: string;
}

export const SEED_OFFICIAL_ROSTER: SeedAccountDef[] = [
  // --- PIMPINAN PUNCAK & IT ROOT ---
  {
    id: 'user-wiska-admin',
    name: 'Wiska Prayoga Hartawan',
    email: 'wiska.prayoga@gmail.com',
    nip: '199204202018011003',
    level: 'STAFF_PENYELIA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Penyelia Pencatat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: [
      'SUPERADMIN',
      'STAFF',
      'STAFF_ADMIN_BILLING',
      'VERIFIKATOR_1',
      'VERIFIKATOR_2',
      'VERIFIKATOR_3',
      'EXECUTIVE',
    ],
  },
  {
    id: 'user-direksi',
    name: 'Direksi Perumda',
    email: 'direksi@pdam.co.id',
    nip: '196801011995011001',
    level: 'DIREKSI',
    bagian: 'UMUM',
    wilayahKerja: 'KANTOR_PUSAT',
    jabatanNama: 'Direksi Perumda',
    unitKerja: 'Kantor Pusat - Direksi',
    roles: ['DIREKSI', 'EXECUTIVE'],
  },
  {
    id: 'user-senior-manager-w5',
    name: 'Senior Manager Wilayah 5',
    email: 'seniormanager.w5@pdam.co.id',
    nip: '197201011998011001',
    level: 'SENIOR_MANAGER',
    bagian: 'UMUM',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Senior Manager Pelayanan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5',
    roles: ['SENIOR_MANAGER', 'VERIFIKATOR_3'],
  },

  // --- BAGIAN PENCATAT METER ---
  {
    id: 'user-deni-iskandar',
    name: 'Deni Iskandar',
    email: 'deni.iskandar@pdam.co.id',
    nip: '197508122002031001',
    level: 'MANAGER',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Manager Pencatat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['MANAGER', 'VERIFIKATOR_2'],
  },
  {
    id: 'user-mamat-sulaeman',
    name: 'Mamat Sulaeman',
    email: 'mamat.sulaeman@pdam.co.id',
    nip: '197805142005011002',
    level: 'SUPERVISOR',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Supervisor Pencatat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['SUPERVISOR', 'VERIFIKATOR_1'],
  },
  // Petugas Catat Meter Lapangan (Mobile Cater)
  {
    id: 'user-cater-agus',
    name: 'Agus Gantina Hidayat',
    email: 'agus@cater.pdam.co.id',
    nip: '198501012010011001',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'AGUS',
  },
  {
    id: 'user-cater-dadang',
    name: 'Dadang Sopyan',
    email: 'dadang@cater.pdam.co.id',
    nip: '198602022010011002',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'DADANG',
  },
  {
    id: 'user-cater-dani',
    name: 'Dani Budiman',
    email: 'dani@cater.pdam.co.id',
    nip: '198703032010011003',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'DANI',
  },
  {
    id: 'user-cater-didin',
    name: 'Didin Rosidin',
    email: 'didin@cater.pdam.co.id',
    nip: '198804042010011004',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'DIDIN',
  },
  {
    id: 'user-cater-iwan',
    name: 'Iwan Sudirman',
    email: 'iwan@cater.pdam.co.id',
    nip: '198905052010011005',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'IWAN',
  },
  {
    id: 'user-cater-isa',
    name: 'Isa Septian',
    email: 'isa.septian@cater.pdam.co.id',
    nip: '199506062021011006',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'EDI', // Mengisi posisi rute EDI yang sudah pensiun
  },
  {
    id: 'user-cater-omay',
    name: 'Omay',
    email: 'omay@cater.pdam.co.id',
    nip: '199007072010011007',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'OMAY',
  },
  {
    id: 'user-cater-periyadi',
    name: 'Peryadi',
    email: 'periyadi@cater.pdam.co.id',
    nip: '199108082010011008',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'PERIYADI',
  },
  {
    id: 'user-cater-rudy',
    name: 'Rudy Kurnia',
    email: 'rudy@cater.pdam.co.id',
    nip: '199209092010011009',
    level: 'PELAKSANA',
    bagian: 'PENCATAT_METER',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Petugas Catat Meter Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Pencatat Meter',
    roles: ['PENCATAT', 'PELAKSANA'],
    petugasId: 'RUDY',
  },

  // --- BAGIAN RPM (REKENING & PENGENDALIAN METER) ---
  {
    id: 'user-sukandi-rpm',
    name: 'Sukandi',
    email: 'sukandi@pdam.co.id',
    nip: '197609202003011001',
    level: 'MANAGER',
    bagian: 'RPM',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Manager RPM Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian RPM',
    roles: ['MANAGER'],
  },
  {
    id: 'user-rpm-asep',
    name: 'Asep',
    email: 'asep.rpm@pdam.co.id',
    nip: '199001102015011010',
    level: 'PELAKSANA',
    bagian: 'RPM',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana RPM Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian RPM',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-rpm-yusuf',
    name: 'Muhammad Yusuf Iskandar',
    email: 'yusuf.rpm@pdam.co.id',
    nip: '199302152018011011',
    level: 'PELAKSANA',
    bagian: 'RPM',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana RPM Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian RPM',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-rpm-saiful',
    name: 'Saiful Akbar',
    email: 'saiful.rpm@pdam.co.id',
    nip: '199403202019011012',
    level: 'PELAKSANA',
    bagian: 'RPM',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana RPM Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian RPM',
    roles: ['PELAKSANA'],
  },

  // --- BAGIAN LANGGANAN (HUBLANG / PEMASARAN) ---
  {
    id: 'user-rieskha-langganan',
    name: 'Rieskha',
    email: 'rieskha@pdam.co.id',
    nip: '198007122006042001',
    level: 'MANAGER',
    bagian: 'LANGGANAN',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Manager Langganan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Langganan',
    roles: ['MANAGER'],
  },
  {
    id: 'user-langganan-aditya',
    name: 'Aditya',
    email: 'aditya.hublang@pdam.co.id',
    nip: '199211052017011013',
    level: 'PELAKSANA',
    bagian: 'LANGGANAN',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Langganan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Langganan',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-langganan-rini',
    name: 'Rini Rosdiani',
    email: 'rini.rosdiani@pdam.co.id',
    nip: '199408222019012014',
    level: 'PELAKSANA',
    bagian: 'LANGGANAN',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Langganan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Langganan',
    roles: ['PELAKSANA'],
  },

  // --- BAGIAN PENAGIHAN ---
  {
    id: 'user-penagihan-yeni',
    name: 'Yeni',
    email: 'yeni.penagihan@pdam.co.id',
    nip: '198904122014012015',
    level: 'STAFF_PENYELIA',
    bagian: 'PENAGIHAN',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Penagihan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Penagihan',
    roles: ['STAFF', 'STAFF_ADMIN_BILLING'],
  },
  {
    id: 'user-penagihan-romi',
    name: 'Romi',
    email: 'romi.penagihan@pdam.co.id',
    nip: '199106182016011016',
    level: 'PELAKSANA',
    bagian: 'PENAGIHAN',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Penagihan Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Penagihan',
    roles: ['PELAKSANA'],
  },

  // --- BAGIAN SUB ZONA / DISTRIBUSI ---
  {
    id: 'user-wakidi-distribusi',
    name: 'Wakidi',
    email: 'wakidi@pdam.co.id',
    nip: '197403102001011001',
    level: 'MANAGER',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Manager Distribusi Sub Zona 1 Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['MANAGER'],
  },
  {
    id: 'user-gesit-distribusi',
    name: 'Gesit Nurdaksina',
    email: 'gesit.nurdaksina@pdam.co.id',
    nip: '197705122003011002',
    level: 'MANAGER',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Manager Distribusi Sub Zona 2 Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['MANAGER'],
  },
  // Staf Distribusi
  {
    id: 'user-dist-wiwin',
    name: 'Wiwin Kurnaesih',
    email: 'wiwin@pdam.co.id',
    nip: '198802142012012017',
    level: 'STAFF_PENYELIA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['STAFF'],
  },
  {
    id: 'user-dist-elang',
    name: 'Elang',
    email: 'elang@pdam.co.id',
    nip: '199009192015011018',
    level: 'STAFF_PENYELIA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['STAFF'],
  },
  {
    id: 'user-dist-kevin',
    name: 'Kevin',
    email: 'kevin@pdam.co.id',
    nip: '199304252018011019',
    level: 'STAFF_PENYELIA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['STAFF'],
  },
  {
    id: 'user-dist-hani',
    name: 'Hani Nugraheni',
    email: 'hani@pdam.co.id',
    nip: '199512012020012020',
    level: 'STAFF_PENYELIA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Staf Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['STAFF'],
  },
  // Pelaksana Lapangan Distribusi
  {
    id: 'user-dist-ahmad',
    name: 'Ahmad Syarif',
    email: 'ahmad.syarif@pdam.co.id',
    nip: '199201102016011021',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-kusnadi',
    name: 'Kusnadi',
    email: 'kusnadi@pdam.co.id',
    nip: '199102202015011022',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-wahyudin',
    name: 'Wahyudin',
    email: 'wahyudin@pdam.co.id',
    nip: '199003152014011023',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-rahmat',
    name: 'Rahmat',
    email: 'rahmat.dist@pdam.co.id',
    nip: '199304182017011024',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-rizky',
    name: 'Rizky Martin',
    email: 'rizky.martin@pdam.co.id',
    nip: '199405222019011025',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-mamiek',
    name: 'Mamiek',
    email: 'mamiek@pdam.co.id',
    nip: '198906302013011026',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-sutisna',
    name: 'Sutisna',
    email: 'sutisna@pdam.co.id',
    nip: '198807142012011027',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
  {
    id: 'user-dist-andi',
    name: 'Andi',
    email: 'andi.dist@pdam.co.id',
    nip: '199508252021011028',
    level: 'PELAKSANA',
    bagian: 'DISTRIBUSI',
    wilayahKerja: 'WILAYAH_5',
    jabatanNama: 'Pelaksana Distribusi Wilayah 5',
    unitKerja: 'Pelayanan Wilayah 5 - Bagian Distribusi',
    roles: ['PELAKSANA'],
  },
];

export async function seedAccounts(defaultPassword?: string) {
  const effectiveDefaultPassword = defaultPassword || 'wiskaprayoga12';

  const hashCache = new Map<string, string>();
  async function getHashedPassword(plain: string): Promise<string> {
    if (hashCache.has(plain)) {
      return hashCache.get(plain)!;
    }
    const hashed = await hashPassword(plain);
    hashCache.set(plain, hashed);
    return hashed;
  }

  const defaultHash = await getHashedPassword(effectiveDefaultPassword);

  // 1. Bersihkan akun lama yang tidak ada dalam daftar resmi baru
  const officialIds = SEED_OFFICIAL_ROSTER.map((a) => a.id);
  const oldUsers = await db.select({ id: user.id }).from(user);
  const oldIdsToDelete = oldUsers
    .map((u) => u.id)
    .filter((id) => !officialIds.includes(id) && !id.startsWith('cust-')); // simpan pelanggan jika ada

  if (oldIdsToDelete.length > 0) {
    const tablesWithUserFk = [
      { table: 'pengaduan', col: 'ditugaskan_ke_id' },
      { table: 'riwayat_pengaduan', col: 'petugas_id' },
      { table: 'riwayat_pengaduan', col: 'petugas_tujuan_id' },
      { table: 'periode_penagihan', col: 'ditutup_by_id' },
      { table: 'periode_penagihan', col: 'dibuka_by_id' },
      { table: 'role_permissions', col: 'updated_by' },
      { table: 'drd_cakupan_penduduk', col: 'updated_by' },
      { table: 'cater_mandiri_pelanggan', col: 'verified_by' },
      { table: 'gwm_baca_meter', col: 'petugas_id' },
      { table: 'water_meter_mutasi', col: 'verifikator_id' },
      { table: 'places', col: 'user_id' },
      { table: 'user_permission_overrides', col: 'user_id' },
    ];
    for (const item of tablesWithUserFk) {
      try {
        await db.execute(sql.raw(`UPDATE "${item.table}" SET "${item.col}" = NULL WHERE "${item.col}" IS NOT NULL`));
      } catch (e: any) {
        // abaikan jika tabel tidak ada
      }
    }
    await db.delete(user).where(inArray(user.id, oldIdsToDelete));
  }

  // Bersihkan tabel pegawai untuk diisi ulang dengan data fresh
  await db.delete(pegawai);

  let upsertedCount = 0;

  for (const acc of SEED_OFFICIAL_ROSTER) {
    const passwordHash = acc.password ? await getHashedPassword(acc.password) : defaultHash;
    const now = new Date();

    // 1. Upsert User (Wajib ganti password aktif untuk seluruh akun hasil seed dengan password default)
    await db
      .insert(user)
      .values({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        emailVerified: true,
        image: null,
        wajibGantiPassword: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: acc.name,
          email: acc.email,
          wajibGantiPassword: true,
          updatedAt: now,
        },
      });

    // 2. Upsert Account Credential
    await db
      .insert(account)
      .values({
        id: `account-${acc.id}`,
        userId: acc.id,
        accountId: acc.id,
        providerId: 'credential',
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: account.id,
        set: {
          password: passwordHash,
          updatedAt: now,
        },
      });

    // 3. Reset & Seed RBAC User Roles (Verifikator V1/V2 khusus Bagian Pencatat Meter)
    await db.delete(userRoles).where(eq(userRoles.userId, acc.id));
    const rolesToAssign = new Set<string>(acc.roles);

    if (acc.bagian === 'PENCATAT_METER') {
      if (rolesToAssign.has('SUPERVISOR')) rolesToAssign.add('VERIFIKATOR_1');
      if (rolesToAssign.has('MANAGER')) rolesToAssign.add('VERIFIKATOR_2');
    }
    if (rolesToAssign.has('SENIOR_MANAGER')) rolesToAssign.add('VERIFIKATOR_3');
    if (rolesToAssign.has('DIREKSI')) rolesToAssign.add('EXECUTIVE');
    if (rolesToAssign.has('STAFF') && acc.bagian !== 'DISTRIBUSI') {
      rolesToAssign.add('STAFF_ADMIN_BILLING');
    }

    for (const r of rolesToAssign) {
      await db.insert(userRoles).values({
        userId: acc.id,
        role: r as any,
        createdAt: now,
      }).onConflictDoNothing();
    }

    // 4. Insert Profil Pegawai Resmi
    await db.insert(pegawai).values({
      id: crypto.randomUUID(),
      userId: acc.id,
      nip: acc.nip,
      namaLengkap: acc.name,
      level: acc.level,
      bagian: acc.bagian,
      wilayahKerja: acc.wilayahKerja,
      jabatanNama: acc.jabatanNama,
      unitKerja: acc.unitKerja,
      aktif: true,
      createdAt: now,
      updatedAt: now,
    });

    // 5. Hubungkan ke Petugas Cater jika ada ID petugas
    if (acc.petugasId) {
      await db
        .insert(petugasCater)
        .values({
          id: acc.petugasId,
          nama: acc.name,
          aktif: true,
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: petugasCater.id,
          set: {
            nama: acc.name,
            aktif: true,
          },
        });
    }

    upsertedCount++;
  }

  return { count: upsertedCount, message: `Berhasil mendaftarkan ${upsertedCount} akun resmi dan profil pegawai Perumda.` };
}

export const accountsModule: SeedModule = {
  id: 'accounts',
  name: 'Akun Pengguna & RBAC',
  description: 'Akun resmi pegawai Perumda sesuai struktur organisasi Wilayah 5 & Pimpinan',
  run: async (options: SeedOptions) => {
    return await seedAccounts(options.defaultPassword);
  },
};
