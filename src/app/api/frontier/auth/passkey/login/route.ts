import { NextResponse } from "next/server";
import type { PasskeyCredential } from "@veridex/sdk";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import {
  createAuthSession,
  getStoredCredential,
  persistAuditEvent,
  persistAuthCeremony,
  persistRuntimeError,
  upsertPasskeyCredential,
} from "@/lib/frontierguard/repository";
import { attachFrontierSessionCookie } from "@/lib/frontierguard/session";
import { deriveVaultAddressForCredential } from "@/lib/frontierguard/veridex";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      credential: PasskeyCredential;
      passkeyLabel?: string;
      operatorName?: string;
      username?: string;
      displayName?: string;
      userAgent?: string;
    };

    if (!body.credential?.credentialId || !body.credential?.keyHash) {
      return NextResponse.json({ error: "Missing authenticated passkey credential." }, { status: 400 });
    }

    const knownCredential = await getStoredCredential(body.credential.credentialId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
    const vaultAddress = knownCredential?.vault_address ?? deriveVaultAddressForCredential(body.credential);
    const operatorName =
      body.operatorName?.trim() ||
      knownCredential?.display_name ||
      knownCredential?.username ||
      body.displayName?.trim() ||
      body.username?.trim() ||
      "Frontier Operator";
    const passkeyLabel =
      body.passkeyLabel?.trim() ||
      knownCredential?.passkey_label ||
      "Stored Veridex Passkey";

    const storedCredential = await upsertPasskeyCredential({
      credentialId: body.credential.credentialId,
      keyHash: body.credential.keyHash,
      publicKeyX: body.credential.publicKeyX.toString(),
      publicKeyY: body.credential.publicKeyY.toString(),
      username: body.username?.trim() || knownCredential?.username || undefined,
      displayName: body.displayName?.trim() || knownCredential?.display_name || undefined,
      passkeyLabel,
      operatorWallet: knownCredential?.operator_wallet ?? vaultAddress,
      vaultAddress,
      lastAuthenticatedAt: now.toISOString(),
      metadata: {
        authFlow: "login",
        credentialRecoveredFromDb: Boolean(knownCredential),
      },
    });

    const sessionId = `session_${crypto.randomUUID()}`;
    const persistedSession = await createAuthSession({
      id: sessionId,
      credentialId: body.credential.credentialId,
      operatorWallet: knownCredential?.operator_wallet ?? vaultAddress,
      operatorName,
      vaultAddress,
      sessionOrigin: "login",
      expiresAt,
      userAgent: body.userAgent ?? context.userAgent,
      ipAddress: context.ipAddress,
      metadata: {
        credentialRecoveredFromDb: Boolean(knownCredential),
      },
    });

    await Promise.all([
      persistAuthCeremony({
        ceremonyType: "passkey_login",
        status: "success",
        credentialId: body.credential.credentialId,
        keyHash: body.credential.keyHash,
        username: knownCredential?.username ?? body.username?.trim() ?? operatorName,
        displayName: knownCredential?.display_name ?? body.displayName?.trim() ?? operatorName,
        passkeyLabel,
        operatorWallet: knownCredential?.operator_wallet ?? vaultAddress,
        vaultAddress,
        knownCredential: Boolean(knownCredential),
        sessionId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        userAgent: body.userAgent ?? context.userAgent,
        ipAddress: context.ipAddress,
        origin: context.origin,
        durationMs: durationMsSince(startedAt),
        metadata: {
          persisted: Boolean(storedCredential && persistedSession),
          knownCredential: Boolean(knownCredential),
        },
      }),
      persistAuditEvent({
        eventType: "auth_login",
        action: "passkey_login",
        source: "api/frontier/auth/passkey/login",
        status: "success",
        requestId: context.requestId,
        correlationId: context.correlationId,
        sessionId,
        credentialId: body.credential.credentialId,
        operatorWallet: knownCredential?.operator_wallet ?? vaultAddress,
        actorType: "operator",
        resource: "/api/frontier/auth/passkey/login",
        durationMs: durationMsSince(startedAt),
        metadata: {
          knownCredential: Boolean(knownCredential),
        },
      }),
    ]);

    const response = NextResponse.json({
      authenticated: true,
      persisted: Boolean(storedCredential && persistedSession),
      session: {
        authenticated: true,
        operatorName,
        operatorWallet: knownCredential?.operator_wallet ?? vaultAddress,
        passkeyCredentialId: body.credential.credentialId,
        passkeyLabel,
        passkeyKeyHash: body.credential.keyHash,
        vaultAddress,
        sessionId,
        lastAuthenticatedAt: now.toISOString(),
        expiresAt,
        networkStatus: "active" as const,
      },
      credential: {
        credentialId: body.credential.credentialId,
        keyHash: body.credential.keyHash,
        displayName: knownCredential?.display_name ?? body.displayName?.trim() ?? operatorName,
        username: knownCredential?.username ?? body.username?.trim() ?? operatorName,
        vaultAddress,
        knownCredential: Boolean(knownCredential),
      },
    });

    attachFrontierSessionCookie(response, sessionId, expiresAt);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to authenticate with passkey.";

    await Promise.all([
      persistAuthCeremony({
        ceremonyType: "passkey_login",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        origin: context.origin,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
        errorCode: error instanceof Error ? error.name : "PasskeyLoginError",
      }),
      persistRuntimeError({
        scope: "api/frontier/auth/passkey/login",
        errorName: error instanceof Error ? error.name : "PasskeyLoginError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: {
          requestId: context.requestId,
        },
      }),
    ]);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
