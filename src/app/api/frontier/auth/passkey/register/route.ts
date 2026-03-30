import { NextResponse } from "next/server";
import type { PasskeyCredential } from "@veridex/sdk";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import {
  createAuthSession,
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
      username?: string;
      displayName?: string;
      passkeyLabel?: string;
      operatorName?: string;
      userAgent?: string;
    };

    if (!body.credential?.credentialId || !body.credential?.keyHash) {
      return NextResponse.json({ error: "Missing passkey credential payload." }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
    const vaultAddress = deriveVaultAddressForCredential(body.credential);
    const operatorName =
      body.operatorName?.trim() ||
      body.displayName?.trim() ||
      body.username?.trim() ||
      "Frontier Operator";
    const passkeyLabel = body.passkeyLabel?.trim() || "Veridex Passkey";

    const storedCredential = await upsertPasskeyCredential({
      credentialId: body.credential.credentialId,
      keyHash: body.credential.keyHash,
      publicKeyX: body.credential.publicKeyX.toString(),
      publicKeyY: body.credential.publicKeyY.toString(),
      username: body.username?.trim(),
      displayName: body.displayName?.trim(),
      passkeyLabel,
      operatorWallet: vaultAddress,
      vaultAddress,
      lastAuthenticatedAt: now.toISOString(),
      metadata: {
        authFlow: "register",
      },
    });

    const sessionId = `session_${crypto.randomUUID()}`;
    const persistedSession = await createAuthSession({
      id: sessionId,
      credentialId: body.credential.credentialId,
      operatorWallet: vaultAddress,
      operatorName,
      vaultAddress,
      sessionOrigin: "register",
      expiresAt,
      userAgent: body.userAgent ?? context.userAgent,
      ipAddress: context.ipAddress,
      metadata: {
        credentialId: body.credential.credentialId,
      },
    });

    await Promise.all([
      persistAuthCeremony({
        ceremonyType: "passkey_register",
        status: "success",
        credentialId: body.credential.credentialId,
        keyHash: body.credential.keyHash,
        username: body.username?.trim() || operatorName,
        displayName: body.displayName?.trim() || operatorName,
        passkeyLabel,
        operatorWallet: vaultAddress,
        vaultAddress,
        knownCredential: false,
        sessionId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        userAgent: body.userAgent ?? context.userAgent,
        ipAddress: context.ipAddress,
        origin: context.origin,
        durationMs: durationMsSince(startedAt),
        metadata: {
          persisted: Boolean(storedCredential && persistedSession),
        },
      }),
      persistAuditEvent({
        eventType: "auth_register",
        action: "passkey_register",
        source: "api/frontier/auth/passkey/register",
        status: "success",
        requestId: context.requestId,
        correlationId: context.correlationId,
        sessionId,
        credentialId: body.credential.credentialId,
        operatorWallet: vaultAddress,
        actorType: "operator",
        resource: "/api/frontier/auth/passkey/register",
        durationMs: durationMsSince(startedAt),
        metadata: {
          username: body.username?.trim() || operatorName,
          displayName: body.displayName?.trim() || operatorName,
        },
      }),
    ]);

    const response = NextResponse.json({
      authenticated: true,
      persisted: Boolean(storedCredential && persistedSession),
      session: {
        authenticated: true,
        operatorName,
        operatorWallet: vaultAddress,
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
        displayName: body.displayName?.trim() || operatorName,
        username: body.username?.trim() || body.displayName?.trim() || operatorName,
        vaultAddress,
      },
    });

    attachFrontierSessionCookie(response, sessionId, expiresAt);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register passkey credential.";

    await Promise.all([
      persistAuthCeremony({
        ceremonyType: "passkey_register",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        origin: context.origin,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
        errorCode: error instanceof Error ? error.name : "PasskeyRegisterError",
      }),
      persistRuntimeError({
        scope: "api/frontier/auth/passkey/register",
        errorName: error instanceof Error ? error.name : "PasskeyRegisterError",
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
