import { NextResponse } from "next/server";

export const FRONTIER_SESSION_COOKIE = "frontierguard_session";

export interface FrontierSessionLocator {
  sessionId?: string;
  credentialId?: string;
  passkeyKeyHash?: string;
  operatorWallet?: string;
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, entry) => {
      const separator = entry.indexOf("=");

      if (separator <= 0) {
        return cookies;
      }

      const name = entry.slice(0, separator).trim();
      const value = entry.slice(separator + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function getFrontierSessionIdFromRequest(request: Request): string | undefined {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  return cookies[FRONTIER_SESSION_COOKIE] || undefined;
}

export function resolveFrontierSessionLocator(
  request: Request,
  input?: FrontierSessionLocator,
): FrontierSessionLocator {
  return {
    sessionId: input?.sessionId ?? getFrontierSessionIdFromRequest(request),
    credentialId: input?.credentialId,
    passkeyKeyHash: input?.passkeyKeyHash,
    operatorWallet: input?.operatorWallet,
  };
}

export function attachFrontierSessionCookie(
  response: NextResponse,
  sessionId: string,
  expiresAt: string,
): void {
  response.cookies.set(FRONTIER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearFrontierSessionCookie(response: NextResponse): void {
  response.cookies.set(FRONTIER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
