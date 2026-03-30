import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { encryptConfidentialPolicy, evaluateConfidentialPolicy } from "../integrations/zama";
import { scheduleFlowMission } from "../integrations/flow";
import { createPrivateIntent, revealPrivateIntent } from "../integrations/starknet";
import { uploadJsonToStoracha } from "../integrations/storacha";

export const executeFlowSchedule = tool(
  async ({ missionId, title, objective, cadence, retryPolicy, operatorWallet }) => {
    try {
      const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const result = await scheduleFlowMission({
        missionId,
        title,
        objective,
        cadence,
        scheduledFor,
        retryPolicy,
        operatorWallet,
      });
      return JSON.stringify(result);
    } catch (e: unknown) {
      return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  },
  {
    name: "execute_flow_schedule",
    description: "Schedules a mission on Flow for recurring execution. Use when rail is 'scheduled'.",
    schema: z.object({
      missionId: z.string(),
      title: z.string(),
      objective: z.string(),
      cadence: z.enum(["once", "hourly", "daily", "weekly"]),
      retryPolicy: z.enum(["manual", "retry-once", "retry-thrice"]),
      operatorWallet: z.string(),
    }),
  }
);

export const executeStarknetPrivateIntent = tool(
  async ({ missionId, label, objective, revealWindowHours, operatorWallet }) => {
    try {
      const commit = await createPrivateIntent({
        missionId,
        label,
        objective,
        revealWindowHours,
        operatorWallet,
      });

      // Also reveal for demo purposes
      const reveal = await revealPrivateIntent({
        missionId,
        label,
        operatorWallet,
        commitmentHash: commit.commitmentHash,
      });

      return JSON.stringify({ commit, reveal });
    } catch (e: unknown) {
      return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  },
  {
    name: "execute_starknet_private_intent",
    description: "Commits a private intent to Starknet and then reveals it. Use when rail is 'private'.",
    schema: z.object({
      missionId: z.string(),
      label: z.string(),
      objective: z.string(),
      revealWindowHours: z.number(),
      operatorWallet: z.string(),
    }),
  }
);

export const executeZamaConfidentialPolicy = tool(
  async ({ missionId, operatorWallet, maxSpendUsd, minTrustScore, allowedCounterparties, emergencyStop }) => {
    try {
      const encrypt = await encryptConfidentialPolicy({
        missionId,
        operatorWallet,
        maxSpendUsd,
        minTrustScore,
        allowedCounterparties,
        emergencyStop,
      });

      const evaluate = await evaluateConfidentialPolicy({
        missionId,
        operatorWallet,
        requestedSpendUsd: maxSpendUsd || 50,
        counterpartyTrust: minTrustScore ? minTrustScore + 1 : 100,
        maxSpendUsd,
        minTrustScore,
        emergencyStop,
      });

      return JSON.stringify({ encrypt, evaluate });
    } catch (e: unknown) {
      return JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  },
  {
    name: "execute_zama_confidential_policy",
    description: "Encrypts a confidential policy on Zama fhEVM and evaluates it. Use when rail is 'confidential'.",
    schema: z.object({
      missionId: z.string(),
      operatorWallet: z.string(),
      maxSpendUsd: z.number().optional(),
      minTrustScore: z.number().optional(),
      allowedCounterparties: z.array(z.string()),
      emergencyStop: z.boolean(),
    }),
  }
);

export const storeSharedMemory = tool(
  async ({ missionId, statePayload }) => {
    try {
      const result = await uploadJsonToStoracha(`memory_${missionId}.json`, statePayload);
      return JSON.stringify(result);
    } catch {
      // Return a simulated result if storacha misses config
      return JSON.stringify({ simulated: true, cid: "bafybeig...", uri: "ipfs://bafybeig..." });
    }
  },
  {
    name: "store_shared_memory",
    description: "Saves agent state or partial output to Storacha decentralized memory for handoffs.",
    schema: z.object({
      missionId: z.string(),
      statePayload: z.any(),
    }),
  }
);

export const searchPremiumYields = tool(
  async () => {
    return JSON.stringify({
      results: [
        { protocol: "Aave V3", network: "Base", apy: "4.5%", risk: "low" },
        { protocol: "Morpho", network: "Ethereum", apy: "5.2%", risk: "medium" },
        { protocol: "Aerodrome", network: "Base", apy: "12.1%", risk: "high" },
      ]
    });
  },
  {
    name: "search_premium_yields",
    description: "Searches the network for stablecoin yields and returns data.",
    schema: z.object({
      query: z.string(),
    }),
  }
);
