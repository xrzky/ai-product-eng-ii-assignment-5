import { OpenAIClient } from "@anvia/openai";

export const DEFAULT_MODEL_ID = "cb/deepseek-v4.1-flash";

let client: OpenAIClient | undefined;

function getClient(): OpenAIClient {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("SET OPENAI_API_KEY.");
    client = new OpenAIClient({
      apiKey,
      baseUrl: process.env.OPENAI_BASE_URL,
    });
  }

  return client;
}

export function getModel(modelId: string = DEFAULT_MODEL_ID) {
  return getClient().completionModel({ modelId, api: "chat" });
}
