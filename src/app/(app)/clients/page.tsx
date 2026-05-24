// Version: 1.0
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { listClients, listProjects } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Building2, Mail } from "lucide-react";

export default async function ClientsPage() {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const clients = listClients();
  const allProjects = listProjects();
  const counts = new Map<number, number>();
  for (const p of allProjects) {
    counts.set(p.client_id, (counts.get(p.client_id) ?? 0) + 1);
  }

  return (
    <>
      <TopBar user={user} title="Clients" subtitle={`${clients.length} total`} />
      <main className="p-6 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Clients"
          subtitle="Brands you're building for."
          actions={
            user.role === "admin" && (
              <Link href="/clients/new" className="btn-primary">
                <Plus size={16} /> New client
              </Link>
            )
          }
        />

        {clients.length === 0 ? (
          <div className="card p-12 text-center bg-dotgrid">
            <Building2 size={28} className="mx-auto text-ink-3 mb-3" />
            <div className="text-base font-semibold">No clients yet.</div>
            <div className="text-sm text-ink-2 mt-1 mb-5">Add your first client to start a project.</div>
            {user.role === "admin" && (
              <Link href="/clients/new" className="btn-primary inline-flex">
                <Plus size={16} /> New client
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="card card-hover p-5 block group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-bg-3 to-bg-4 grid place-items-center text-ink-1 shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold tracking-tight truncate group-hover:text-accent transition">
                      {c.company ?? c.name}
                    </div>
                    {c.company && (
                      <div className="text-xs text-ink-2 truncate">{c.name}</div>
                    )}
                  </div>
                </div>
                {c.contact_email && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-2 mb-3 truncate">
                    <Mail size={11} />
                    {c.contact_email}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-line">
                  <span className="text-[11px] text-ink-3">
                    {counts.get(c.id) ?? 0} project{counts.get(c.id) === 1 ? "" : "s"}
                  </span>
                  {c.brand_values && (
                    <span className="text-[11px] text-ink-2 italic truncate ml-2 max-w-[60%]">{c.brand_values}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
