import { z } from "zod";

export const oauthCallbackSchema = z.object({
  code: z.string().optional(),
  state: z.string().min(1, "State parameter is required"),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackQuery = z.infer<typeof oauthCallbackSchema>;

export const oauthTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type OAuthTokenResponse = z.infer<typeof oauthTokenResponseSchema>;

export const providerParamSchema = z.enum(["google_ads", "meta_ads", "ga4"]);
