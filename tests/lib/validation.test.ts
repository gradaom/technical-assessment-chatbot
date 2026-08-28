import { describe, expect, it } from "vitest";
import { isMessageArray, MAX_PROMPT_LENGTH, validatePrompt } from "@/lib/validation";

describe("validatePrompt", () => {
  it("accepts a normal prompt and trims surrounding whitespace", () => {
    expect(validatePrompt("  hello world  ")).toEqual({ ok: true, value: "hello world" });
  });

  it("rejects an empty prompt", () => {
    const result = validatePrompt("");
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: expect.stringContaining("Enter a message") });
  });

  it("rejects a whitespace-only prompt", () => {
    expect(validatePrompt("   \n\t  ").ok).toBe(false);
  });

  it("rejects a prompt over the character limit", () => {
    const result = validatePrompt("a".repeat(MAX_PROMPT_LENGTH + 1));
    expect(result.ok).toBe(false);
  });

  it("accepts a prompt exactly at the character limit", () => {
    expect(validatePrompt("a".repeat(MAX_PROMPT_LENGTH)).ok).toBe(true);
  });
});

describe("isMessageArray", () => {
  it("accepts a well-formed message array", () => {
    expect(isMessageArray([{ id: "1", role: "user", content: "hi", createdAt: 0 }])).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(isMessageArray([])).toBe(true);
  });

  it.each([
    ["a non-array", { role: "user", content: "hi" }],
    ["an unknown role", [{ role: "system", content: "hi" }]],
    ["a non-string content", [{ role: "user", content: 42 }]],
    ["a null entry", [null]],
  ])("rejects %s", (_label, value) => {
    expect(isMessageArray(value)).toBe(false);
  });
});
