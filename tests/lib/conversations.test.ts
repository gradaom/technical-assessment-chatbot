import { beforeEach, describe, expect, it } from "vitest";
import {
  CONVERSATIONS_KEY,
  createConversation,
  groupByRecency,
  loadActiveId,
  loadConversations,
  saveActiveId,
  saveConversations,
  titleFrom,
  type Conversation,
} from "@/lib/conversations";
import { STORAGE_KEY } from "@/lib/storage";
import type { Message } from "@/lib/types";

const DAY = 86_400_000;

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return { ...createConversation(), ...overrides };
}

describe("conversations", () => {
  beforeEach(() => window.localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(loadConversations()).toEqual([]);
  });

  it("round-trips conversations through localStorage, newest first", () => {
    const older = conversation({ title: "Older", updatedAt: 1000 });
    const newer = conversation({ title: "Newer", updatedAt: 2000 });
    saveConversations([older, newer]);

    expect(loadConversations().map((c) => c.title)).toEqual(["Newer", "Older"]);
  });

  it("ignores malformed JSON and non-conversation entries", () => {
    window.localStorage.setItem(CONVERSATIONS_KEY, "{not json");
    expect(loadConversations()).toEqual([]);

    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([{ id: "x" }]));
    expect(loadConversations()).toEqual([]);
  });

  it("migrates a v1 single-thread history into one conversation", () => {
    const legacy: Message[] = [
      { id: "1", role: "user", content: "How do I center a div?", createdAt: 1000 },
      { id: "2", role: "assistant", content: "Use flexbox.", createdAt: 2000 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const migrated = loadConversations();
    expect(migrated).toHaveLength(1);
    expect(migrated[0].messages).toEqual(legacy);
    expect(migrated[0].title).toBe("How do I center a div?");

    // The migration is persisted, so it does not run a second time.
    window.localStorage.removeItem(STORAGE_KEY);
    expect(loadConversations()[0].messages).toEqual(legacy);
  });

  it("does not migrate once a v2 list exists", () => {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify([]));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "1", role: "user", content: "old", createdAt: 1 }]),
    );

    expect(loadConversations()).toEqual([]);
  });

  it("round-trips and clears the active id", () => {
    saveActiveId("abc");
    expect(loadActiveId()).toBe("abc");
    saveActiveId(null);
    expect(loadActiveId()).toBeNull();
  });

  describe("titleFrom", () => {
    it("collapses whitespace", () => {
      expect(titleFrom("  hello   there  ")).toBe("hello there");
    });

    it("truncates long prompts with an ellipsis", () => {
      const title = titleFrom("x".repeat(80));
      expect(title).toHaveLength(43);
      expect(title.endsWith("…")).toBe(true);
    });

    it("falls back to the default title when empty", () => {
      expect(titleFrom("   ")).toBe("New chat");
    });
  });

  describe("groupByRecency", () => {
    it("buckets by recency and drops empty buckets", () => {
      const now = new Date("2026-08-28T12:00:00Z").getTime();
      const startOfToday = new Date(now).setHours(0, 0, 0, 0);

      const groups = groupByRecency(
        [
          conversation({ title: "today", updatedAt: now }),
          conversation({ title: "yesterday", updatedAt: startOfToday - DAY / 2 }),
          conversation({ title: "last week", updatedAt: startOfToday - 3 * DAY }),
          conversation({ title: "ancient", updatedAt: startOfToday - 100 * DAY }),
        ],
        now,
      );

      expect(groups.map((g) => g.label)).toEqual([
        "Today",
        "Yesterday",
        "Previous 7 days",
        "Older",
      ]);
      expect(groups[0].items[0].title).toBe("today");
    });

    it("returns nothing for an empty list", () => {
      expect(groupByRecency([])).toEqual([]);
    });
  });
});
