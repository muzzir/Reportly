import { z } from "zod";

const baseReportSchema = z.object({
  agency_id: z.string().uuid("Invalid agency ID"),
  client_id: z.string().uuid("Invalid client ID"),
  title: z.string().min(2, "Report title must be at least 2 characters").max(150),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Period start must be YYYY-MM-DD"),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Period end must be YYYY-MM-DD"),
  status: z.enum(["draft", "generating", "published", "archived"]).default("draft"),
});

export const reportSchema = baseReportSchema.refine(
  (data) => new Date(data.period_end) >= new Date(data.period_start),
  {
    message: "Period end date must be after or equal to period start date",
    path: ["period_end"],
  }
);

export const updateReportSchema = baseReportSchema.partial().omit({ agency_id: true });

export type ReportInput = z.infer<typeof reportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
