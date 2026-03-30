"use client";

import { useEffect, useMemo, useState } from "react";

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
}

export function useFrontierStatus() {
  const [status, setStatus] = useState<FrontierStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/frontier/status", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load control-plane status.");
        }

        const json = (await response.json()) as FrontierStatusSnapshot;
        if (!cancelled) {
          setStatus(json);
          setError(undefined);
        }
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : "Unable to load control-plane status.",
          );
          setStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return { status, loading, error, readiness };
}
