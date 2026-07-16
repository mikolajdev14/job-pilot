import { updateSession } from "@insforge/sdk/ssr/middleware";
import type { CookieOptions, CookieStore } from "@insforge/sdk/ssr/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPathPrefixes = ["/dashboard", "/profile", "/find-jobs"];

export async function proxy(request: NextRequest): Promise<Response> {
  const isProtectedRoute = protectedPathPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const requestCookies: CookieStore = {
    get: (name) => request.cookies.get(name)?.value,
  };

  function setResponseCookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): unknown;
  function setResponseCookie(
    options: { name: string; value: string } & CookieOptions,
  ): unknown;
  function setResponseCookie(
    nameOrOptions: string | ({ name: string; value: string } & CookieOptions),
    value?: string,
    options?: CookieOptions,
  ) {
    if (typeof nameOrOptions === "string") {
      return response.cookies.set(nameOrOptions, value ?? "", options);
    }

    const { name, value: cookieValue, ...cookieOptions } = nameOrOptions;
    return response.cookies.set(name, cookieValue, cookieOptions);
  }

  function deleteResponseCookie(name: string): unknown;
  function deleteResponseCookie(options: { name: string } & CookieOptions): unknown;
  function deleteResponseCookie(
    nameOrOptions: string | ({ name: string } & CookieOptions),
  ) {
    const name =
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name;
    return response.cookies.delete(name);
  }

  const responseCookies: CookieStore = {
    get: (name) => response.cookies.get(name)?.value,
    set: setResponseCookie,
    delete: deleteResponseCookie,
  };

  let sessionResult;

  try {
    sessionResult = await updateSession({
      requestCookies,
      responseCookies,
    });
  } catch (error) {
    console.error("[proxy] Session refresh failed", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const hasSessionCookie =
    request.cookies.has("insforge_access_token") ||
    request.cookies.has("insforge_refresh_token") ||
    Boolean(sessionResult.accessToken);

  if (sessionResult.error || !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*"],
};
