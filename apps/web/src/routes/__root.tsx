import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Sidebar } from "../components/Sidebar";
import "../styles.css";

export type SessionSummary = {
  id: string;
  updatedAt: string;
  title: string;
};

export const Route = createRootRoute({
  // Runs before the layout renders, so the sidebar never flashes empty.
  loader: async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
    return { sessions: (await res.json()) as SessionSummary[] };
  },
  component: RootLayout,
});

function RootLayout() {
  const { sessions } = Route.useLoaderData();

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100">
      <Sidebar sessions={sessions} />
      <Outlet />
    </div>
  );
}
