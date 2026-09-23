import { z } from "zod";

export const clientAutomationSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  auto_report_enabled: z.boolean(),
  auto_report_emails: z
    .array(z.string().email("Invalid email address format"))
    .or(
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      )
    ),
});

export type ClientAutomationInput = z.infer<typeof clientAutomationSchema>;
