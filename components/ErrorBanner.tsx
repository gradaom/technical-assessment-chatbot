"use client";

import { AlertIcon, CloseIcon, RegenerateIcon } from "./Icons";

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="animate-pop mx-auto mb-2 flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger"
    >
      <AlertIcon size={18} className="shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>

      <div className="flex shrink-0 items-center gap-1">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-danger/10"
          >
            <RegenerateIcon size={14} />
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-lg p-1.5 transition-colors hover:bg-danger/10"
        >
          <CloseIcon size={15} />
        </button>
      </div>
    </div>
  );
}
