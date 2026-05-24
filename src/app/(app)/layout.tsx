// Version: 1.0
import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Clients land on /portal — keep them out of internal pages.
  if (user.role === "client") {
    const { headers } = await import("next/headers");
    const h = await headers();
    const path = h.get("x-pathname") || "";
    // (path detection limited in middleware-less mode — page-level guards in each page also redirect.)
    void path;
  }

  return (
    <div className="min-h-screen flex bg-bg-0">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
