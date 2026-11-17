export interface SeedStepResult {
  step: string;
  name: string;
  success: boolean;
  insertedCount?: number;
  updatedCount?: number;
  durationMs: number;
  message?: string;
  error?: Error;
}

export interface SeedRunnerOptions {
  step?: string;
  verbose?: boolean;
}
