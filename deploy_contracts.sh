#!/bin/bash
# Veridex FrontierGuard - Unified Contract Deployment Script
# Ensure you have foundry (forge), flow-cli, scarb, and starkli installed.

set -e

## Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Veridex FrontierGuard Multi-Rail Deployment ===${NC}\n"

# 1. Zama Confidential Rail (EVM / Foundry)
echo -e "${GREEN}--> Deploying Zama Confidential Policy Vault & Executor (fhEVM)...${NC}"
cd contracts/zama
if [ -z "$ZAMA_RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "Warning: ZAMA_RPC_URL or PRIVATE_KEY not set. Skipping Zama deployment."
    echo "To deploy: export ZAMA_RPC_URL=<rpc> PRIVATE_KEY=<key> && forge script script/Deploy.s.sol:Deploy --rpc-url \$ZAMA_RPC_URL --private-key \$PRIVATE_KEY --broadcast"
else
    forge install
    forge build
    forge script script/Deploy.s.sol:Deploy --rpc-url $ZAMA_RPC_URL --private-key $PRIVATE_KEY --broadcast
fi
cd ../..
echo

# 2. Flow Scheduled Rail (Cadence / Flow CLI)
echo -e "${GREEN}--> Deploying Flow Scheduled Mission Handlers...${NC}"
cd contracts/flow
# Note: Ensure you have a flow.json configured in this directory or the root.
if [ ! -f "flow.json" ]; then
    echo "Warning: No flow.json found in contracts/flow. Please initialize with 'flow init' and configure your accounts."
else
    # Deploy to testnet (modify to mainnet for production)
    flow project deploy --network testnet
    echo "Flow contracts deployed successfully."
fi
cd ../..
echo

# 3. Starknet Private Intent Rail (Cairo / Scarb & Starkli)
echo -e "${GREEN}--> Building and Declaring Starknet Private Intent Contract...${NC}"
cd contracts/starknet
if [ -z "$STARKNET_RPC" ] || [ -z "$STARKNET_ACCOUNT" ]; then
    echo "Warning: STARKNET_RPC or STARKNET_ACCOUNT not set. Skipping Starknet deployment."
    echo "To deploy: set STARKNET_RPC, STARKNET_ACCOUNT, and STARKNET_KEYSTORE to use starkli."
else
    # Build the Cairo contract
    scarb build
    
    # Declare the contract
    echo "Declaring contract class..."
    CLASS_HASH=$(starkli declare target/dev/frontier_private_intent.contract_class.json --rpc $STARKNET_RPC --account $STARKNET_ACCOUNT --watch)
    
    echo "Contract declared with Class Hash: $CLASS_HASH"
    
    # Deploy the contract
    echo "Deploying contract..."
    starkli deploy $CLASS_HASH --rpc $STARKNET_RPC --account $STARKNET_ACCOUNT
fi
cd ../..
echo

echo -e "${BLUE}=== Deployment Script Completed ===${NC}"
echo "Next Steps:"
echo "1. Copy the deployed contract addresses."
echo "2. Update your frontend environment variables (.env.local) with the new addresses:"
echo "   - FRONTIER_FLOW_SCHEDULER_CONTRACT_ADDRESS"
echo "   - FRONTIER_STARKNET_PRIVATE_INTENT_CONTRACT"
echo "   - FRONTIER_ZAMA_POLICY_VAULT_CONTRACT"
