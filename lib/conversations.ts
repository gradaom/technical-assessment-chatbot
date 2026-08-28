import type { Message } from "./types";
import { loadHistory } from "./storage";
import { createId } from "./validation";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const CONVERSATIONS_KEY = "ai-chatbot:conversations:v2";
export const ACTIVE_KEY = "ai-chatbot:active-conversation:v2";

export const NEW_CHAT_TITLE = "New chat";

/** Derives a sidebar title from the first thing the user said. */
export function titleFrom(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return NEW_CHAT_TITLE;
  return flat.length > 42 ? `${flat.slice(0, 42).trimEnd()}…` : flat;
}

export function createConversation(): Conversation {
  const now = Date.now();
  return { id: createId(), title: NEW_CHAT_TITLE, messages: [], createdAt: now, updatedAt: now };
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const c = value as Conversation;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    Array.isArray(c.messages) &&
    typeof c.createdAt === "number" &&
    typeof c.updatedAt === "number"
  );
}

/**
 * Reads the conversation list, tolerating absent/corrupt data. On the very
 * first run it folds any single-thread v1 history into one conversation so an
 * existing user does not lose their chat to the upgrade.
 */
export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONVERSATIONS_KEY);
  } catch {
    return [];
  }

  if (raw === null) {
    const legacy = loadHistory();
    if (legacy.length === 0) return [];

    const firstPrompt = legacy.find((m) => m.role === "user")?.content ?? "";
    const migrated: Conversation = {
      id: createId(),
      title: titleFrom(firstPrompt),
      messages: legacy,
      createdAt: legacy[0]?.createdAt ?? Date.now(),
      updatedAt: legacy.at(-1)?.createdAt ?? Date.now(),
    };
    saveConversations([migrated]);
    return [migrated];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isConversation).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    // Storage being full or unavailable must never break the chat itself.
  }
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_KEY);
    else window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}

export interface ConversationGroup {
  label: string;
  items: Conversation[];
}

const DAY = 86_400_000;

/** Buckets conversations the way ChatGPT's sidebar does: by recency. */
export function groupByRecency(
  conversations: Conversation[],
  now: number = Date.now(),
): ConversationGroup[] {
  const buckets: ConversationGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];

  const startOfToday = new Date(now).setHours(0, 0, 0, 0);

  for (const conversation of [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const age = startOfToday - conversation.updatedAt;
    if (conversation.updatedAt >= startOfToday) buckets[0].items.push(conversation);
    else if (age < DAY) buckets[1].items.push(conversation);
    else if (age < 7 * DAY) buckets[2].items.push(conversation);
    else if (age < 30 * DAY) buckets[3].items.push(conversation);
    else buckets[4].items.push(conversation);
  }

  return buckets.filter((bucket) => bucket.items.length > 0);
}
