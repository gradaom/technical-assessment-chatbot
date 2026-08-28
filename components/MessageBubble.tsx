"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import Markdown from "./Markdown";
import { AlertIcon, CheckIcon, CopyIcon, RegenerateIcon } from "./Icons";

interface Props {
  message: Message;
  /** True for the assistant message currently being streamed. */
  streaming?: boolean;
  /** Offered on the newest assistant turn only. */
  onRegenerate?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; nothing useful to say about it.
    }
  };

  return (
    <ActionButton label={copied ? "Copied" : "Copy message"} onClick={copy}>
      {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
    </ActionButton>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-hover hover:text-primary"
    >
      {children}
    </button>
  );
}

export default function MessageBubble({ message, streaming = false, onRegenerate }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <article
        data-testid="message-user"
        aria-label="Your message"
        className="group/message animate-rise flex w-full flex-col items-end gap-1"
      >
        <div
          data-testid="bubble"
          className="max-w-[85%] rounded-3xl bg-surface px-5 py-2.5 text-[1rem] leading-[1.65] whitespace-pre-wrap"
        >
          {message.content}
        </div>
        <div className="opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
          <CopyButton text={message.content} />
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid="message-assistant"
      aria-label="Assistant message"
      className="group/message animate-rise flex w-full flex-col gap-1"
    >
      <div
        data-testid="bubble"
        data-error={message.error ? "true" : undefined}
        className={
          message.error
            ? "flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-[0.95rem] text-danger"
            : "w-full min-w-0"
        }
      >
        {message.error ? (
          <>
            <AlertIcon size={18} className="mt-px shrink-0" />
            <p>{message.content}</p>
          </>
        ) : (
          <div className={streaming ? "streaming-caret" : undefined}>
            <Markdown content={message.content} />
          </div>
        )}
      </div>

      {!streaming && !message.error && message.content.length > 0 && (
        <div className="-ml-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
          <CopyButton text={message.content} />
          {onRegenerate && (
            <ActionButton label="Regenerate response" onClick={onRegenerate}>
              <RegenerateIcon size={15} />
            </ActionButton>
          )}
        </div>
      )}
    </article>
  );
}
