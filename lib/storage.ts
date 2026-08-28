import type { Message } from "./types";
import { isMessageArray } from "./validation";

export const STORAGE_KEY = "ai-chatbot:history:v1";

/** Reads chat history from localStorage, tolerating absent/corrupt data. */
export function loadHistory(): Message[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return isMessageArray(parsed) ? parsed : [];
  } catch {
    // Private mode, quota errors or malformed JSON: start from a clean slate.
    return [];
  }
}

export function saveHistory(messages: Message[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Storage being unavailable must never break the chat itself.
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
