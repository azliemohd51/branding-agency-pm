// Version: 1.0
"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-bg-0">
      {/* Left — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="size-9 rounded-lg bg-gradient-to-br from-accent to-accent-muted grid place-items-center shadow-glow">
              <span className="font-black text-white text-lg">S</span>
            </div>
            <div>
              <div className="font-bold tracking-tight">Studio</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-2">Brand PM</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back.</h1>
          <p className="text-ink-2 text-sm mb-8">Sign in to your workspace.</p>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="you@studio.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {state?.error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
                {state.error}
              </div>
            )}

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "Signing in…" : (<>Sign in <ArrowRight size={16} /></>)}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <div className="text-[10px] uppercase tracking-widest text-ink-3 mb-2">
              Demo credentials
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <CredLine label="Admin" email="admin@studio.com" />
              <CredLine label="Designer" email="designer@studio.com" />
              <CredLine label="Client" email="client@acme.com" />
              <div className="text-ink-3 pt-1">password: <span className="text-ink-1">password</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-bg-1 border-l border-line bg-dotgrid">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-pink-500/5" />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <Sparkles size={14} className="text-accent" />
            v1.0 · Project management for brand studios
          </div>
          <div className="space-y-6 max-w-md">
            <div className="text-[10px] uppercase tracking-widest text-accent">A studio OS</div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Run your <span className="text-accent">brand</span> projects like the best agencies do.
            </h2>
            <p className="text-ink-1 leading-relaxed">
              Pipeline stages, deliverables, revisions, client feedback, and a personal task queue for
              every designer — in one fast, dark, focused workspace.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {["Discovery", "Strategy", "Design", "Refinement", "Delivery", "Done"].map((s, i) => (
                <div
                  key={s}
                  className="text-[10px] uppercase tracking-widest text-ink-2 px-2 py-1 rounded border border-line bg-bg-2"
                  style={{
                    color: i === 2 ? "#ec4899" : undefined,
                    borderColor: i === 2 ? "#ec489966" : undefined,
                    background: i === 2 ? "#ec489915" : undefined,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-ink-3">
            Built for brand designers — v1.0
          </div>
        </div>
      </div>
    </main>
  );
}

function CredLine({ label, email }: { label: string; email: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink-1">{email}</span>
    </div>
  );
}
