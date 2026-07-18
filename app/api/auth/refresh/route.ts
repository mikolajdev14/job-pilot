import { refreshAuth } from "@insforge/sdk/ssr";
import { NextResponse } from "next/server";
import { getInsforgeBaseUrl } from "@/lib/insforge-config";

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await refreshAuth({
      request,
      baseUrl: getInsforgeBaseUrl(),
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    });

    return result.response;
  } catch (error) {
    console.error("[api/auth/refresh] Session refresh failed", error);
    return NextResponse.json(
      { success: false, error: "Could not refresh the session." },
      { status: 500 },
    );
  }
}
