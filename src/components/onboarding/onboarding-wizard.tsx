"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import {
  Building2,
  Palette,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  BarChart3,
  Globe,
} from "lucide-react";

const BRAND_COLORS = [
  { name: "Slate Navy", hex: "#0F172A" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Crimson", hex: "#DC2626" },
  { name: "Midnight Black", hex: "#18181B" },
];

export function OnboardingWizard({ defaultAgencyName }: { defaultAgencyName?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form states
  const [agencyName, setAgencyName] = useState(defaultAgencyName || "");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0F172A");

  // Client states
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("Marketing & Advertising");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");

  const handleNext = () => {
    if (step === 1 && !agencyName.trim()) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Agency Name Required",
        description: "Please enter your agency or company name to continue.",
      });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Client Name Required",
        description: "Please enter a name for your first client to complete setup.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await completeOnboardingAction({
        agencyName: agencyName.trim(),
        website: website.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        clientName: clientName.trim(),
        clientIndustry: clientIndustry.trim(),
        timezone,
        currency,
      });

      if (res.error) {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Onboarding Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Welcome to Reportly!",
          description: "Your agency workspace has been configured successfully.",
        });
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      }
    } catch {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Submission Error",
        description: "An unexpected error occurred while completing onboarding.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 md:p-8 text-slate-100 relative">
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-white">Reportly</span>
          <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Agency Setup Wizard
          </span>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-400">
          <span className={step >= 1 ? "text-blue-400" : ""}>1. Agency Profile</span>
          <span className={step >= 2 ? "text-blue-400" : ""}>2. Branding & Colors</span>
          <span className={step >= 3 ? "text-blue-400" : ""}>3. First Client</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Card */}
      <Card className="w-full max-w-xl border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {step === 1 && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Welcome to Reportly!
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Let&apos;s set up your agency workspace profile. This information will appear on all client portals and report exports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Agency Name *</label>
                <Input
                  placeholder="e.g., Apex Digital Marketing"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Website URL (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="https://apexmarketing.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                Brand Customization
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                White-label your reports with your agency logo and primary brand accent color.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Agency Logo Image URL (Optional)</label>
                <Input
                  placeholder="https://yourdomain.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Primary Brand Accent Color</label>
                <div className="grid grid-cols-3 gap-3">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPrimaryColor(c.hex)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                        primaryColor === c.hex
                          ? "border-blue-500 bg-slate-800 ring-2 ring-blue-500"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-medium text-slate-200">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 mt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  PDF & Portal Preview
                </span>
                <div className="flex items-center gap-3 p-3 rounded-md border border-slate-800 bg-slate-900">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {agencyName ? agencyName[0].toUpperCase() : "A"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{agencyName || "Your Agency"}</h4>
                    <span className="text-[10px] text-slate-400">White-labeled client report preview</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={handleBack} className="border-slate-800 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold">
                <span>Next Step</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Add Your First Client
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Enter your first client account details so you can immediately begin generating reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Client Name *</label>
                <Input
                  placeholder="e.g., Acme E-Commerce Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Industry</label>
                  <Input
                    placeholder="e.g., E-Commerce / SaaS"
                    value={clientIndustry}
                    onChange={(e) => setClientIndustry(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Launching Dashboard...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Complete Setup & Launch</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
