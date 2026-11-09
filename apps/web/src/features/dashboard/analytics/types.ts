import type { analyticsService } from "@/server/services/dashboard/analytics.service";

export type AnalyticsPageData = Awaited<
  ReturnType<typeof analyticsService.getAnalyticsPageData>
>;
