import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadHistory } from "@/lib/storage";
import { useChat } from "@/lib/useChat";

/** Builds a fake NDJSON streaming Response like the one /api/chat returns. */
function streamingResponse(lines: string[], { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${line}\n`));
      controller.close();
    },
  });
  return { ok, status, body, json: async () => ({}) } as unknown as Response;
}

const delta = (text: string) => JSON.stringify({ type: "delta", text });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useChat", () => {
  it("appends the user prompt and streams the assistant reply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([delta("Hello"), delta(", world"), JSON.stringify({ type: "done" })]),
      ),
    );

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: "user", content: "Hi" });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Hello, world",
    });
    expect(result.current.error).toBeNull();
  });

  it("rejects an empty prompt without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.sendMessage("    ");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toMatch(/Enter a message/);
  });

  it("surfaces a mid-stream error event on the assistant turn", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          streamingResponse([JSON.stringify({ type: "error", error: "Rate limit reached." })]),
        ),
    );

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    await waitFor(() => expect(result.current.error).toBe("Rate limit reached."));
    expect(result.current.messages.at(-1)).toMatchObject({ role: "assistant", error: true });
  });

  it("reports a non-OK response using the server's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        body: null,
        json: async () => ({ error: "Server is missing ANTHROPIC_API_KEY." }),
      } as unknown as Response),
    );

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Server is missing ANTHROPIC_API_KEY."),
    );
  });

  it("persists history to localStorage and clears it on clearChat", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(streamingResponse([delta("Reply"), JSON.stringify({ type: "done" })])),
    );

    const { result } = renderHook(() => useChat());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.sendMessage("Remember this");
    });
    await waitFor(() => expect(loadHistory()).toHaveLength(2));

    act(() => result.current.clearChat());

    expect(result.current.messages).toEqual([]);
    expect(loadHistory()).toEqual([]);
  });

  it("restores a previous session from localStorage on mount", async () => {
    window.localStorage.setItem(
      "ai-chatbot:history:v1",
      JSON.stringify([{ id: "1", role: "user", content: "earlier", createdAt: 1 }]),
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].content).toBe("earlier");
  });
});
