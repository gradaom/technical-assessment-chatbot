import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { isMessageArray, MAX_PROMPT_LENGTH } from "@/lib/validation";

export const runtime = "nodejs";
/** Never cache an AI completion. */
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_TOKENS = 1024;
const UPSTREAM_TIMEOUT_MS = 60_000;
/** Only the tail of the conversation is sent upstream, to bound token cost. */
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT =
  "You are a helpful assistant embedded in a chat UI. " +
  "Answer concisely and use Markdown (including fenced code blocks with a language tag) where it aids readability.";

/**
 * Streaming protocol: newline-delimited JSON, one event per line.
 *   {"type":"delta","text":"..."}  incremental token(s)
 *   {"type":"error","error":"..."} failure (may arrive mid-stream)
 *   {"type":"done"}                clean end of turn
 */
type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "error"; error: string }
  | { type: "done" };

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function encodeEvent(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

/** Maps an upstream/network failure onto a message that is safe to show a user. */
function describeError(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401 || err.status === 403) {
      return { message: "The API key was rejected. Check ANTHROPIC_API_KEY.", status: 502 };
    }
    if (err.status === 429) {
      return { message: "Rate limit reached. Please wait a moment and try again.", status: 429 };
    }
    if (err.status && err.status >= 500) {
      return { message: "The AI service is temporarily unavailable. Try again shortly.", status: 502 };
    }
    return { message: err.message || "The AI service rejected the request.", status: 502 };
  }
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
    return { message: "The request timed out. Please try again.", status: 504 };
  }
  return { message: "Something went wrong while contacting the AI service.", status: 500 };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError(
      "Server is missing ANTHROPIC_API_KEY. Copy .env.example to .env.local and add your key.",
      500,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!isMessageArray(messages) || messages.length === 0) {
    return jsonError("`messages` must be a non-empty array of chat messages.", 400);
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user" || last.content.trim().length === 0) {
    return jsonError("The last message must be a non-empty user prompt.", 400);
  }
  if (last.content.length > MAX_PROMPT_LENGTH) {
    return jsonError(`Prompt exceeds the ${MAX_PROMPT_LENGTH} character limit.`, 413);
  }

  const client = new Anthropic({ apiKey, maxRetries: 2 });
  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  // Abort upstream work as soon as the browser disconnects.
  const signal = AbortSignal.any([timeout, request.signal]);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const completion = client.messages.stream(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM_PROMPT,
            messages: messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
          { signal },
        );

        for await (const event of completion) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta" &&
            event.delta.text
          ) {
            controller.enqueue(encodeEvent({ type: "delta", text: event.delta.text }));
          }
        }

        controller.enqueue(encodeEvent({ type: "done" }));
      } catch (err) {
        // Headers are already flushed, so surface the failure as a stream event.
        const { message } = describeError(err);
        controller.enqueue(encodeEvent({ type: "error", error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
