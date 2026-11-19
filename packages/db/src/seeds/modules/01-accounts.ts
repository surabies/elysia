import { db } from '../../client';
import { user, account, userRoles } from '../../schema';
import { hashPassword } from 'better-auth/crypto';
import type { AppRole } from '../../schema/rbac';
import { eq, inArray } from 'drizzle-orm';
import type { SeedModule, SeedOptions } from '../types';

export interface SeedAccountDef {
  id: string;
  name: string;
  email: string;
  password?: string;
  roles: AppRole[];
  petugasId?: string;
}

export const SEED_MANAGEMENT_ACCOUNTS: SeedAccountDef[] = [
  {
    id: 'user-superadmin',
    name: 'Super Admin PDAM',
    email: 'superadmin@pdam.co.id',
    roles: ['SUPERADMIN', 'STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3'],
  },
  {
    id: 'user-staff-billing',
    name: 'Staff Admin Billing',
    email: 'staff.billing@pdam.co.id',
    roles: ['STAFF_ADMIN_BILLING'],
  },
  {
    id: 'user-verifikator-1',
    name: 'Supervisor Verifikator 1',
    email: 'verifikator1@pdam.co.id',
    roles: ['VERIFIKATOR_1'],
  },
  {
    id: 'user-verifikator-2',
    name: 'Manager Verifikator 2',
    email: 'verifikator2@pdam.co.id',
    roles: ['VERIFIKATOR_2'],
  },
  {
    id: 'user-verifikator-3',
    name: 'Direksi Verifikator 3',
    email: 'verifikator3@pdam.co.id',
    roles: ['VERIFIKATOR_3'],
  },
  {
    id: 'seed-user-1',
    name: 'Demo Admin',
    email: 'demo@example.com',
    roles: ['SUPERADMIN', 'STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3'],
  },
];

export const SEED_PENCATAT_ACCOUNTS: SeedAccountDef[] = [
  { id: 'user-pencatat-dadang', name: 'Dadang (Pencatat)', email: 'dadang@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'DADANG' },
  { id: 'user-pencatat-periyadi', name: 'Periyadi (Pencatat)', email: 'periyadi@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'PERIYADI' },
  { id: 'user-pencatat-omay', name: 'Omay (Pencatat)', email: 'omay@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'OMAY' },
  { id: 'user-pencatat-iwan', name: 'Iwan (Pencatat)', email: 'iwan@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'IWAN' },
  { id: 'user-pencatat-agus', name: 'Agus (Pencatat)', email: 'agus@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'AGUS' },
  { id: 'user-pencatat-didin', name: 'Didin (Pencatat)', email: 'didin@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'DIDIN' },
  { id: 'user-pencatat-rudy', name: 'Rudy (Pencatat)', email: 'rudy@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'RUDY' },
  { id: 'user-pencatat-dani', name: 'Dani (Pencatat)', email: 'dani@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'DANI' },
  { id: 'user-pencatat-edi', name: 'Edi (Pencatat)', email: 'edi@cater.pdam.co.id', roles: ['PENCATAT'], petugasId: 'EDI' },
];

export async function seedAccounts(defaultPassword?: string) {
  const effectiveDefaultPassword = defaultPassword || 'wiskaprayoga12';
  const allAccounts = [...SEED_MANAGEMENT_ACCOUNTS, ...SEED_PENCATAT_ACCOUNTS];

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
  let upsertedCount = 0;

  for (const acc of allAccounts) {
    const passwordHash = acc.password ? await getHashedPassword(acc.password) : defaultHash;
    const now = new Date();

    // 1. Upsert User
    await db
      .insert(user)
      .values({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: acc.name,
          email: acc.email,
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

    // 3. Reset & Seed RBAC User Roles
    await db.delete(userRoles).where(eq(userRoles.userId, acc.id));
    for (const r of acc.roles) {
      await db.insert(userRoles).values({
        userId: acc.id,
        role: r,
        createdAt: now,
      });
    }

    upsertedCount++;
  }

  return { count: upsertedCount, message: `Seeded ${upsertedCount} official user accounts & RBAC roles.` };
}

export const accountsModule: SeedModule = {
  id: 'accounts',
  name: 'Akun Pengguna & RBAC',
  description: '15 Akun resmi (5 Manajerial/Verifikator + 9 Cater Lapangan + 1 Demo) & Hak Akses',
  run: async (options: SeedOptions) => {
    return await seedAccounts(options.defaultPassword);
  },
};
