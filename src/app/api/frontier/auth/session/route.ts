import { NextResponse } from "next/server";
import {
  getStoredAuthSession,
  getStoredCredentialForSession,
} from "@/lib/frontierguard/repository";
import {
  clearFrontierSessionCookie,
  getFrontierSessionIdFromRequest,
} from "@/lib/frontierguard/session";
import type { FrontierSession } from "@/lib/frontierguard/types";

function unauthenticatedResponse(clearCookie = false) {
  const response = NextResponse.json({
    authenticated: false,
    session: null,
  });

  if (clearCookie) {
    clearFrontierSessionCookie(response);
  }

  return response;
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const sessionId = getFrontierSessionIdFromRequest(request);
  console.log(`[auth/session] GET start — cookie sessionId=${sessionId ? sessionId.slice(0, 16) + "..." : "(none)"}`);

  if (!sessionId) {
    console.log(`[auth/session] No session cookie → unauthenticated (${Date.now() - startedAt}ms)`);
    return unauthenticatedResponse();
  }

  const storedSession = await getStoredAuthSession(sessionId);
  console.log(`[auth/session] DB lookup done (${Date.now() - startedAt}ms) — found=${Boolean(storedSession)}`);

  if (!storedSession) {
    console.log(`[auth/session] Session not in DB → unauthenticated`);
    return unauthenticatedResponse();
  }

  if (
    storedSession.status !== "active" ||
    Date.parse(storedSession.expiresAt) <= Date.now()
  ) {
    console.log(`[auth/session] Session expired or inactive (status=${storedSession.status}) → clearing cookie`);
    return unauthenticatedResponse(true);
  }

  const credential = await getStoredCredentialForSession(sessionId);
  console.log(`[auth/session] Credential lookup done (${Date.now() - startedAt}ms) — found=${Boolean(credential)}`);

  if (!credential) {
    console.log(`[auth/session] No credential for session → unauthenticated`);
    return unauthenticatedResponse();
  }

  const session: Omit<FrontierSession, "credentialCount"> = {
    authenticated: true,
    operatorName: storedSession.operatorName,
    operatorWallet: storedSession.operatorWallet,
    passkeyCredentialId: credential.credential_id,
    passkeyLabel: credential.passkey_label ?? "Stored Veridex Passkey",
    passkeyKeyHash: credential.key_hash,
    vaultAddress: storedSession.vaultAddress || credential.vault_address,
    sessionId: storedSession.id,
    lastAuthenticatedAt: credential.last_authenticated_at ?? storedSession.createdAt,
    expiresAt: storedSession.expiresAt,
    networkStatus: "active",
  };

  console.log(`[auth/session] Authenticated \u2714 operator=${storedSession.operatorName} wallet=${storedSession.operatorWallet.slice(0, 10)}... (${Date.now() - startedAt}ms)`);

  return NextResponse.json({
    authenticated: true,
    session,
  });
}
