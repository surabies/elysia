import { db } from './client';
import { user, places, account, userRoles } from './schema';
import { hashPassword } from 'better-auth/crypto';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seed() {
  console.log('Seeding initial data...');
  try {
    const userId = 'seed-user-1';
    const email = 'demo@example.com';
    const rawPassword = 'Password123!';
    const hashedPassword = await hashPassword(rawPassword);

    // Insert demo user if not existing
    await db
      .insert(user)
      .values({
        id: userId,
        name: 'Demo Admin',
        email,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: 'Demo Admin',
          email,
          emailVerified: true,
        },
      });

    // Insert demo user account with hashed password
    await db
      .insert(account)
      .values({
        id: 'seed-account-1',
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashedPassword,
      })
      .onConflictDoUpdate({
        target: account.id,
        set: {
          password: hashedPassword,
        },
      });

    // Insert RBAC user roles for admin access
    await db
      .insert(userRoles)
      .values([
        { userId, role: 'SUPERADMIN' },
        { userId, role: 'STAFF_ADMIN_BILLING' },
        { userId, role: 'VERIFIKATOR_1' },
      ])
      .onConflictDoNothing();

    // Insert sample places (Monas Jakarta & surrounding landmarks)
    await db
      .insert(places)
      .values([
        {
          id: 'place-monas',
          name: 'National Monument (Monas)',
          description: 'Iconic tower in Central Jakarta',
          location: { x: 106.827153, y: -6.175392 }, // lon, lat
          userId,
        },
        {
          id: 'place-istiqlal',
          name: 'Istiqlal Mosque',
          description: 'Largest mosque in Southeast Asia',
          location: { x: 106.831389, y: -6.170278 }, // lon, lat
          userId,
        },
        {
          id: 'place-katedral',
          name: 'Jakarta Cathedral',
          description: 'Neo-gothic Roman Catholic cathedral',
          location: { x: 106.833056, y: -6.169167 }, // lon, lat
          userId,
        },
      ])
      .onConflictDoNothing();

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
