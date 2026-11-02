import { agentToClientStream, parseClientStreamRequest } from "@anvia/client";
import type { Message } from "@anvia/core";
import { db } from "@finance/db";
import { runAgent } from "@finance/agents";
import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import { createClientStreamResponse } from "@anvia/server";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

// Conversation memory lives in Postgres (see packages/db).
// validate() checks the AgentMemory* tables exist, so a broken schema fails at startup.
const memoryStore = new PrismaMemoryStore({ client: db });
await memoryStore.validate();

// Single user for now. Replace with the real user id once auth exists.
const USER_ID = "default-user";

function scopeFor(sessionId: string) {
  return { sessionId, userId: USER_ID };
}

// First user text in a conversation, used as the sidebar title.
function firstUserText(
  messages: readonly { message: Message }[],
): string | undefined {
  const first = messages.find((m) => m.message.role === "user")?.message;
  if (!first) return undefined;
  if (typeof first.content === "string") return first.content;
  return first.content.find((part) => part.type === "text")?.text;
}

app.get("/", (c) => c.json({ name: "finance-api", status: "ok" }));

app.post("/chat", async (c) => {
  const sessionId = c.req.query("sessionId");
  if (!sessionId) return c.text("sessionId query parameter is required.", 400);

  const body = parseClientStreamRequest(await c.req.json());

  if (body.type !== "messages") {
    return c.text("This endpoint accepts messages only", 400);
  }

  const events = agentToClientStream({
    events: runAgent({
      messages: body.messages,
      memory: { store: memoryStore, session: scopeFor(sessionId) },
      abortSignal: c.req.raw.signal,
    }),
    mapError: () => ({
      message: "The model request invalid",
      code: "MODEL_REQUEST_FAILED",
      retryable: true,
    }),
  });
  return createClientStreamResponse({ events, format: "jsonl" });
});

// Sessions of the current user, newest first, for the sidebar.
app.get("/sessions", async (c) => {
  const inspector = memoryStore.inspector;
  if (!inspector) {
    throw new Error("Memory store does not support listing sessions.");
  }

  const conversations = await inspector.listConversations({
    limit: 50,
    userId: USER_ID,
  });

  const sessions = await Promise.all(
    conversations.map(async (summary) => {
      const conversation = await inspector.getConversation({
        ref: summary.ref,
      });
      return {
        id: summary.sessionId,
        updatedAt: summary.updatedAt,
        title:
          (conversation && firstUserText(conversation.messages)) ?? "New chat",
      };
    }),
  );

  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return c.json(sessions);
});

// Saved messages of one session, used to prefill the chat on page load.
app.get("/sessions/:id/messages", async (c) => {
  return c.json(await memoryStore.load({ scope: scopeFor(c.req.param("id")) }));
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
