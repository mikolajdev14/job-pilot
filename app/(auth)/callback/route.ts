import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { OAUTH_CODE_VERIFIER_COOKIE } from "@/lib/auth-constants";
import { getPostHogClient } from "@/lib/posthog-server";

export async function GET(request: Request): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("insforge_code");
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get(OAUTH_CODE_VERIFIER_COOKIE)?.value;

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
    }

    if (!codeVerifier) {
      return NextResponse.redirect(new URL("/login?error=missing_verifier", request.url));
    }

    const auth = createAuthActions({ cookies: cookieStore });
    const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);
    cookieStore.delete(OAUTH_CODE_VERIFIER_COOKIE);

    if (error || !data?.user) {
      console.error("[auth/callback] OAuth exchange failed", error);
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }

    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: data.user.id,
      properties: {
        email: data.user.email,
        name: data.user.profile?.name,
      },
    });
    posthog.capture({
      distinctId: data.user.id,
      event: "user_authenticated",
      properties: { authentication_method: "oauth" },
    });
    await posthog.flush();

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("[auth/callback] OAuth callback failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
