import { db } from './index';
import { user, places } from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function seed() {
  console.log('Seeding initial data...');
  try {
    // Insert demo user if not existing
    const demoUser = await db
      .insert(user)
      .values({
        id: 'seed-user-1',
        name: 'Demo Explorer',
        email: 'demo@example.com',
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    const userId = demoUser[0]?.id || 'seed-user-1';

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
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
