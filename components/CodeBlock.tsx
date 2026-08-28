"use client";

import { useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

interface Props {
  /** Raw source, used for copying. */
  code: string;
  language?: string;
  /** Syntax-highlighted nodes produced by rehype-highlight. */
  children?: ReactNode;
}

export default function CodeBlock({ code, language, children }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine here.
    }
  };

  return (
    <figure
      data-testid="code-block"
      className="my-4 overflow-hidden rounded-2xl border border-black/10 bg-code text-[#e6edf3] dark:border-white/10"
    >
      <figcaption className="flex items-center justify-between bg-code-header px-4 py-2">
        <span className="font-mono text-xs tracking-wide text-[#8b949e] lowercase">
          {language ?? "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#8b949e] transition-colors hover:bg-white/10 hover:text-[#e6edf3]"
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>

      <pre className="overflow-x-auto px-4 py-3.5">
        <code className="font-mono text-[0.8125rem] leading-[1.65] whitespace-pre">
          {children ?? code}
        </code>
      </pre>
    </figure>
  );
}
