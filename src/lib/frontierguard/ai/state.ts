import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  missionId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "agent-demo-001",
  }),
  budgetUsd: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 50,
  }),
  spentUsd: Annotation<number>({
    reducer: (x, y) => x + (y || 0),
    default: () => 0,
  }),
  rail: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "immediate",
  }),
  tasksCompleted: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  findings: Annotation<unknown[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  logs: Annotation<unknown[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});
