"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@/lib/conversations";
import { DotsIcon, PencilIcon, TrashIcon } from "./Icons";

interface Props {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export default function ConversationRow({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dismiss the row menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rowRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== conversation.title) onRename(draft);
    else setDraft(conversation.title);
  };

  if (editing) {
    return (
      <div className="px-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(conversation.title);
              setEditing(false);
            }
          }}
          aria-label="Conversation title"
          className="w-full rounded-lg border border-line-strong bg-canvas px-2.5 py-1.5 text-sm focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div ref={rowRef} className="group/row relative px-2">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={[
          "flex w-full items-center rounded-lg py-2 pr-8 pl-2.5 text-left text-sm transition-colors",
          active ? "bg-surface-active" : "hover:bg-surface-hover",
        ].join(" ")}
      >
        <span className="truncate">{conversation.title}</span>
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={`Options for ${conversation.title}`}
        aria-expanded={menuOpen}
        className={[
          "absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted transition-opacity hover:text-primary",
          menuOpen || active
            ? "opacity-100"
            : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
        ].join(" ")}
      >
        <DotsIcon size={16} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="animate-pop absolute top-full right-3 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-canvas py-1 shadow-pop"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setDraft(conversation.title);
              setEditing(true);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
          >
            <PencilIcon size={15} />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <TrashIcon size={15} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
