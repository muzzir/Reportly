"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe, isStripeConfigured } from "@/lib/stripe/server";
import { getAppBaseUrl } from "@/lib/utils/url";

export async function createCheckoutSessionAction(): Promise<{
  url?: string | null;
  error?: string;
  mocked?: boolean;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: member } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    if (!member?.agency_id) {
      return { error: "No active agency membership found." };
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", member.agency_id)
      .single();

    if (!agency) {
      return { error: "Agency profile not found." };
    }

    const appBaseUrl = getAppBaseUrl();

    // Developer Mock Mode Fallback if Stripe API keys are unset or using placeholders
    if (!isStripeConfigured()) {
      console.log("[MOCK STRIPE CHECKOUT] Upgrading agency to Pro:", agency.id);

      // Upgrade agency directly for dev testing
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("agencies")
        .update({
          plan_tier: "pro",
          plan_status: "active",
          current_period_end: oneYearFromNow,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agency.id);

      return {
        url: `${appBaseUrl}/dashboard/billing?mock_success=true`,
        mocked: true,
      };
    }

    // Live Stripe Checkout Session Creation
    let customerId = agency.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: agency.name,
        metadata: {
          agency_id: agency.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("agencies")
        .update({ stripe_customer_id: customerId })
        .eq("id", agency.id);
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return { error: "Stripe Price ID (STRIPE_PRO_PRICE_ID) is not configured in environment." };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      client_reference_id: agency.id,
      metadata: {
        agency_id: agency.id,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appBaseUrl}/dashboard/billing?success=true`,
      cancel_url: `${appBaseUrl}/dashboard/billing?canceled=true`,
    });

    return { url: session.url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create Stripe Checkout session.",
    };
  }
}

export async function createPortalSessionAction(): Promise<{
  url?: string | null;
  error?: string;
  mocked?: boolean;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: member } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    if (!member?.agency_id) {
      return { error: "No active agency membership found." };
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", member.agency_id)
      .single();

    if (!agency) {
      return { error: "Agency profile not found." };
    }

    const appBaseUrl = getAppBaseUrl();

    // Developer Mock Mode Fallback
    if (!isStripeConfigured()) {
      console.log("[MOCK STRIPE PORTAL] Opening Billing Portal for agency:", agency.id);
      return {
        url: `${appBaseUrl}/dashboard/billing?mock_portal=true`,
        mocked: true,
      };
    }

    if (!agency.stripe_customer_id) {
      return { error: "No active Stripe customer record associated with this agency." };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: `${appBaseUrl}/dashboard/billing`,
    });

    return { url: portalSession.url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create Stripe Billing Portal session.",
    };
  }
}
