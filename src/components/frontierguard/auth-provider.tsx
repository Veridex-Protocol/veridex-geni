"use client";

import {
  PasskeyManager,
  createSDK,
  type PasskeyCredential,
} from "@veridex/sdk";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FrontierSession } from "@/lib/frontierguard/types";

const AUTH_STATE_KEY = "veridex-frontierguard-auth-v1";
const PROFILE_STATE_KEY = "veridex-frontierguard-passkey-profiles-v1";

interface StoredPasskeyProfile {
  credentialId: string;
  keyHash: string;
  username: string;
  displayName: string;
  passkeyLabel: string;
  vaultAddress: string;
  createdAt: string;
  lastAuthenticatedAt: string;
}

interface AuthMutationOptions {
  username?: string;
  displayName?: string;
  passkeyLabel?: string;
}

interface FrontierAuthContextValue {
  ready: boolean;
  busy: boolean;
  isSupported: boolean;
  platformAuthenticatorAvailable: boolean;
  session: FrontierSession | null;
  error?: string;
  storedProfiles: StoredPasskeyProfile[];
  registerPasskey: (options: Required<AuthMutationOptions>) => Promise<FrontierSession>;
  signInWithPasskey: () => Promise<FrontierSession>;
  refreshSession: (options?: { silent?: boolean }) => Promise<FrontierSession | null>;
  signOut: () => void;
  clearError: () => void;
}

interface AuthApiResponse {
  authenticated: boolean;
  persisted: boolean;
  session: Omit<FrontierSession, "credentialCount">;
  credential: {
    credentialId: string;
    keyHash: string;
    displayName: string;
    username: string;
    vaultAddress: string;
    knownCredential?: boolean;
  };
}

interface SerializedPasskeyCredential {
  credentialId: string;
  keyHash: string;
  publicKeyX: string;
  publicKeyY: string;
}

interface AuthSessionApiResponse {
  authenticated: boolean;
  session: Omit<FrontierSession, "credentialCount"> | null;
  error?: string;
}

const FrontierAuthContext = createContext<FrontierAuthContextValue | null>(null);

function parseProfiles(): Record<string, StoredPasskeyProfile> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(PROFILE_STATE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, StoredPasskeyProfile>;
  } catch {
    return {};
  }
}

function saveProfiles(profiles: Record<string, StoredPasskeyProfile>): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROFILE_STATE_KEY, JSON.stringify(profiles));
}

function loadStoredSession(): FrontierSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FrontierSession;
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      window.localStorage.removeItem(AUTH_STATE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredSession(session: FrontierSession | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STATE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(session));
}

function inferPasskeyLabel(): string {
  if (typeof navigator === "undefined") {
    return "Veridex Passkey";
  }

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) {
    return "Mac Touch ID Passkey";
  }
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "iCloud Passkey";
  }
  if (userAgent.includes("android")) {
    return "Android Device Passkey";
  }
  if (userAgent.includes("windows")) {
    return "Windows Hello Passkey";
  }

  return "Veridex Passkey";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? `Request failed for ${url}`);
  }

  return json;
}

function browserNetwork(): "mainnet" | "testnet" {
  return process.env.NEXT_PUBLIC_FRONTIER_VERIDEX_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function browserRelayerUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_FRONTIER_RELAYER_URL;
}

function supportsPasskeysInBrowser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return PasskeyManager.isSupported();
}

function profileFromCredential(
  credential: PasskeyCredential,
  options: {
    username: string;
    displayName: string;
    passkeyLabel: string;
    vaultAddress: string;
  },
): StoredPasskeyProfile {
  const now = new Date().toISOString();

  return {
    credentialId: credential.credentialId,
    keyHash: credential.keyHash,
    username: options.username,
    displayName: options.displayName,
    passkeyLabel: options.passkeyLabel,
    vaultAddress: options.vaultAddress,
    createdAt: now,
    lastAuthenticatedAt: now,
  };
}

function serializeCredentialForApi(
  credential: PasskeyCredential,
): SerializedPasskeyCredential {
  return {
    credentialId: credential.credentialId,
    keyHash: credential.keyHash,
    publicKeyX: credential.publicKeyX.toString(),
    publicKeyY: credential.publicKeyY.toString(),
  };
}

