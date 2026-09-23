import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(apiKey, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
  appInfo: {
    name: "Reportly SaaS",
    version: "0.1.0",
  },
});

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.startsWith("sk_test_placeholder") && key.startsWith("sk_"));
}
