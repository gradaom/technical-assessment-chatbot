"use client";

import { useMemo, useState } from "react";
import { groupByRecency, type Conversation } from "@/lib/conversations";
import ConversationRow from "./ConversationRow";
import {
  MoonIcon,
  NewChatIcon,
  SearchIcon,
  SidebarIcon,
  SparkIcon,
  SunIcon,
  TrashIcon,
} from "./Icons";
import type { Theme } from "@/lib/useTheme";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  /** null before mount: fall back to the responsive CSS default. */
  open: boolean | null;
  theme: Theme;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onToggleTheme: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  open,
  theme,
  onClose,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onDeleteAll,
  onToggleTheme,
}: Props) {
  const [query, setQuery] = useState("");
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = conversations.filter((c) => {
      if (c.messages.length === 0 && c.id !== activeId) return false;
      if (!needle) return true;
      return (
        c.title.toLowerCase().includes(needle) ||
        c.messages.some((m) => m.content.toLowerCase().includes(needle))
      );
    });
    return groupByRecency(visible);
  }, [conversations, activeId, query]);

  const hasHistory = conversations.some((c) => c.messages.length > 0);

  return (
    <>
      {/* Scrim behind the drawer on small screens. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden",
          open === true ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        aria-label="Conversations"
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col bg-sidebar",
          "md:relative md:z-auto md:translate-x-0",
          // Animate only once the real state is known, so nothing slides on load.
          open === null
            ? "-translate-x-full"
            : open
              ? "translate-x-0 transition-transform duration-200 ease-out"
              : "-translate-x-full transition-transform duration-200 ease-out md:w-0 md:overflow-hidden",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-primary"
          >
            <SidebarIcon size={20} />
          </button>
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            title="New chat"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-primary"
          >
            <NewChatIcon size={20} />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            <SparkIcon size={18} className="text-muted" />
            New chat
          </button>

          <div className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 focus-within:bg-surface-hover hover:bg-surface-hover">
            <SearchIcon size={18} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
            />
          </div>
        </div>

        <nav className="scroll-host min-h-0 flex-1 overflow-y-auto pb-2">
          {groups.length === 0 ? (
            <p className="px-5 py-6 text-sm text-faint">
              {query ? "No matching chats." : "No chats yet."}
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-1">
                <h2 className="px-5 pt-4 pb-1.5 text-xs font-medium text-faint">{group.label}</h2>
                <ul>
                  {group.items.map((conversation) => (
                    <li key={conversation.id}>
                      <ConversationRow
                        conversation={conversation}
                        active={conversation.id === activeId}
                        onSelect={() => onSelect(conversation.id)}
                        onRename={(title) => onRename(conversation.id, title)}
                        onDelete={() => onDelete(conversation.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </nav>

        <div className="border-t border-line px-3 py-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface-hover"
          >
            {theme === "dark" ? (
              <SunIcon size={18} className="text-muted" />
            ) : (
              <MoonIcon size={18} className="text-muted" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {hasHistory && (
            <button
              type="button"
              onClick={() => {
                if (!confirmingClearAll) {
                  setConfirmingClearAll(true);
                  setTimeout(() => setConfirmingClearAll(false), 4000);
                  return;
                }
                setConfirmingClearAll(false);
                onDeleteAll();
              }}
              className={[
                "mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                confirmingClearAll ? "bg-danger/10 text-danger" : "hover:bg-surface-hover",
              ].join(" ")}
            >
              <TrashIcon size={18} className={confirmingClearAll ? "" : "text-muted"} />
              {confirmingClearAll ? "Tap again to delete all" : "Delete all chats"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
