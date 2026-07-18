import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { getInsforgeBaseUrl } from "@/lib/insforge-config";

export async function createInsforgeServer() {
  return createServerClient({
    baseUrl: getInsforgeBaseUrl(),
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: await cookies(),
  });
}
