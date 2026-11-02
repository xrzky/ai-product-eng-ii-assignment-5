import {
  Agent,
  type UserMessage,
  type AgentStream,
  type MemoryScope,
  type MemoryStore,
  type Message,
} from "@anvia/core";
import { BASE_INSTRUCTIONS } from "./instructions";
import { getLens } from "./lens";
import { DEFAULT_MODEL_ID, getModel } from "./models";
import { staticContext } from "./context/document";
import { checkReimbursementLimitTool } from "./tools/check-reimbursement-limit";
import { searchWebTool } from "./tools/search-web";
import { readWebpageTool } from "./tools/read-webpage";

export type RunAgentOptions = {
  messages: readonly Message[];
  memory?: {
    store: MemoryStore;
    session: MemoryScope;
  };
  modelId?: string;
  maxTurns?: number;
  abortSignal?: AbortSignal;
};

export function runAgent(options: RunAgentOptions): AgentStream<string> {
  const agent = new Agent({
    id: "finance-reimbursement-assistant",
    model: getModel(options.modelId ?? DEFAULT_MODEL_ID),
    context: staticContext,
    tools: [checkReimbursementLimitTool, searchWebTool, readWebpageTool],
    instructions: BASE_INSTRUCTIONS,
    maxTurns: options.maxTurns ?? 25,
    memory: options.memory
      ? { store: options.memory.store, savePolicy: "turn" }
      : undefined,
    observability: {
      observers: { lens: getLens().observer({ captureMode: "full" }) },
      primaryTrace: "lens",
    },
  });

  if (options.memory) {
    const prompt = [...options.messages]
      .reverse()
      .find((m): m is UserMessage => m.role === "user");
    if (!prompt) throw new Error("runAgent needs at least one user message.");
    return agent.stream({
      prompt,
      session: options.memory.session,
      abortSignal: options.abortSignal,
    });
  }

  return agent.stream({
    messages: options.messages,
    abortSignal: options.abortSignal,
  });
}
