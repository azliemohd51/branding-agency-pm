// Version: 1.0
import "server-only";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import type { User, SessionUser } from "./types";

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email.trim()) as User | undefined;
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    client_id: user.client_id,
    avatar_color: user.avatar_color,
  };
}
