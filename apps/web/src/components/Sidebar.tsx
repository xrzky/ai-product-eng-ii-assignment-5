import { Link } from "@tanstack/react-router";
import { Bot, MessageSquare, PanelLeft, SquarePen } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SessionSummary } from "../routes/__root";

export function Sidebar({ sessions }: { sessions: SessionSummary[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-zinc-950 p-2 text-sm text-zinc-100 transition-[width] duration-200 md:flex ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div
        className={`flex h-10 items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <span className="flex items-center gap-2 px-2 font-semibold">
            <Bot className="size-5" />
            Finance
          </span>
        )}
        <IconButton
          label={collapsed ? "Open sidebar" : "Close sidebar"}
          onClick={() => setCollapsed((value) => !value)}
        >
          <PanelLeft className="size-5" />
        </IconButton>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        <Link
          to="/"
          className={`flex h-10 items-center gap-3 rounded-lg text-zinc-200 hover:bg-zinc-900 ${
            collapsed ? "justify-center" : "px-3"
          }`}
        >
          <SquarePen className="size-5" />
          {!collapsed && <span>New chat</span>}
        </Link>
      </nav>

      {!collapsed && (
        <>
          <p className="mt-6 px-3 text-xs font-medium text-zinc-500">Chats</p>
          <div className="mt-2 flex flex-col gap-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="px-3 py-2 text-zinc-500">No chats yet</p>
            ) : (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  to="/s/$id"
                  params={{ id: session.id }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900"
                  activeProps={{
                    className:
                      "flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-zinc-100",
                  }}
                >
                  <MessageSquare className="size-4 shrink-0 text-zinc-400" />
                  <span className="truncate">{session.title}</span>
                </Link>
              ))
            )}
          </div>
        </>
      )}

      <div className="mt-auto flex items-center gap-2 rounded-lg px-1 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          D
        </span>
        {!collapsed && <span className="truncate">default-user</span>}
      </div>
    </aside>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
    >
      {children}
    </button>
  );
}
