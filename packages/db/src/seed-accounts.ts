import * as dotenv from 'dotenv';
import path from 'path';
import { seedAccounts, SEED_OFFICIAL_ROSTER } from './seeds/modules/01-accounts';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export { seedAccounts, SEED_OFFICIAL_ROSTER };

if (import.meta.main) {
  console.log('Seeding official Perumda staff accounts from docs/PETUGAS.md...');
  seedAccounts(process.env.SEED_DEFAULT_PASSWORD || 'wiskaprayoga12')
    .then((res) => {
      console.log('Finished seeding accounts:', res.message);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding accounts:', err);
      process.exit(1);
    });
}
