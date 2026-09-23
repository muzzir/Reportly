import { createAdminClient } from "@/lib/supabase/admin";
import { Json } from "@/types/database";

export interface LogPayload {
  source: string;
  message: string;
  level?: "info" | "warning" | "error" | "critical";
  metadata?: Record<string, unknown>;
}

export const logger = {
  /**
   * Logs an error exception to the platform_logs database table and server console.
   */
  async error(source: string, message: string, metadata: Record<string, unknown> = {}) {
    console.error(`[LOGGER:ERROR][${source}] ${message}`, metadata);
    return await saveLog({ source, message, level: "error", metadata });
  },

  /**
   * Logs an informational system event.
   */
  async info(source: string, message: string, metadata: Record<string, unknown> = {}) {
    console.log(`[LOGGER:INFO][${source}] ${message}`, metadata);
    return await saveLog({ source, message, level: "info", metadata });
  },

  /**
   * Logs a warning system event.
   */
  async warn(source: string, message: string, metadata: Record<string, unknown> = {}) {
    console.warn(`[LOGGER:WARN][${source}] ${message}`, metadata);
    return await saveLog({ source, message, level: "warning", metadata });
  },
};

async function saveLog({ source, message, level = "error", metadata = {} }: LogPayload) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("platform_logs").insert({
      source,
      message,
      level,
      metadata: metadata as Json,
    });
  } catch (err) {
    console.warn("Failed to write to platform_logs database table:", err);
  }
}
