"use client";

import { NewChatIcon, SidebarIcon } from "./Icons";

interface Props {
  /** null before mount: assume the CSS default (open on desktop). */
  sidebarOpen: boolean | null;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  model: string;
}

export default function TopBar({ sidebarOpen, onOpenSidebar, onNewChat, model }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-canvas/85 px-3 backdrop-blur-xl">
      {sidebarOpen !== true && (
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          title="Open sidebar"
          className={[
            "rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-primary",
            sidebarOpen === null ? "md:hidden" : "",
          ].join(" ")}
        >
          <SidebarIcon size={20} />
        </button>
      )}

      <span className="rounded-lg px-2 py-1 text-[0.95rem] font-medium text-muted">{model}</span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onNewChat}
        aria-label="New chat"
        title="New chat"
        className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-primary md:hidden"
      >
        <NewChatIcon size={20} />
      </button>
    </header>
  );
}
