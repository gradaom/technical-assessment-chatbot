"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock";

/** Flattens a hast node back to its source text (for the copy button). */
function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (n.type === "text") return n.value ?? "";
  return (n.children ?? []).map(nodeText).join("");
}

const components: Components = {
  a: ({ children, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link underline decoration-link/40 underline-offset-[3px] transition-colors hover:decoration-link"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="my-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 marker:text-faint first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 marker:text-faint first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 [&>p]:my-0">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-2xl font-semibold tracking-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => <h4 className="mt-4 mb-2 text-base font-semibold first:mt-0">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-line-strong pl-4 text-muted [&>p]:my-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-line" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-line last:border-0">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2.5 align-top">{children}</td>,

  code: ({ className, children, node }) => {
    const raw = nodeText(node);
    const language = /(?:language|lang)-([\w+-]+)/.exec(className ?? "")?.[1];

    // react-markdown renders inline code without a language class.
    if (!language && !raw.includes("\n")) {
      return (
        <code className="rounded-md bg-surface px-[0.4em] py-[0.15em] font-mono text-[0.85em] break-words">
          {children}
        </code>
      );
    }
    return (
      <CodeBlock code={raw.replace(/\n$/, "")} language={language}>
        {children}
      </CodeBlock>
    );
  },
  // The <code> renderer already emits the block shell.
  pre: ({ children }) => <>{children}</>,
};

/** Renders assistant output as Markdown (GFM tables, task lists, strikethrough). */
export default function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[1rem] leading-[1.75] break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
