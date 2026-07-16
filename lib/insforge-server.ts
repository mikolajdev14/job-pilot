import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

export async function createInsforgeServer() {
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: await cookies(),
  });
}
