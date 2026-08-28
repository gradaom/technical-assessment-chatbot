"use client";

import { useEffect, useState } from "react";
import { useConversations } from "@/lib/useConversations";
import { useTheme } from "@/lib/useTheme";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const MODEL_LABEL = "Technical Assessment";

export default function AppShell() {
  const { conversations, activeId, ready, store, newChat, select, rename, remove, removeAll } =
    useConversations();
  const { theme, toggle } = useTheme();

  // null until mounted: the server cannot know the viewport, so the sidebar
  // renders from a CSS media query first and only then becomes stateful.
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setSidebarOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  const closeOnMobile = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) setSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        theme={theme}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => {
          newChat();
          closeOnMobile();
        }}
        onSelect={(id) => {
          select(id);
          closeOnMobile();
        }}
        onRename={rename}
        onDelete={remove}
        onDeleteAll={removeAll}
        onToggleTheme={toggle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={newChat}
          model={MODEL_LABEL}
        />

        {/* Remounting per thread lets each conversation load its own history. */}
        {ready && activeId && <Chat key={activeId} store={store} />}
      </div>
    </div>
  );
}
