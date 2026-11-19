import type { CaterBacaMeterInput, Pelanggan } from '@cater/types';

/**
 * Mobile Cater Field App - Core Reading Handler
 * Used by field officers to record water meter readings, capture photos, and geotag with GPS.
 */
export async function submitMeterReading(reading: CaterBacaMeterInput) {
  console.log('[Mobile Cater] Recording reading for nolg:', reading.nolg);
  console.log('[Mobile Cater] Stand Akhir:', reading.stma, 'Stand Lalu:', reading.stml);
  return {
    success: true,
    data: reading,
    timestamp: new Date().toISOString(),
  };
}

export type { Pelanggan, CaterBacaMeterInput };
