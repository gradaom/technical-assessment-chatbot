"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "./types";
import {
  createConversation,
  loadActiveId,
  loadConversations,
  NEW_CHAT_TITLE,
  saveActiveId,
  saveConversations,
  titleFrom,
  type Conversation,
} from "./conversations";
import type { ChatStore } from "./useChat";

function sameMessages(a: Message[], b: Message[]): boolean {
  return (
    a.length === b.length &&
    a.every((m, i) => m.id === b[i].id && m.content === b[i].content && m.error === b[i].error)
  );
}

export interface UseConversations {
  conversations: Conversation[];
  activeId: string | null;
  active: Conversation | null;
  ready: boolean;
  /** Message store for the active thread, handed to `useChat`. */
  store: ChatStore;
  newChat: () => void;
  select: (id: string) => void;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  removeAll: () => void;
}

/** Owns the sidebar's list of threads and which one is on screen. */
export function useConversations(): UseConversations {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  // localStorage only exists after mount.
  useEffect(() => {
    const stored = loadConversations();
    const savedActive = loadActiveId();

    if (stored.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    } else {
      setConversations(stored);
      setActiveId(stored.some((c) => c.id === savedActive) ? savedActive : stored[0].id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveConversations(conversations);
  }, [conversations, ready]);

  useEffect(() => {
    if (ready) saveActiveId(activeId);
  }, [activeId, ready]);

  const writeMessages = useCallback((id: string, messages: Message[]) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return prev;

      const current = prev[index];
      if (sameMessages(current.messages, messages)) return prev;

      const firstPrompt = messages.find((m) => m.role === "user")?.content;
      const next: Conversation = {
        ...current,
        messages,
        // Name the thread from its opening prompt, unless the user renamed it.
        title:
          current.title === NEW_CHAT_TITLE && firstPrompt ? titleFrom(firstPrompt) : current.title,
        updatedAt: Date.now(),
      };

      const rest = prev.filter((c) => c.id !== id);
      return [next, ...rest];
    });
  }, []);

  const store = useMemo<ChatStore>(() => {
    const id = activeId;
    return {
      load: () => {
        if (!id) return [];
        return loadConversations().find((c) => c.id === id)?.messages ?? [];
      },
      save: (messages) => {
        if (id) writeMessages(id, messages);
      },
      clear: () => {
        if (id) writeMessages(id, []);
      },
    };
  }, [activeId, writeMessages]);

  const newChat = useCallback(() => {
    setConversations((prev) => {
      // Reuse an untouched thread rather than piling up empty rows.
      const blank = prev.find((c) => c.messages.length === 0);
      if (blank) {
        setActiveId(blank.id);
        return prev;
      }
      const fresh = createConversation();
      setActiveId(fresh.id);
      return [fresh, ...prev];
    });
  }, []);

  const select = useCallback((id: string) => setActiveId(id), []);

  const rename = useCallback((id: string, title: string) => {
    const clean = title.replace(/\s+/g, " ").trim();
    if (!clean) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: clean.slice(0, 80) } : c)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = createConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeIdRef.current === id) setActiveId(next[0].id);
      return next;
    });
  }, []);

  const removeAll = useCallback(() => {
    const fresh = createConversation();
    setConversations([fresh]);
    setActiveId(fresh.id);
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return { conversations, activeId, active, ready, store, newChat, select, rename, remove, removeAll };
}
