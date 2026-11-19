import * as dotenv from 'dotenv';
import path from 'path';
import type { SeedOptions } from './types';

// Load environment in hierarchical order
const rootDir = path.resolve(__dirname, '../../../../');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });
dotenv.config({ path: path.resolve(rootDir, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const FALLBACK_SEED_PASSWORD = 'wiskaprayoga12';

/**
 * Parses command line flags into typed SeedOptions.
 *
 * Supported flags:
 *   --quick           Run quick mode (limits large datasets)
 *   --full            Run full dataset (all 22,549 records and 12,100 pipe segments)
 *   --force-etl       Force re-importing customer CSV dataset
 *   --limit=N         Set custom row limit for customer ETL
 *   --pipa-limit=N    Set custom limit for pipe network segments
 *   --only=a,b,c      Run only specific modules by ID
 *   --skip=x,y        Skip specific modules by ID
 *   --password=XYZ    Override default seed password
 *   --verbose         Enable detailed logging
 */
export function parseSeedOptions(argv: string[] = process.argv.slice(2)): SeedOptions {
  const isQuick = argv.includes('--quick');
  const isFull = argv.includes('--full');
  const forceEtl = argv.includes('--force-etl');
  const verbose = argv.includes('--verbose');

  // Parse limit
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  let limit: number | undefined = undefined;
  if (limitArg) {
    limit = parseInt(limitArg.split('=')[1], 10);
  } else if (isQuick) {
    limit = 500;
  } else if (isFull) {
    limit = undefined;
  }

  // Parse pipa limit
  const pipaLimitArg = argv.find((a) => a.startsWith('--pipa-limit='));
  let pipaLimit: number | undefined = undefined;
  if (pipaLimitArg) {
    pipaLimit = parseInt(pipaLimitArg.split('=')[1], 10);
  } else if (isQuick) {
    pipaLimit = 500;
  }

  // Parse only modules
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const only = onlyArg
    ? onlyArg.split('=')[1].split(',').map((s) => s.trim().toLowerCase())
    : undefined;

  // Parse skip modules
  const skipArg = argv.find((a) => a.startsWith('--skip='));
  const skip = skipArg
    ? skipArg.split('=')[1].split(',').map((s) => s.trim().toLowerCase())
    : undefined;

  // Parse custom password
  const passArg = argv.find((a) => a.startsWith('--password='));
  const defaultPassword =
    passArg?.split('=')[1] ||
    process.env.SEED_DEFAULT_PASSWORD ||
    FALLBACK_SEED_PASSWORD;

  if (defaultPassword.length < 12) {
    console.warn('⚠️ Warning: Seed default password is less than 12 characters.');
  }

  return {
    quick: isQuick,
    forceEtl,
    limit,
    pipaLimit,
    only,
    skip,
    defaultPassword,
    verbose,
  };
}
