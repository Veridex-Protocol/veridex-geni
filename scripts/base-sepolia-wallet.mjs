import { Wallet } from "ethers";

function printUsage() {
  console.log(`
Usage:
  bun run wallet:base-sepolia
    Generates a fresh burner wallet for Base Sepolia and prints env values.

  bun run wallet:base-sepolia -- --private-key 0x...
    Derives the wallet address from an existing private key.
`.trim());
}

const args = process.argv.slice(2);
const privateKeyIndex = args.indexOf("--private-key");

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (privateKeyIndex >= 0) {
  const privateKey = args[privateKeyIndex + 1];

  if (!privateKey) {
    console.error("Missing value after --private-key");
    printUsage();
    process.exit(1);
  }

  try {
    const wallet = new Wallet(privateKey);
    console.log("Derived Base Sepolia signer");
    console.log(`Address: ${wallet.address}`);
    console.log("");
    console.log("Suggested env values:");
    console.log(`FRONTIER_ERC8004_PRIVATE_KEY=${wallet.privateKey}`);
    console.log(`FRONTIER_PAYWALL_RECIPIENT=${wallet.address}`);
    process.exit(0);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Unable to derive wallet from private key.",
    );
    process.exit(1);
  }
}

const wallet = Wallet.createRandom();

console.log("Generated fresh Base Sepolia burner wallet");
console.log(`Address: ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log("");
console.log("Suggested env values:");
console.log(`FRONTIER_ERC8004_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`FRONTIER_PAYWALL_RECIPIENT=${wallet.address}`);
console.log("");
console.log("Next steps:");
console.log("1. Fund this address with Base Sepolia ETH.");
console.log("2. Use the same Base Sepolia RPC URL for FRONTIER_ERC8004_RPC_URL and FRONTIER_PAYWALL_RPC_URL.");
console.log("3. Set FRONTIER_FACILITATOR_URL=https://x402.org/facilitator for testnet.");
