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
  const sessionId = getFrontierSessionIdFromRequest(request);

  if (!sessionId) {
    return unauthenticatedResponse();
  }

  const storedSession = await getStoredAuthSession(sessionId);

  if (!storedSession) {
    return unauthenticatedResponse();
  }

  if (
    storedSession.status !== "active" ||
    Date.parse(storedSession.expiresAt) <= Date.now()
  ) {
    return unauthenticatedResponse(true);
  }

  const credential = await getStoredCredentialForSession(sessionId);

  if (!credential) {
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

  return NextResponse.json({
    authenticated: true,
    session,
  });
}
