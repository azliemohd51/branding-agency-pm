// Version: 1.0
// Programmatic smoke test — forges a session cookie for each role and hits protected routes.
import { sealData } from "iron-session";
import { sessionOptions } from "./session";
import { getDb } from "./db";

const BASE = process.env.BASE_URL ?? "http://localhost:3030";

async function makeSessionCookie(user: any) {
  const sealed = await sealData({ user }, sessionOptions);
  return `${sessionOptions.cookieName}=${sealed}`;
}

async function check(role: string, cookie: string, paths: { path: string; expect: number; mustContain?: string }[]) {
  console.log(`\n— ${role} —`);
  for (const t of paths) {
    const res = await fetch(`${BASE}${t.path}`, { headers: { cookie }, redirect: "manual" });
    const body = res.status === 200 ? await res.text() : "";
    const okStatus = res.status === t.expect;
    const okContent = !t.mustContain || body.includes(t.mustContain);
    const tag = okStatus && okContent ? "✓" : "✗";
    console.log(`  ${tag}  ${String(res.status).padEnd(3)}  ${t.path}${t.mustContain ? `  · contains "${t.mustContain}"` : ""}`);
    if (!okStatus || !okContent) process.exitCode = 1;
  }
}

async function main() {
  const db = getDb();
  const admin = db.prepare("SELECT id, email, name, role, client_id, avatar_color FROM users WHERE email = 'admin@studio.com'").get() as any;
  const designer = db.prepare("SELECT id, email, name, role, client_id, avatar_color FROM users WHERE email = 'designer@studio.com'").get() as any;
  const client = db.prepare("SELECT id, email, name, role, client_id, avatar_color FROM users WHERE email = 'client@acme.com'").get() as any;

  const adminCookie = await makeSessionCookie(admin);
  const designerCookie = await makeSessionCookie(designer);
  const clientCookie = await makeSessionCookie(client);

  await check("Admin", adminCookie, [
    { path: "/dashboard", expect: 200, mustContain: "Active projects" },
    { path: "/projects", expect: 200, mustContain: "Acme Rebrand" },
    { path: "/projects/1", expect: 200, mustContain: "Pipeline" },
    { path: "/tasks", expect: 200, mustContain: "Inbox" },
    { path: "/clients", expect: 200, mustContain: "Acme Co" },
    { path: "/clients/1", expect: 200, mustContain: "Brand brief" },
    { path: "/team", expect: 200, mustContain: "Workload" },
    { path: "/settings/pipeline", expect: 200, mustContain: "Discovery" },
    { path: "/projects/new", expect: 200, mustContain: "New project" },
    { path: "/clients/new", expect: 200, mustContain: "New client" },
  ]);

  await check("Designer", designerCookie, [
    { path: "/dashboard", expect: 200, mustContain: "Up next" },
    { path: "/projects", expect: 200 },
    { path: "/tasks", expect: 200, mustContain: "Inbox" },
    { path: "/team", expect: 200 },
    { path: "/settings/pipeline", expect: 307 }, // designer should be redirected
  ]);

  await check("Client", clientCookie, [
    { path: "/portal", expect: 200, mustContain: "My Projects" },
    { path: "/dashboard", expect: 307 }, // client should bounce to /portal
    { path: "/projects", expect: 307 },
    { path: "/clients", expect: 307 },
    { path: "/tasks", expect: 307 },
    { path: "/settings/pipeline", expect: 307 },
  ]);

  if (process.exitCode) {
    console.log("\n✗ Some checks failed.\n");
  } else {
    console.log("\n✓ All checks passed.\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
