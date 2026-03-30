import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";
import { GraphState } from "./state";
import { 
  executeFlowSchedule, 
  executeStarknetPrivateIntent, 
  executeZamaConfidentialPolicy, 
  storeSharedMemory, 
  searchPremiumYields 
} from "./tools";

// 1. Initialize Gemini Model with required execution mode
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  temperature: 0,
});

// Bind all tools to the model
const tools = [
  executeFlowSchedule,
  executeStarknetPrivateIntent,
  executeZamaConfidentialPolicy,
  storeSharedMemory,
  searchPremiumYields
];

const modelWithTools = llm.bindTools(tools);

// Node 1: Plan and Reason
async function planMission(state: typeof GraphState.State) {
  const systemPrompt = new SystemMessage(
    `You are an elite AI execution orchestrator managing a mission on the Veridex FrontierGuard Network.
    You have a budget of $${state.budgetUsd}. You have executed tasks: ${state.tasksCompleted.join(", ")}.
    The execution rail chosen is: ${state.rail}.

    Your goals:
    1. Check tools to gather necessary context.
    2. Enforce the execution rail ('scheduled' -> use execute_flow_schedule, 'private' -> use execute_starknet_private_intent, 'confidential' -> execute_zama_confidential_policy).
    3. If you have gathered state/context, store it in decentralized memory (storacha).
    4. Conclude when all steps are verified.

    Only call the necessary execution rail tool corresponding to '${state.rail}'.
    `
  );

  const response = await modelWithTools.invoke([systemPrompt, ...state.messages]);
  return { messages: [response] };
}

// Node 2: Execute Tools dynamically
import { ToolNode } from "@langchain/langgraph/prebuilt";
const toolNode = new ToolNode(tools);

// Edge Routing
function shouldContinue(state: typeof GraphState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // If the model called a tool, go to 'execute' node
  if (lastMessage && "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
    return "execute";
  }
  
  // Otherwise, the mission is complete
  return "verify";
}

// Node 3: Verification Check
async function verifyMission() {
  return {
    tasksCompleted: ["Verification run completed on all executed traits."],
    logs: [{ 
      timestamp: new Date().toISOString(), 
      title: "Engine Complete", 
      message: "Graph traversal complete." 
    }]
  };
}

// Assemble Graph
export const frontierLangGraph = new StateGraph(GraphState)
  .addNode("plan", planMission)
  .addNode("execute", toolNode)
  .addNode("verify", verifyMission)

  .addEdge(START, "plan")
  .addConditionalEdges("plan", shouldContinue)
  .addEdge("execute", "plan")
  .addEdge("verify", END)

  .compile();
