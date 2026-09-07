import { z } from "zod";

export const agencySchema = z.object({
  name: z.string().min(2, "Agency name must be at least 2 characters").max(100),
  logo_url: z.string().url("Invalid logo URL").or(z.literal("")).optional().nullable(),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code").optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")).optional().nullable(),
});

export const updateAgencySchema = agencySchema.partial();

export type AgencyInput = z.infer<typeof agencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
