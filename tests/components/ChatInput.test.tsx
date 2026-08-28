import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChatInput from "@/components/ChatInput";

function setup(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onStop: vi.fn(),
    isLoading: false,
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe("ChatInput", () => {
  it("disables Send while the input is empty", () => {
    setup({ value: "   " });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("enables Send once there is text", () => {
    setup({ value: "hello" });
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("submits on Enter", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup({ value: "hello" });

    await user.type(screen.getByLabelText("Message"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not submit on Shift+Enter", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup({ value: "hello" });

    await user.type(screen.getByLabelText("Message"), "{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("swaps Send for Stop while loading", async () => {
    const user = userEvent.setup();
    const { onStop } = setup({ value: "hello", isLoading: true });

    const stop = screen.getByRole("button", { name: "Stop" });
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();

    await user.click(stop);
    expect(onStop).toHaveBeenCalledOnce();
  });
});
