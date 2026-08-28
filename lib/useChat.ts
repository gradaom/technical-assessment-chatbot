"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "./types";
import { clearHistory, loadHistory, saveHistory } from "./storage";
import { createId, validatePrompt } from "./validation";

/**
 * Where a chat reads and writes its messages. Defaults to the single-thread
 * localStorage history; the app passes a conversation-backed store instead so
 * every thread in the sidebar persists independently.
 */
export interface ChatStore {
  load: () => Message[];
  save: (messages: Message[]) => void;
  clear: () => void;
}

const defaultStore: ChatStore = {
  load: loadHistory,
  save: saveHistory,
  clear: clearHistory,
};

/** Give up if the server has not produced anything within this window. */
const RESPONSE_TIMEOUT_MS = 60_000;

interface StreamEvent {
  type: "delta" | "error" | "done";
  text?: string;
  error?: string;
}

export interface UseChat {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  /** True until the first token arrives, so the UI can show a skeleton. */
  isWaitingForFirstToken: boolean;
  error: string | null;
  sendMessage: (raw?: string) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  dismissError: () => void;
  retryLast: () => Promise<void>;
  hydrated: boolean;
}

export function useChat(store: ChatStore = defaultStore): UseChat {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForFirstToken, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  // Callers may rebuild the store on every render; read it through a ref so
  // effects never need it as a dependency.
  const storeRef = useRef(store);
  storeRef.current = store;
  // Kept in a ref so sendMessage never closes over stale history.
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Restore history after mount only — localStorage does not exist on the server.
  useEffect(() => {
    setMessages(storeRef.current.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) storeRef.current.save(messages);
  }, [messages, hydrated]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = useCallback(() => {
    abortRef.current?.abort("user-stopped");
    abortRef.current = null;
    setIsLoading(false);
    setWaiting(false);
  }, []);

  const run = useCallback(async (history: Message[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), RESPONSE_TIMEOUT_MS);

    const assistantId = createId();
    setIsLoading(true);
    setWaiting(true);
    setError(null);

    const fail = (message: string) => {
      setError(message);
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === assistantId);
        if (existing) {
          // Keep whatever streamed successfully, flagged as failed.
          return prev.map((m) =>
            m.id === assistantId
              ? { ...m, error: true, content: m.content || message }
              : m,
          );
        }
        return [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: message,
            createdAt: Date.now(),
            error: true,
          },
        ];
      });
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const detail = await response
          .json()
          .then((b: { error?: string }) => b.error)
          .catch(() => null);
        fail(detail ?? `Request failed with status ${response.status}.`);
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let started = false;

      const append = (text: string) => {
        if (!started) {
          started = true;
          setWaiting(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: text, createdAt: Date.now() },
          ]);
          return;
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)),
        );
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        // The final element may be a partial line; keep it for the next chunk.
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          if (event.type === "delta" && event.text) append(event.text);
          else if (event.type === "error") fail(event.error ?? "The AI service returned an error.");
        }
      }
    } catch (err) {
      if (controller.signal.aborted) {
        // A user-initiated stop is not an error; a timeout is.
        if (controller.signal.reason === "timeout") {
          fail("The request timed out. Please try again.");
        }
      } else {
        fail(
          err instanceof Error && err.message
            ? `Network error: ${err.message}`
            : "Network error. Check your connection and try again.",
        );
      }
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
      setIsLoading(false);
      setWaiting(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (raw?: string) => {
      if (isLoading) return;

      const result = validatePrompt(raw ?? input);
      if (!result.ok) {
        setError(result.reason);
        return;
      }

      const userMessage: Message = {
        id: createId(),
        role: "user",
        content: result.value,
        createdAt: Date.now(),
      };
      const next = [...messagesRef.current, userMessage];
      setMessages(next);
      setInput("");
      await run(next);
    },
    [input, isLoading, run],
  );

  const retryLast = useCallback(async () => {
    if (isLoading) return;

    // Drop trailing assistant turns, then resend from the last user prompt.
    const history = [...messagesRef.current];
    while (history.length && history[history.length - 1].role === "assistant") history.pop();
    if (!history.length) return;

    setMessages(history);
    await run(history);
  }, [isLoading, run]);

  const dismissError = useCallback(() => setError(null), []);

  const clearChat = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    storeRef.current.clear();
  }, [stop]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isWaitingForFirstToken,
    error,
    sendMessage,
    stop,
    clearChat,
    dismissError,
    retryLast,
    hydrated,
  };
}
