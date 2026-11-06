import { describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '@cater/db';

describe('Database Schema & Migration Verification', () => {
  it('Migration file must enable PostGIS extension first', () => {
    const migrationDir = path.resolve('packages/db/src/migrations');
    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThan(0);

    const firstMigration = fs.readFileSync(
      path.join(migrationDir, files[0]!),
      'utf-8'
    );
    expect(firstMigration).toContain('CREATE EXTENSION IF NOT EXISTS postgis;');
    expect(firstMigration).toContain('CREATE INDEX "places_location_idx" ON "places" USING gist ("location");');
  });

  it('Schema definitions for Better Auth and Places must export required tables', () => {
    expect(schema.user).toBeDefined();
    expect(schema.session).toBeDefined();
    expect(schema.account).toBeDefined();
    expect(schema.verification).toBeDefined();
    expect(schema.places).toBeDefined();
  });
});
