import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MessageBubble from "@/components/MessageBubble";
import type { Message } from "@/lib/types";

const base: Message = {
  id: "1",
  role: "assistant",
  content: "",
  createdAt: new Date("2026-01-01T10:30:00Z").getTime(),
};

describe("MessageBubble", () => {
  it("renders a user message as plain text", () => {
    render(<MessageBubble message={{ ...base, role: "user", content: "**not bold**" }} />);

    expect(screen.getByTestId("message-user")).toBeInTheDocument();
    expect(screen.getByText("**not bold**")).toBeInTheDocument();
  });

  it("renders assistant markdown as formatted HTML", () => {
    render(<MessageBubble message={{ ...base, content: "**bold** and `code`" }} />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("renders fenced code blocks with their language label", () => {
    render(<MessageBubble message={{ ...base, content: "```ts\nconst a = 1;\n```" }} />);

    expect(screen.getByText("ts")).toBeInTheDocument();
    // rehype-highlight splits the source across <span class="hljs-*"> nodes,
    // so assert on the block's text rather than a single text node.
    expect(screen.getByTestId("code-block")).toHaveTextContent("const a = 1;");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("syntax-highlights fenced code", () => {
    render(<MessageBubble message={{ ...base, content: "```ts\nconst a = 1;\n```" }} />);

    expect(screen.getByTestId("code-block").querySelector(".hljs-keyword")).toHaveTextContent(
      "const",
    );
  });

  it("styles a failed assistant turn as an error", () => {
    render(<MessageBubble message={{ ...base, content: "Request timed out.", error: true }} />);

    expect(screen.getByText("Request timed out.")).toBeInTheDocument();
    expect(screen.getByTestId("bubble")).toHaveAttribute("data-error", "true");
  });
});
