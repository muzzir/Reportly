"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { generateReportEmailHtml } from "@/lib/email/ReportEmail";

export interface SendReportEmailInput {
  clientId: string;
  recipientEmail: string;
  subject: string;
  message: string;
  pdfBase64: string;
  filename: string;
  startDate: string;
  endDate: string;
}

export async function sendReportEmailAction(
  input: SendReportEmailInput
): Promise<{ success?: boolean; error?: string; mocked?: boolean }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required." };
    }

    // Get agency membership
    const { data: member } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    if (!member?.agency_id) {
      return { error: "No active agency membership found." };
    }

    // Verify client belongs to user's agency
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", input.clientId)
      .eq("agency_id", member.agency_id)
      .single();

    if (clientError || !client) {
      return { error: "Client not found or access unauthorized." };
    }

    // Fetch agency details for branding
    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", member.agency_id)
      .single();

    const agencyName = agency?.name || "Marketing Agency";
    const agencyLogoUrl = agency?.logo_url || null;
    const agencyColor = agency?.primary_color || "#0F172A";

    // Clean base64 string and convert to Buffer
    const base64Data = input.pdfBase64.includes(",")
      ? input.pdfBase64.split(",")[1]
      : input.pdfBase64;

    const pdfBuffer = Buffer.from(base64Data, "base64");

    // Generate HTML template
    const emailHtml = generateReportEmailHtml({
      agencyName,
      agencyLogoUrl,
      agencyColor,
      clientName: client.name,
      startDate: input.startDate,
      endDate: input.endDate,
      customMessage: input.message,
    });

    const apiKey = process.env.RESEND_API_KEY;

    // Check if running in Developer Mock Mode
    if (!apiKey || apiKey.startsWith("re_your_") || apiKey.startsWith("re_mock")) {
      console.log("==========================================");
      console.log("[REPORTLY DEV MOCK EMAIL DISPATCH]");
      console.log(`To: ${input.recipientEmail}`);
      console.log(`Subject: ${input.subject}`);
      console.log(`Agency: ${agencyName}`);
      console.log(`PDF Attachment: ${input.filename} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
      console.log("==========================================");

      return {
        success: true,
        mocked: true,
      };
    }

    // Live Resend Email Dispatch
    const resend = new Resend(apiKey);

    const { error: sendError } = await resend.emails.send({
      from: `${agencyName} <onboarding@resend.dev>`,
      to: [input.recipientEmail],
      subject: input.subject,
      html: emailHtml,
      attachments: [
        {
          filename: input.filename,
          content: pdfBuffer,
        },
      ],
    });

    if (sendError) {
      return { error: `Resend dispatch failed: ${sendError.message}` };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to dispatch report email.",
    };
  }
}
