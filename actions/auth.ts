"use server";

import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies, headers } from "next/headers";
import { OAUTH_CODE_VERIFIER_COOKIE } from "@/lib/auth-constants";
import { getInsforgeBaseUrl } from "@/lib/insforge-config";

type OAuthProvider = "google" | "github";

type OAuthResult =
  | { success: true; authorizationUrl: string }
  | { success: false; error: string };

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "github";
}

async function getOAuthCallbackUrl(): Promise<string> {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    return new URL("/callback", configuredAppUrl).toString();
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Missing request host");
  }

  return `${protocol}://${host}/callback`;
}

export async function startOAuthSignIn(provider: string): Promise<OAuthResult> {
  try {
    if (!isOAuthProvider(provider)) {
      return { success: false, error: "This sign in provider is not supported." };
    }

    const cookieStore = await cookies();
    const auth = createAuthActions({
      baseUrl: getInsforgeBaseUrl(),
      cookies: cookieStore,
    });
    const redirectTo = await getOAuthCallbackUrl();
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo,
      skipBrowserRedirect: true,
    });

    if (error || !data?.url || !data.codeVerifier) {
      console.error("[actions/auth] OAuth sign in could not start", error);
      return { success: false, error: "Could not start sign in. Please try again." };
    }

    cookieStore.set(OAUTH_CODE_VERIFIER_COOKIE, data.codeVerifier, {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { success: true, authorizationUrl: data.url };
  } catch (error) {
    console.error("[actions/auth] OAuth sign in failed", error);
    return { success: false, error: "Could not start sign in. Please try again." };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = createAuthActions({
      baseUrl: getInsforgeBaseUrl(),
      cookies: await cookies(),
    });
    const { error } = await auth.signOut();

    if (error) {
      console.error("[actions/auth] Sign out failed", error);
      return { success: false, error: "Could not sign out. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("[actions/auth] Sign out failed", error);
    return { success: false, error: "Could not sign out. Please try again." };
  }
}
