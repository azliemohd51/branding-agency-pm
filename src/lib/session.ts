// Version: 1.0
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

export interface AppSession {
  user?: SessionUser;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "dev-only-fallback-not-secure-please-change-32chars",
  cookieName: "bapm_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies();
  return getIronSession<AppSession>(cookieStore, sessionOptions);
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s.user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return s.user!;
}

export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return user;
}
