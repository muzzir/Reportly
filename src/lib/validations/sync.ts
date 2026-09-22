import { z } from "zod";

export const syncMetricsSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SyncMetricsInput = z.infer<typeof syncMetricsSchema>;
