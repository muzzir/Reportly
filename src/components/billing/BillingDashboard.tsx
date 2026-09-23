"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Agency } from "@/types";
import { createCheckoutSessionAction, createPortalSessionAction } from "@/app/actions/stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { Check, Sparkles, CreditCard, ShieldCheck, Zap, ExternalLink, Loader2, Crown } from "lucide-react";

interface BillingDashboardProps {
  agency: Agency;
}

export function BillingDashboard({ agency }: BillingDashboardProps) {
  const searchParams = useSearchParams();
  const [loadingAction, setLoadingAction] = useState<"checkout" | "portal" | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const isPro = agency.plan_tier === "pro" && agency.plan_status === "active";

  useEffect(() => {
    if (searchParams.get("success") || searchParams.get("mock_success")) {
      const timer = setTimeout(() => {
        setToast({
          id: "checkout-success",
          type: "success",
          title: "Subscribed to Pro Plan!",
          description: "Your agency has been upgraded to Pro. Enjoy unlimited clients and premium features.",
        });
      }, 0);
      return () => clearTimeout(timer);
    } else if (searchParams.get("canceled")) {
      const timer = setTimeout(() => {
        setToast({
          id: "checkout-canceled",
          type: "info",
          title: "Checkout Canceled",
          description: "You have not been charged. You can upgrade to Pro anytime.",
        });
      }, 0);
      return () => clearTimeout(timer);
    } else if (searchParams.get("mock_portal")) {
      const timer = setTimeout(() => {
        setToast({
          id: "portal-mock",
          type: "info",
          title: "Billing Portal (Mock Mode)",
          description: "Opened developer mock mode billing portal.",
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    try {
      setLoadingAction("checkout");
      const res = await createCheckoutSessionAction();

      if (res.error) {
        setToast({
          id: "upgrade-err",
          type: "error",
          title: "Upgrade Failed",
          description: res.error,
        });
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setToast({
        id: "upgrade-catch-err",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to initiate checkout.",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoadingAction("portal");
      const res = await createPortalSessionAction();

      if (res.error) {
        setToast({
          id: "portal-err",
          type: "error",
          title: "Portal Redirect Failed",
          description: res.error,
        });
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setToast({
        id: "portal-catch-err",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to open Stripe portal.",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const formattedPeriodEnd = agency.current_period_end
    ? new Date(agency.current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <div className="space-y-6 max-w-5xl">
        {/* Current Plan Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-xl shadow-xs ${
                isPro
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {isPro ? <Crown className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  Current Agency Tier: <span className="capitalize">{agency.plan_tier}</span>
                </h2>
                {isPro ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs">
                    Pro Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Free Tier
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isPro
                  ? formattedPeriodEnd
                    ? `Your Pro subscription automatically renews on ${formattedPeriodEnd}.`
                    : "Your agency enjoys full Pro access."
                  : "You are currently on the Free plan (limited to 1 client account)."}
              </p>
            </div>
          </div>

          {isPro && (
            <Button
              onClick={handleManageSubscription}
              disabled={loadingAction === "portal"}
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-slate-300 dark:border-slate-700"
            >
              {loadingAction === "portal" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>Manage Invoices & Cards</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Button>
          )}
        </div>

        {/* Pricing Cards Comparison */}
        <div className="grid gap-6 md:grid-cols-2 pt-2">
          {/* Free Tier Card */}
          <Card
            className={`border-slate-200 dark:border-slate-800 flex flex-col justify-between ${
              !isPro ? "ring-2 ring-blue-600 dark:ring-blue-500" : ""
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Starter Free</CardTitle>
                {!isPro && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-400">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Ideal for trying Reportly with a single client project.
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  $0
                </span>
                <span className="text-xs text-slate-500">/ forever</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Up to 1 Client Account</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Multi-channel Metrics Integration (Google & Meta Ads)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Standard PDF Exports</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Check className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="line-through">Custom White-Label Branding</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Check className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="line-through">Automated Monthly Email Reports</span>
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              <Button disabled variant="outline" className="w-full text-xs" size="sm">
                {!isPro ? "Active Plan" : "Included in Pro"}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier Card */}
          <Card
            className={`border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden ${
              isPro ? "ring-2 ring-amber-500" : "border-blue-200 shadow-md dark:border-blue-900"
            }`}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Recommended
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                  Pro Agency
                </CardTitle>
                {isPro && (
                  <Badge className="bg-amber-500 text-white text-xs">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Unlimited scaling, full white-labeled branding, and monthly cron automation.
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  $49
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Unlimited Client Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Custom Agency Logo & Brand Colors</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Automated 1st-of-the-Month Email Reports</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Public Shareable Live Portals (`/p/[token]`)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>High-DPI Branded PDF Exports</span>
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              {isPro ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={loadingAction === "portal"}
                  variant="outline"
                  className="w-full text-xs gap-2"
                  size="sm"
                >
                  {loadingAction === "portal" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5" />
                  )}
                  <span>Manage Subscription</span>
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loadingAction === "checkout"}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 font-medium shadow-sm"
                >
                  {loadingAction === "checkout" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  <span>Upgrade to Pro Plan</span>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
