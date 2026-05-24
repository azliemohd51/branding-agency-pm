// Version: 1.0
"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function loginAction(prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Email and password required." };

  const user = await authenticate(email, password);
  if (!user) return { error: "Invalid email or password." };

  const session = await getSession();
  session.user = user;
  await session.save();

  if (user.role === "client") redirect("/portal");
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
