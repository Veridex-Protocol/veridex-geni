import * as StorachaClient from "@storacha/client";
import * as Signer from "@storacha/client/principal/ed25519";
import { parse as parseProof } from "@storacha/client/proof";
import { StoreMemory } from "@storacha/client/stores/memory";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";

interface StorachaSession {
  client: Awaited<ReturnType<typeof StorachaClient.create>>;
  proof: Awaited<ReturnType<typeof parseProof>>;
  spaceDid: string;
}

let sessionPromise: Promise<StorachaSession> | null = null;

async function createSession(): Promise<StorachaSession> {
  const config = getFrontierConfig();

  if (!config.storacha.enabled || !config.storacha.agentKey || !config.storacha.proof) {
    throw new Error("Storacha is not configured. Set STORACHA_AGENT_KEY and STORACHA_PROOF.");
  }

  const principal = Signer.parse(config.storacha.agentKey);
  const client = await StorachaClient.create({
    principal,
    store: new StoreMemory(),
  });
  const proof = await parseProof(config.storacha.proof);
  const space = await client.addSpace(proof);
  const spaceDid = config.storacha.spaceDid ?? space.did();
  await client.setCurrentSpace(spaceDid as `did:${string}:${string}`);

  return {
    client,
    proof,
    spaceDid,
  };
}

async function getSession(): Promise<StorachaSession> {
  if (!sessionPromise) {
    sessionPromise = createSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}

function createUploadBlob(payload: string, filename: string): Blob {
  if (typeof File !== "undefined") {
    return new File([payload], filename, { type: "application/json" });
  }

  return new Blob([payload], { type: "application/json" });
}

export interface StorachaUploadResult {
  cid: string;
  uri: string;
  proofCid?: string;
  spaceDid: string;
}

export async function uploadJsonToStoracha(filename: string, payload: unknown): Promise<StorachaUploadResult> {
  const session = await getSession();
  const serialized =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const blob = createUploadBlob(serialized, filename);
  const cid = await session.client.uploadFile(blob);
  const proofCid =
    typeof (session.proof as { cid?: { toString(): string } }).cid?.toString === "function"
      ? (session.proof as { cid: { toString(): string } }).cid.toString()
      : undefined;

  return {
    cid: cid.toString(),
    uri: `ipfs://${cid}`,
    proofCid,
    spaceDid: session.spaceDid,
  };
}
