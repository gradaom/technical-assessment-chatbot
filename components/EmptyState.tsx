"use client";

const SUGGESTIONS = [
  {
    title: "Explain a concept",
    prompt: "Explain the difference between SSR, SSG and ISR in Next.js, with a table.",
  },
  {
    title: "Write some code",
    prompt: "Write a typed useDebounce hook in TypeScript and show me how to use it.",
  },
  {
    title: "Review my thinking",
    prompt: "Summarise the SOLID principles and give one concrete violation of each.",
  },
  {
    title: "Draft something",
    prompt: "Draft a short, friendly release note for a bug-fix update.",
  },
];

export default function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map(({ title, prompt }) => (
        <button
          key={title}
          type="button"
          onClick={() => onPick(prompt)}
          className="group rounded-2xl border border-line px-4 py-3 text-left transition-colors hover:bg-surface"
        >
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-sm text-muted line-clamp-2">{prompt}</span>
        </button>
      ))}
    </div>
  );
}
