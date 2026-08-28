import type { Message } from "./types";

export const MAX_PROMPT_LENGTH = 4000;

export type PromptValidation =
  | { ok: true; value: string }
  | { ok: false; reason: string };

/**
 * Validates a prompt before it ever reaches the network: empty and
 * whitespace-only prompts are rejected client-side and server-side.
 */
export function validatePrompt(raw: string): PromptValidation {
  const value = raw.trim();

  if (value.length === 0) {
    return { ok: false, reason: "Enter a message before sending." };
  }
  if (value.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      reason: `Message is too long (${value.length}/${MAX_PROMPT_LENGTH} characters).`,
    };
  }
  return { ok: true, value };
}

/** Narrow unknown JSON (from localStorage or a request body) to Message[]. */
export function isMessageArray(value: unknown): value is Message[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        !!m &&
        typeof m === "object" &&
        (m as Message).role !== undefined &&
        ["user", "assistant"].includes((m as Message).role) &&
        typeof (m as Message).content === "string",
    )
  );
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
