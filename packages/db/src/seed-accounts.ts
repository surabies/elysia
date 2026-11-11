import { db } from './client';
import { user, account, session, userRoles } from './schema';
import { hashPassword } from 'better-auth/crypto';
import type { AppRole } from './schema/rbac';
import { eq, and, inArray } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Pastikan environment lokal termuat saat dijalankan langsung maupun lewat workspace
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const FALLBACK_SEED_PASSWORD = 'wiskaprayoga12';

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
    // Anda bisa menentukan password khusus di sini (min 12 char) jika ingin berbeda dari .env:
    // password: 'CustomSuperadmin123!',
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

/**
 * Melakukan seed atau reset akun user resmi dan kredensial Better-Auth.
 * Prioritas password tiap akun:
 * 1. Password spesifik di kode akun (acc.password) jika didefinisikan.
 * 2. Parameter defaultPassword atau process.env.SEED_DEFAULT_PASSWORD.
 * 3. FALLBACK_SEED_PASSWORD ('wiskaprayoga12').
 */
export async function seedAccounts(defaultPassword?: string) {
  const effectiveDefaultPassword =
    defaultPassword ||
    process.env.SEED_DEFAULT_PASSWORD ||
    FALLBACK_SEED_PASSWORD;

  if (effectiveDefaultPassword.length < 12) {
    throw new Error('Default seed password must be at least 12 characters long.');
  }

  console.log('Seeding official accounts (5 Management/Roles + 9 Pencatat Lapangan + Demo)...');
  const allAccounts = [...SEED_MANAGEMENT_ACCOUNTS, ...SEED_PENCATAT_ACCOUNTS];

  // Cache hash agar tidak perlu menghitung ulang password yang sama
  const hashCache = new Map<string, string>();
  async function getHashedPassword(plain: string): Promise<string> {
    if (hashCache.has(plain)) {
      return hashCache.get(plain)!;
    }
    const hashed = await hashPassword(plain);
    hashCache.set(plain, hashed);
    return hashed;
  }

  for (const acc of allAccounts) {
    const rawPassword = acc.password || effectiveDefaultPassword;
    if (rawPassword.length < 12) {
      throw new Error(`The seed password for ${acc.email} must be at least 12 characters long.`);
    }

    const hashedPassword = await getHashedPassword(rawPassword);

    // 1. Upsert User
    await db
      .insert(user)
      .values({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: acc.name,
          email: acc.email,
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

    // 2. Upsert Account (Password) berdasarkan account.id
    const accountId = `acc-${acc.id}`;
    await db
      .insert(account)
      .values({
        id: accountId,
        accountId: acc.id,
        providerId: 'credential',
        userId: acc.id,
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: account.id,
        set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

    // Pastikan jika ada rekod kredensial lain untuk userId ini, passwordnya ikut disinkronkan
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(account.userId, acc.id),
          eq(account.providerId, 'credential')
        )
      );

    // 3. Insert Roles
    for (const r of acc.roles) {
      await db
        .insert(userRoles)
        .values({
          userId: acc.id,
          role: r,
        })
        .onConflictDoNothing();
    }

    const passwordSource = acc.password
      ? 'code override'
      : process.env.SEED_DEFAULT_PASSWORD
        ? 'env (SEED_DEFAULT_PASSWORD)'
        : 'fallback default';

    console.log(`  ✓ [${acc.email}] password reset successfully (source: ${passwordSource})`);
  }

  // 4. Bersihkan session lama untuk akun seed agar sesi login yang stale tidak menggantung
  const userIds = allAccounts.map((a) => a.id);
  const deletedSessions = await db
    .delete(session)
    .where(inArray(session.userId, userIds))
    .returning({ id: session.id });

  if (deletedSessions.length > 0) {
    console.log(`  ✓ Cleared ${deletedSessions.length} stale session(s) to enforce fresh login.`);
  }

  console.log(`Successfully seeded & synchronized ${allAccounts.length} user accounts.`);
}

if (import.meta.main) {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || FALLBACK_SEED_PASSWORD;
  seedAccounts(seedPassword)
    .then(() => {
      console.log('Finished seeding accounts.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding accounts:', err);
      process.exit(1);
    });
}
