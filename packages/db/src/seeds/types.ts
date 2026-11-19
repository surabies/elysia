export interface SeedOptions {
  quick?: boolean;
  forceEtl?: boolean;
  limit?: number;
  pipaLimit?: number;
  only?: string[];
  skip?: string[];
  defaultPassword?: string;
  verbose?: boolean;
}

export interface SeedModuleResult {
  count?: number;
  message?: string;
  [key: string]: any;
}

export interface SeedModule {
  id: string;
  name: string;
  description: string;
  run: (options: SeedOptions) => Promise<SeedModuleResult>;
}

export interface SeedStepResult {
  id: string;
  step?: string;
  name: string;
  success: boolean;
  count?: number;
  insertedCount?: number;
  updatedCount?: number;
  durationMs: number;
  message?: string;
  error?: Error | any;
}

export interface SeedRunnerOptions {
  step?: string;
  verbose?: boolean;
}
