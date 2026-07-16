import { refreshAuth } from "@insforge/sdk/ssr";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await refreshAuth({
      request,
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
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
