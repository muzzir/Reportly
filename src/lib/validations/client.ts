import { z } from "zod";

export const clientSchema = z.object({
  agency_id: z.string().uuid("Invalid agency ID"),
  name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  logo_url: z.string().url("Invalid logo URL").or(z.literal("")).optional().nullable(),
  website: z.string().url("Invalid website URL").or(z.literal("")).optional().nullable(),
  industry: z.string().max(50).optional().nullable(),
  timezone: z.string().default("UTC"),
  currency: z.string().length(3, "Currency code must be 3 letters (e.g. USD)").default("USD"),
});

export const updateClientSchema = clientSchema.partial().omit({ agency_id: true });

export type ClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
