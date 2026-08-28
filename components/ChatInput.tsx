"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { MAX_PROMPT_LENGTH } from "@/lib/validation";
import { SendIcon, StopIcon } from "./Icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Focus the field on mount — used when the composer is the page's subject. */
  autoFocus?: boolean;
}

const MAX_HEIGHT = 208;

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled = false,
  placeholder = "Ask anything",
  autoFocus = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with its content, then scroll internally.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const length = value.trim().length;
  const isEmpty = length === 0;
  const overLimit = length > MAX_PROMPT_LENGTH;
  // Stay out of the way until the limit is actually in sight.
  const showCounter = length > MAX_PROMPT_LENGTH * 0.8;

  return (
    <form onSubmit={submit} className="w-full">
      <div className="rounded-[28px] border border-line bg-composer px-2 pt-1 shadow-composer transition-shadow focus-within:shadow-pop">
        <label htmlFor="prompt" className="sr-only">
          Message
        </label>
        <textarea
          id="prompt"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-describedby="prompt-hint"
          className="block max-h-[208px] w-full resize-none bg-transparent px-3 pt-3 pb-1 text-[1rem] leading-[1.6] placeholder:text-faint focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-2">
          <p
            id="prompt-hint"
            className={[
              "px-1 text-xs transition-opacity",
              overLimit ? "text-danger" : "text-faint",
              showCounter ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {length.toLocaleString()}/{MAX_PROMPT_LENGTH.toLocaleString()}
          </p>

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop"
              title="Stop generating"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover"
            >
              <StopIcon size={18} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isEmpty || overLimit || disabled}
              aria-label="Send message"
              title="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-canvas disabled:opacity-60"
            >
              <SendIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
