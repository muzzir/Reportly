import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  // 1. Signature Verification or Dev Fallback Parsing
  if (webhookSecret && !webhookSecret.startsWith("whsec_your_")) {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${(err as Error).message}` },
        { status: 400 }
      );
    }
  } else {
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  const adminSupabase = createAdminClient();

  // 2. Event Handler Processing
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.client_reference_id || session.metadata?.agency_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        let currentPeriodEnd = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        let planStatus = "active";

        if (isStripeConfigured() && subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            planStatus = sub.status;
            const subObj = sub as unknown as { current_period_end?: number };
            const periodSec = subObj.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400;
            currentPeriodEnd = new Date(periodSec * 1000).toISOString();
          } catch (err) {
            console.warn("Failed to retrieve Stripe subscription details:", err);
          }
        }

        if (agencyId) {
          await adminSupabase
            .from("agencies")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_tier: "pro",
              plan_status: planStatus,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", agencyId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const customerId = sub.customer as string;
        const status = sub.status;
        const subObj = sub as unknown as { current_period_end?: number };
        const periodSec = subObj.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400;
        const periodEnd = new Date(periodSec * 1000).toISOString();
        const planTier = ["active", "trialing"].includes(status) ? "pro" : "free";

        if (subscriptionId || customerId) {
          const matchQuery = subscriptionId
            ? `stripe_subscription_id.eq.${subscriptionId}`
            : `stripe_customer_id.eq.${customerId}`;

          await adminSupabase
            .from("agencies")
            .update({
              plan_tier: planTier,
              plan_status: status,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .or(matchQuery);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const customerId = sub.customer as string;

        if (subscriptionId || customerId) {
          const matchQuery = subscriptionId
            ? `stripe_subscription_id.eq.${subscriptionId}`
            : `stripe_customer_id.eq.${customerId}`;

          await adminSupabase
            .from("agencies")
            .update({
              plan_tier: "free",
              plan_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .or(matchQuery);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("Stripe webhook execution error:", err);
    await logger.error("stripe_webhook", errorMsg, { eventType: event?.type });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