export function FrontierAuthProvider({ children }: { children: ReactNode }) {
  const sdk = useMemo(
    () =>
      createSDK("base", {
        network: browserNetwork(),
        relayerUrl: browserRelayerUrl(),
      }),
    [],
  );
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [session, setSession] = useState<FrontierSession | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] = useState(false);
  const [storedProfiles, setStoredProfiles] = useState<StoredPasskeyProfile[]>([]);
  const sessionRef = useRef<FrontierSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshSession = useCallback(
    async (options?: { silent?: boolean }): Promise<FrontierSession | null> => {
      const fallbackSession = sessionRef.current ?? loadStoredSession();

      try {
        const response = await fetch("/api/frontier/auth/session", {
          cache: "no-store",
        });
        const json = (await response.json()) as AuthSessionApiResponse;

        if (!response.ok) {
          throw new Error(json.error ?? "Unable to refresh the operator session.");
        }

        const nextSession =
          json.authenticated && json.session
            ? {
                ...json.session,
                credentialCount: sdk.passkey.getAllStoredCredentials().length,
              }
            : options?.silent && fallbackSession
              ? fallbackSession
              : null;

        saveStoredSession(nextSession);
        setSession(nextSession);
        setError(undefined);
        return nextSession;
      } catch (sessionError) {
        if (options?.silent && fallbackSession) {
          setSession(fallbackSession);
          return fallbackSession;
        }

        if (!options?.silent) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Unable to refresh the operator session.",
          );
        }
        throw sessionError;
      }
    },
    [sdk],
  );

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      const passkeySupported = supportsPasskeysInBrowser();
      const available = await PasskeyManager.isPlatformAuthenticatorAvailable().catch(() => false);
      const localSession = loadStoredSession();
      const storedCredentials = sdk.passkey.getAllStoredCredentials();
      const profiles = parseProfiles();

      if (storedCredentials.length > 0) {
        sdk.passkey.loadFromLocalStorage();
      }

      if (mounted) {
        setIsSupported(passkeySupported);
        setPlatformAuthenticatorAvailable(available);
        setSession(localSession);
        setStoredProfiles(
          storedCredentials.map((credential) => {
            const profile = profiles[credential.credentialId];
            return (
              profile ?? {
                credentialId: credential.credentialId,
                keyHash: credential.keyHash,
                username: "Frontier Operator",
                displayName: "Frontier Operator",
                passkeyLabel: "Stored Veridex Passkey",
                vaultAddress: sdk.getVaultAddressForKeyHash(credential.keyHash),
                createdAt: new Date().toISOString(),
                lastAuthenticatedAt: new Date().toISOString(),
              }
            );
          }),
        );
        setReady(true);
        void refreshSession({ silent: true }).catch(() => undefined);
      }
    };

    void restore();

    return () => {
      mounted = false;
    };
  }, [refreshSession, sdk]);

  async function registerPasskey(options: Required<AuthMutationOptions>): Promise<FrontierSession> {
    setBusy(true);
    setError(undefined);

    try {
      const credential = await sdk.passkey.register(options.username, options.displayName);
      sdk.passkey.addCredentialToStorage(credential);
      void sdk.passkey.saveCredentialToRelayer().catch(() => false);

      const vaultAddress = sdk.getVaultAddress();
      const response = await postJson<AuthApiResponse>("/api/frontier/auth/passkey/register", {
        credential: serializeCredentialForApi(credential),
        username: options.username,
        displayName: options.displayName,
        passkeyLabel: options.passkeyLabel || inferPasskeyLabel(),
        operatorName: options.displayName,
        userAgent: navigator.userAgent,
      });

      const profiles = parseProfiles();
      const nextProfile = profileFromCredential(credential, {
        username: response.credential.username,
        displayName: response.credential.displayName,
        passkeyLabel: options.passkeyLabel || inferPasskeyLabel(),
        vaultAddress,
      });
      profiles[credential.credentialId] = nextProfile;
      saveProfiles(profiles);

      const nextSession: FrontierSession = {
        ...response.session,
        credentialCount: sdk.passkey.getAllStoredCredentials().length,
      };
      saveStoredSession(nextSession);
      setSession(nextSession);
      setStoredProfiles(Object.values(profiles));
      return nextSession;
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to register a new passkey.";
      setError(message);
      throw authError;
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPasskey(): Promise<FrontierSession> {
    setBusy(true);
    setError(undefined);

    try {
      const result = await sdk.passkey.authenticate();
      sdk.passkey.addCredentialToStorage(result.credential);
      const profiles = parseProfiles();
      const localProfile = profiles[result.credential.credentialId];
      const response = await postJson<AuthApiResponse>("/api/frontier/auth/passkey/login", {
        credential: serializeCredentialForApi(result.credential),
        username: localProfile?.username,
        displayName: localProfile?.displayName,
        passkeyLabel: localProfile?.passkeyLabel ?? inferPasskeyLabel(),
        operatorName: localProfile?.displayName,
        userAgent: navigator.userAgent,
      });

      const nextProfile = profileFromCredential(result.credential, {
        username: response.credential.username,
        displayName: response.credential.displayName,
        passkeyLabel: localProfile?.passkeyLabel ?? inferPasskeyLabel(),
        vaultAddress: response.credential.vaultAddress,
      });
      profiles[result.credential.credentialId] = {
        ...localProfile,
        ...nextProfile,
      };
      saveProfiles(profiles);

      const nextSession: FrontierSession = {
        ...response.session,
        credentialCount: sdk.passkey.getAllStoredCredentials().length,
      };
      saveStoredSession(nextSession);
      setSession(nextSession);
      setStoredProfiles(Object.values(profiles));
      return nextSession;
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to authenticate with passkey.";
      setError(message);
      throw authError;
    } finally {
      setBusy(false);
    }
  }

  function signOut(): void {
    void fetch("/api/frontier/auth/logout", {
      method: "POST",
    }).catch(() => undefined);
    setError(undefined);
    setSession(null);
    saveStoredSession(null);
  }

  function clearError(): void {
    setError(undefined);
  }

  return (
    <FrontierAuthContext.Provider
      value={{
        ready,
        busy,
        isSupported,
        platformAuthenticatorAvailable,
        session,
        error,
        storedProfiles,
        registerPasskey,
        signInWithPasskey,
        refreshSession,
        signOut,
        clearError,
      }}
    >
      {children}
    </FrontierAuthContext.Provider>
  );
}

export function useFrontierAuth(): FrontierAuthContextValue {
  const context = useContext(FrontierAuthContext);

  if (!context) {
    throw new Error("useFrontierAuth must be used within a FrontierAuthProvider.");
  }

  return context;
}
