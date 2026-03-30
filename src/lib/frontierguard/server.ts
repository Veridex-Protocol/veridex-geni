import { createHash } from "crypto";

export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function fakeTxHash(payload: unknown): string {
  return `0x${hashPayload(payload).slice(0, 64)}`;
}

export function fakeCid(payload: unknown): string {
  return `bafy${hashPayload(payload).slice(0, 40)}`;
}

export function fakeExplorerUrl(path: "tx" | "address", value: string): string {
  return `https://basescan.org/${path}/${value}`;
}
