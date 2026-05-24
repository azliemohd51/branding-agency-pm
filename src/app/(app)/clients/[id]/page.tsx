// Version: 1.0
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getClient, listProjects, listStages } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { StagePill, StatusPill } from "@/components/Pill";
import { relativeDeadline, formatMoney } from "@/lib/format";
import { updateClient } from "@/app/(app)/projects/actions";
import { Mail, Building2 } from "lucide-react";

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const { id } = await params;
  const cid = Number(id);
  const client = getClient(cid);
  if (!client) notFound();

  const allProjects = listProjects();
  const projects = allProjects.filter((p) => p.client_id === cid);

  const canEdit = user.role === "admin";

  return (
    <>
      <TopBar user={user} title={client.company ?? client.name} subtitle="Client" />
      <main className="p-6 max-w-5xl mx-auto w-full">
        <PageHeader
          title={client.company ?? client.name}
          subtitle={client.company ? client.name : "Individual"}
          back={{ href: "/clients", label: "Clients" }}
          meta={
            client.contact_email ? (
              <div className="flex items-center gap-1.5 text-ink-2"><Mail size={12} /> {client.contact_email}</div>
            ) : null
          }
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <form action={updateClient} className="lg:col-span-2 card p-5 space-y-5">
            <input type="hidden" name="id" value={client.id} />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact name</label>
                <input name="name" defaultValue={client.name} required className="input" disabled={!canEdit} />
              </div>
              <div>
                <label className="label">Company</label>
                <input name="company" defaultValue={client.company ?? ""} className="input" disabled={!canEdit} />
              </div>
            </div>
            <div>
              <label className="label">Contact email</label>
              <input name="contact_email" type="email" defaultValue={client.contact_email ?? ""} className="input" disabled={!canEdit} />
            </div>
            <div>
              <label className="label">Brand brief</label>
              <textarea name="brand_brief" rows={5} defaultValue={client.brand_brief ?? ""} className="input resize-none" disabled={!canEdit} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Target audience</label>
                <textarea name="target_audience" rows={4} defaultValue={client.target_audience ?? ""} className="input resize-none" disabled={!canEdit} />
              </div>
              <div>
                <label className="label">Brand values</label>
                <textarea name="brand_values" rows={4} defaultValue={client.brand_values ?? ""} className="input resize-none" disabled={!canEdit} />
              </div>
            </div>
            {canEdit && (
              <div className="pt-3 border-t border-line">
                <button type="submit" className="btn-primary">Save changes</button>
              </div>
            )}
          </form>

          <aside className="card p-5">
            <div className="text-sm font-bold tracking-tight mb-3">Projects ({projects.length})</div>
            {projects.length === 0 ? (
              <div className="text-sm text-ink-3">No projects with this client yet.</div>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => {
                  const rd = relativeDeadline(p.deadline);
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block p-3 rounded-lg border border-line hover:bg-bg-3 transition group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="text-sm font-medium truncate group-hover:text-accent transition flex-1">
                          {p.name}
                        </div>
                        <StagePill name={p.stage_name} color={p.stage_color} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-2">
                        <StatusPill status={p.status} />
                        <span className={rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : ""}>{rd.text}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
