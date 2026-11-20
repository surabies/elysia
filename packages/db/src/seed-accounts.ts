import { db } from "./client";
import { user, account, session, userRoles } from "./schema";
import { hashPassword } from "better-auth/crypto";
import type { AppRole } from "./schema/rbac";
import { eq, and, inArray } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Pastikan environment lokal termuat saat dijalankan langsung maupun lewat workspace
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const DISALLOWED_WEAK_PASSWORDS = new Set([
  "wiskaprayoga12",
  "change-me-min-12-chars",
  "password123456",
  "123456789012",
]);

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
    id: "user-superadmin",
    name: "Wiska Prayoga",
    email: "wiska.prayoga@gmail.com",
    // Anda bisa menentukan password khusus di sini (min 12 char) jika ingin berbeda dari .env:
    // password: 'CustomSuperadmin123!',
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
  },
  {
    id: "user-staff-billing",
    name: "Staff Admin Billing",
    email: "staff.billing@pdam.co.id",
    roles: ["STAFF_ADMIN_BILLING"],
  },
  {
    id: "user-verifikator-1",
    name: "Supervisor Verifikator 1",
    email: "verifikator1@pdam.co.id",
    roles: ["VERIFIKATOR_1"],
  },
  {
    id: "user-verifikator-2",
    name: "Manager Verifikator 2",
    email: "verifikator2@pdam.co.id",
    roles: ["VERIFIKATOR_2"],
  },
  {
    id: "user-verifikator-3",
    name: "Direksi Verifikator 3",
    email: "verifikator3@pdam.co.id",
    roles: ["VERIFIKATOR_3"],
  },
];

export const SEED_PENCATAT_ACCOUNTS: SeedAccountDef[] = [
  {
    id: "user-pencatat-dadang",
    name: "Dadang",
    email: "dadang@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "DADANG",
  },
  {
    id: "user-pencatat-periyadi",
    name: "Periyadi",
    email: "periyadi@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "PERIYADI",
  },
  {
    id: "user-pencatat-omay",
    name: "Omay",
    email: "omay@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "OMAY",
  },
  {
    id: "user-pencatat-iwan",
    name: "Iwan",
    email: "iwan@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "IWAN",
  },
  {
    id: "user-pencatat-agus",
    name: "Agus",
    email: "agus@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "AGUS",
  },
  {
    id: "user-pencatat-didin",
    name: "Didin",
    email: "didin@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "DIDIN",
  },
  {
    id: "user-pencatat-rudy",
    name: "Rudy",
    email: "rudy@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "RUDY",
  },
  {
    id: "user-pencatat-dani",
    name: "Dani",
    email: "dani@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "DANI",
  },
  {
    id: "user-pencatat-edi",
    name: "Edi",
    email: "edi@cater.pdam.co.id",
    roles: ["PENCATAT"],
    petugasId: "EDI",
  },
];

/**
 * Melakukan seed atau reset akun user resmi dan kredensial Better-Auth.
 * Prioritas password tiap akun:
 * 1. Password spesifik di kode akun (acc.password) jika didefinisikan.
 * 2. Parameter defaultPassword atau process.env.SEED_DEFAULT_PASSWORD.
 * 3. FALLBACK_SEED_PASSWORD ('wiskaprayoga12').
 */
export async function seedAccounts(defaultPassword?: string) {
  const effectiveDefaultPassword = (
    defaultPassword ||
    process.env.SEED_DEFAULT_PASSWORD ||
    ""
  ).trim();

  if (!effectiveDefaultPassword) {
    throw new Error(
      "[SECURITY GUARD] Variabel lingkungan SEED_DEFAULT_PASSWORD wajib diset secara eksplisit (tidak ada fallback password bawaan di kode, terlepas dari NODE_ENV)."
    );
  }

  if (effectiveDefaultPassword.length < 12) {
    throw new Error(
      "[SECURITY GUARD] SEED_DEFAULT_PASSWORD wajib memiliki panjang minimal 12 karakter."
    );
  }

  if (DISALLOWED_WEAK_PASSWORDS.has(effectiveDefaultPassword.toLowerCase())) {
    throw new Error(
      "[SECURITY GUARD] SEED_DEFAULT_PASSWORD menggunakan nilai bawaan/contoh yang dilarang. Gunakan password yang kuat dan unik."
    );
  }

  // Hapus akun demo@example.com (seed-user-1) jika pernah ada di database
  await db.delete(user).where(eq(user.email, "demo@example.com"));

  console.log(
    "Seeding official accounts (5 Management/Roles + 9 Pencatat Lapangan)...",
  );
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
      throw new Error(
        `The seed password for ${acc.email} must be at least 12 characters long.`,
      );
    }

    const hashedPassword = await getHashedPassword(rawPassword);

    // 1. Upsert User (wajibGantiPassword = true untuk semua akun hasil seed awal)
    const primaryRole = acc.roles[0]?.toLowerCase() || 'petugas';
    await db
      .insert(user)
      .values({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        emailVerified: true,
        role: primaryRole,
        wajibGantiPassword: true,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: acc.name,
          email: acc.email,
          emailVerified: true,
          role: primaryRole,
          wajibGantiPassword: true,
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
        providerId: "credential",
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
        and(eq(account.userId, acc.id), eq(account.providerId, "credential")),
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
      ? "code override"
      : process.env.SEED_DEFAULT_PASSWORD
        ? "env (SEED_DEFAULT_PASSWORD)"
        : "fallback default";

    console.log(
      `  ✓ [${acc.email}] password reset successfully (source: ${passwordSource})`,
    );
  }

  // 4. Bersihkan session lama untuk akun seed agar sesi login yang stale tidak menggantung
  const userIds = allAccounts.map((a) => a.id);
  const deletedSessions = await db
    .delete(session)
    .where(inArray(session.userId, userIds))
    .returning({ id: session.id });

  if (deletedSessions.length > 0) {
    console.log(
      `  ✓ Cleared ${deletedSessions.length} stale session(s) to enforce fresh login.`,
    );
  }

  console.log(
    `Successfully seeded & synchronized ${allAccounts.length} user accounts.`,
  );
}

if (import.meta.main) {
  seedAccounts(process.env.SEED_DEFAULT_PASSWORD)
    .then(() => {
      console.log("Finished seeding accounts.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error seeding accounts:", err);
      process.exit(1);
    });
}
