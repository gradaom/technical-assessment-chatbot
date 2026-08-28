/** Shown between submitting a prompt and the first streamed token. */
export default function LoadingBubble() {
  return (
    <div className="flex w-full items-center" role="status" aria-live="polite">
      <span className="sr-only">The assistant is thinking…</span>
      <span
        aria-hidden="true"
        className="thinking-dot inline-block size-3 rounded-full bg-primary"
      />
    </div>
  );
}
