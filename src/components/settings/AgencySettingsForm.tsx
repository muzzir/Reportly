"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agencySchema, AgencyFormInput } from "@/lib/validations/agency";
import { updateAgencyAction, uploadAgencyLogoAction } from "@/app/actions/agency";
import { Agency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { Building2, Save, Upload, Loader2, Image as ImageIcon, Trash2, Globe, Palette } from "lucide-react";

interface AgencySettingsFormProps {
  agency: Agency;
}

export function AgencySettingsForm({ agency }: AgencySettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(agency.logo_url || null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AgencyFormInput>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: agency.name || "",
      website: agency.website || "",
      primary_color: agency.primary_color || "#0F172A",
      logo_url: agency.logo_url || null,
    },
  });

  const currentColor = useWatch({
    control,
    name: "primary_color",
    defaultValue: agency.primary_color || "#0F172A",
  });

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("primary_color", val, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({
        id: "file-size-error",
        type: "error",
        title: "File too large",
        description: "Logo file size must be less than 2MB.",
      });
      return;
    }

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue("logo_url", null, { shouldValidate: true });
  };

  const onSubmit = async (data: AgencyFormInput) => {
    try {
      setIsSubmitting(true);
      let updatedLogoUrl = data.logo_url;

      // Upload new logo to Supabase Storage if selected
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);

        const uploadRes = await uploadAgencyLogoAction(formData);
        if (uploadRes.error) {
          setToast({
            id: "upload-error",
            type: "error",
            title: "Logo upload failed",
            description: uploadRes.error,
          });
          setIsSubmitting(false);
          return;
        }
        if (uploadRes.publicUrl) {
          updatedLogoUrl = uploadRes.publicUrl;
        }
      }

      // Save updated agency settings
      const result = await updateAgencyAction({
        ...data,
        logo_url: updatedLogoUrl,
      });

      if (result.error) {
        setToast({
          id: "update-error",
          type: "error",
          title: "Update failed",
          description: result.error,
        });
      } else {
        setToast({
          id: "update-success",
          type: "success",
          title: "Settings saved",
          description: "Agency profile and branding updated successfully.",
        });
      }
    } catch (err) {
      setToast({
        id: "action-error",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to save settings.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm shadow-xs"
                style={{ backgroundColor: currentColor || "#0F172A" }}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Agency Profile & White-Label Branding
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Manage agency details, logo, and brand color applied to report dashboards and PDF exports.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* Agency Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Agency Name <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register("name")}
                placeholder="e.g. Acme Digital Marketing"
                className="text-xs"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500">{errors.name.message}</p>
              )}
            </div>

            {/* Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                Website URL
              </label>
              <Input
                {...register("website")}
                placeholder="https://acmemarketing.com"
                className="text-xs"
              />
              {errors.website && (
                <p className="text-[11px] text-rose-500">{errors.website.message}</p>
              )}
            </div>

            {/* Primary Brand Color & Logo Upload Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Primary Brand Color Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-slate-400" />
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor || "#0F172A"}
                    onChange={handleColorChange}
                    className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                  />
                  <Input
                    {...register("primary_color")}
                    placeholder="#0F172A"
                    className="font-mono text-xs uppercase"
                  />
                </div>
                {errors.primary_color && (
                  <p className="text-[11px] text-rose-500">
                    {errors.primary_color.message}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  Applied to PDF header accents, chart bars, and table highlights.
                </p>
              </div>

              {/* Logo Asset Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                  Agency Logo
                </label>

                {logoPreview ? (
                  <div className="relative flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Agency logo preview"
                      className="h-10 max-w-[140px] object-contain rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-slate-400 hover:text-rose-600 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 p-4 rounded-lg cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                    <Upload className="h-5 w-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Upload Logo (PNG, JPG, SVG)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Max file size: 2MB
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-slate-800/60">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Agency Settings</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
