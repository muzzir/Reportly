import { GET as handleCallback } from "@/app/auth/callback/route";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleCallback(request);
}
