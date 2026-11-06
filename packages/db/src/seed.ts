import { db } from './client';
import { user, places, account } from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seed() {
  console.log('Seeding initial data...');
  try {
    const userId = 'seed-user-1';
    const email = 'demo@example.com';

    // Insert demo user if not existing
    await db
      .insert(user)
      .values({
        id: userId,
        name: 'Demo Explorer',
        email,
        emailVerified: true,
      })
      .onConflictDoNothing();

    // Insert demo user account with password
    await db
      .insert(account)
      .values({
        id: 'seed-account-1',
        accountId: userId,
        providerId: 'credential',
        userId,
        password: 'Password123!',
      })
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
