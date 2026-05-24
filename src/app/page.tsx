// Version: 1.0
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Index() {
  const s = await getSession();
  if (!s.user) redirect("/login");
  if (s.user.role === "client") redirect("/portal");
  redirect("/dashboard");
}
