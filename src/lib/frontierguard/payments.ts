function encodeBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function toUsdcRaw(amountUsd: number): string {
  return String(Math.round(amountUsd * 1_000_000));
}

function toCaip2(network: string): string {
  const normalized = network.toLowerCase();

  switch (normalized) {
    case "base-sepolia":
      return "eip155:84532";
    case "base":
    case "base-mainnet":
      return "eip155:8453";
    case "ethereum-sepolia":
      return "eip155:11155111";
    case "ethereum":
    case "ethereum-mainnet":
      return "eip155:1";
    default:
      return normalized.includes(":") ? network : normalized;
  }
}

export interface DemoPaymentSignatureInput {
  challengeId: string;
  missionId: string;
  amountUsd: number;
  recipient: string;
  network: string;
}

export function buildDemoPaymentSignature(input: DemoPaymentSignatureInput): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    x402Version: 2,
    scheme: "exact",
    network: toCaip2(input.network),
    payload: {
      signature: `veridex-demo-signature:${input.challengeId}`,
      authorization: {
        from: "0x000000000000000000000000000000000000dEaD",
        to: input.recipient,
        value: toUsdcRaw(input.amountUsd),
        validAfter: now - 60,
        validBefore: now + 5 * 60,
        nonce: `${input.missionId}:${input.challengeId}`,
      },
    },
  };

  return encodeBase64(JSON.stringify(payload));
}
