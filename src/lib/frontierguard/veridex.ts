import { createSDK, type PasskeyCredential } from "@veridex/sdk";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";

export function createServerFrontierSdk() {
  const config = getFrontierConfig();

  return createSDK(config.veridex.chain, {
    network: config.veridex.network,
    relayerUrl: config.veridex.relayerUrl,
    relayerApiKey: config.veridex.relayerApiKey || undefined,
  });
}

export function deriveVaultAddressForCredential(
  credential: Pick<PasskeyCredential, "keyHash">,
): string {
  const sdk = createServerFrontierSdk();
  return sdk.getVaultAddressForKeyHash(credential.keyHash);
}
