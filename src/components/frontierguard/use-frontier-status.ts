"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface FrontierStatusSnapshot {
  mode: string;
  integrations: {
    veridexSdk: boolean;
    agentSdk: boolean;
    passkeyCredentialLoaded: boolean;
    erc8004WriteEnabled: boolean;
    x402Ready: boolean;
    starknetReady: boolean;
    storachaWriteEnabled: boolean;
    filecoinProvider?: string | null;
    relayerConfigured: boolean;
    databaseConfigured: boolean;
  };
  sponsorPath: {
    liveMode: boolean;
    enterpriseAgentWalletReady: boolean;
    x402Ready: boolean;
    erc8004Ready: boolean;
    starknetReady: boolean;
    coreProofReady: boolean;
    liveProofReady: boolean;
    fullyReady: boolean;
    missing: string[];
  };
  proofs: {
    runtimeWalletBound: boolean;
    corePathReady: boolean;
    livePathReady: boolean;
    x402SettlementReady: boolean;
    erc8004ReceiptsReady: boolean;
    starknetSecondaryReady: boolean;
  };
  runtime: {
    available: boolean;
    session?: {
      operatorWallet?: string | null;
      credentialId?: string | null;
    } | null;
    identity?: {
      erc8004Identity?: string | null;
    } | null;
  };
  runtimeHealth: {
    available: boolean;
    signerSource: "session_wallet" | "erc8004_private_key" | "unavailable";
    walletAddress?: string | null;
    paywallNetwork: string;
    paywallAsset: string;
    paywallAmountUsd: number;
    nativeBalanceWei?: string;
    nativeBalanceFormatted?: string;
    assetBalanceRaw?: string;
    assetBalanceFormatted?: string;
    assetSymbol?: string;
    x402Ready: boolean;
    erc8004Ready: boolean;
    livePaymentReady: boolean;
    liveWriteReady: boolean;
    warnings: string[];
  };
}

export function useFrontierStatus(options?: { auto?: boolean }) {
  const [status, setStatus] = useState<FrontierStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const response = await fetch("/api/frontier/status", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load control-plane status.");
      }

      const json = (await response.json()) as FrontierStatusSnapshot;
      if (mountedRef.current) {
        setStatus(json);
        setError(undefined);
      }
      return json;
    } catch (statusError) {
      if (mountedRef.current) {
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Unable to load control-plane status.",
        );
        setStatus(null);
      }
      throw statusError;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (options?.auto === false) {
      setLoading(false);
      return;
    }

    void refresh().catch(() => undefined);

    const interval = setInterval(() => {
      void refresh({ silent: true }).catch(() => undefined);
    }, 10_000);

    return () => clearInterval(interval);
  }, [options?.auto, refresh]);

  const readiness = useMemo(() => {
    if (!status) {
      return {
        corePathReady: false,
        runtimeWalletBound: false,
        x402Ready: false,
        erc8004Ready: false,
        secondaryRailsReady: false,
        liveProofReady: false,
      };
    }

    return {
      corePathReady:
        status.integrations.passkeyCredentialLoaded &&
        status.sponsorPath.coreProofReady,
      runtimeWalletBound: status.runtime.available,
      x402Ready: status.sponsorPath.x402Ready,
      erc8004Ready: status.sponsorPath.erc8004Ready,
      secondaryRailsReady:
        status.sponsorPath.starknetReady ||
        Boolean(status.integrations.filecoinProvider) ||
        status.integrations.storachaWriteEnabled,
      liveProofReady:
        status.integrations.passkeyCredentialLoaded &&
        status.sponsorPath.liveProofReady,
    };
  }, [status]);

  return { status, loading, error, readiness, refresh };
}
