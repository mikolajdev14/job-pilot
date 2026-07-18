import { createBrowserClient } from "@insforge/sdk/ssr";
import { getInsforgeBaseUrl } from "@/lib/insforge-config";

export const insforge = createBrowserClient({
  baseUrl: getInsforgeBaseUrl(),
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  refreshUrl: "/api/auth/refresh",
});
