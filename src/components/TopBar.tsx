// Version: 1.0
"use client";

import { useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "./Avatar";
import type { SessionUser } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";

export function TopBar({ user, title, subtitle }: { user: SessionUser; title?: string; subtitle?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-line bg-bg-1/60 backdrop-blur sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        <div className="min-w-0">
          {title && <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>}
          {subtitle && <p className="text-xs text-ink-2 truncate">{subtitle}</p>}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg pl-1.5 pr-2.5 py-1.5 hover:bg-bg-3 transition"
          >
            <Avatar name={user.name} color={user.avatar_color} size={26} />
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-2">{user.role}</div>
            </div>
            <ChevronDown size={14} className="text-ink-2" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 card p-1.5 z-50">
                <div className="px-2.5 py-2 border-b border-line mb-1">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  <div className="text-[11px] text-ink-2 truncate">{user.email}</div>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-ink-1 hover:text-ink-0 hover:bg-bg-3 transition"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
