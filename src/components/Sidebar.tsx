// Version: 1.8
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  UserCog,
  Settings,
  Building2,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";

const itemsByRole = {
  // Admin = the studio owner / head of creative. Sees everything, manages projects.
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/clients", label: "Clients", icon: Building2 },
    { href: "/team", label: "Team", icon: UserCog },
    { href: "/settings/pipeline", label: "Pipeline", icon: Settings },
  ],
  // Designer = task-focused. Their daily queue lives at the top.
  designer: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "My Tasks", icon: CheckSquare },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/clients", label: "Clients", icon: Building2 },
    { href: "/team", label: "Team", icon: UserCog },
  ],
  client: [
    { href: "/portal", label: "My Projects", icon: FolderKanban },
  ],
} as const;

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = itemsByRole[user.role] ?? [];

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-bg-1 flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-md bg-gradient-to-br from-accent to-accent-muted grid place-items-center shadow-glow">
            <span className="font-black text-white text-sm">S</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Studio</div>
            <div className="text-[10px] uppercase tracking-widest text-ink-2">Brand PM</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition group ${
                active
                  ? "bg-bg-3 text-ink-0 shadow-card"
                  : "text-ink-1 hover:bg-bg-2 hover:text-ink-0"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-accent" : "text-ink-2 group-hover:text-ink-1"}
              />
              <span>{it.label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-line">
        <div className="text-[10px] uppercase tracking-widest text-ink-3">Version</div>
        <div className="font-mono text-xs text-ink-2 mt-0.5">v1.8</div>
      </div>
    </aside>
  );
}
