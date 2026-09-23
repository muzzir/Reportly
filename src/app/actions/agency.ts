"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { agencySchema, AgencyFormInput } from "@/lib/validations/agency";
import { Agency } from "@/types";

export async function getAgencyAction(): Promise<{ data?: Agency; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    const { data: member, error: memberError } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !member?.agency_id) {
      return { error: "No active agency membership found for user." };
    }

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", member.agency_id)
      .single();

    if (agencyError || !agency) {
      return { error: agencyError?.message || "Agency not found." };
    }

    return { data: agency as Agency };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch agency details." };
  }
}

export async function updateAgencyAction(
  input: AgencyFormInput
): Promise<{ data?: Agency; error?: string }> {
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

    const parseResult = agencySchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { error: `${issue.path.join(".")}: ${issue.message}` };
    }

    const { name, website, primary_color, logo_url } = parseResult.data;

    const { data, error } = await supabase
      .from("agencies")
      .update({
        name,
        website: website || null,
        primary_color,
        logo_url: logo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.agency_id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");

    return { data: data as Agency };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update agency settings." };
  }
}

export async function uploadAgencyLogoAction(
  formData: FormData
): Promise<{ publicUrl?: string; error?: string }> {
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

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "No logo file provided." };
    }

    // Max 2MB limit
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { error: "File size exceeds maximum limit of 2MB." };
    }

    // Allowed mime types
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        error: "Invalid file format. Allowed formats: PNG, JPG, WebP, SVG.",
      };
    }

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${member.agency_id}/logo_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("agency_assets")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { error: `Storage upload failed: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from("agency_assets")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update agencies table with new logo_url
    await supabase
      .from("agencies")
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", member.agency_id);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");

    return { publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload logo." };
  }
}
