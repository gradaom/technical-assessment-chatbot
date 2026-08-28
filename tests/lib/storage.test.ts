import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearHistory, loadHistory, saveHistory, STORAGE_KEY } from "@/lib/storage";
import type { Message } from "@/lib/types";

const messages: Message[] = [
  { id: "1", role: "user", content: "Hello", createdAt: 1000 },
  { id: "2", role: "assistant", content: "Hi there", createdAt: 2000 },
];

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns an empty history when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("round-trips messages through localStorage", () => {
    saveHistory(messages);
    expect(loadHistory()).toEqual(messages);
  });

  it("ignores malformed JSON instead of throwing", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadHistory()).toEqual([]);
  });

  it("ignores stored data that is not a message array", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ role: "root", content: "x" }]));
    expect(loadHistory()).toEqual([]);
  });

  it("clearHistory removes the stored key", () => {
    saveHistory(messages);
    clearHistory();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("swallows quota errors on write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveHistory(messages)).not.toThrow();
  });
});
