import { importProgresCater } from './etl/import-progres-cater';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function main() {
  console.log('=== STARTING SEED TRANSAKSI CATER & DRD ===');
  const result = await importProgresCater({ masterOnly: false });
  console.log('Import result:', result);
  console.log('=== COMPLETED SEED TRANSAKSI CATER & DRD ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed transaksi:', err);
  process.exit(1);
});
