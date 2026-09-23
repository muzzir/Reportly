import { z } from "zod";

export const agencySchema = z.object({
  name: z
    .string()
    .min(2, "Agency name must be at least 2 characters long")
    .max(100, "Agency name cannot exceed 100 characters"),
  website: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^https?:\/\/.+/i.test(val),
      "Website must be a valid URL starting with http:// or https://"
    )
    .optional(),
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code"),
  logo_url: z.string().nullable().optional(),
});

export type AgencyFormInput = z.infer<typeof agencySchema>;
