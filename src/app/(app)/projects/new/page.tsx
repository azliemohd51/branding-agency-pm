// Version: 1.0
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { listClients, listStages, listDesigners } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  const user = await requireRole("admin");
  const clients = listClients();
  const stages = listStages();
  const designers = listDesigners();

  if (clients.length === 0) {
    redirect("/clients/new?next=/projects/new");
  }

  return (
    <>
      <TopBar user={user} title="New project" />
      <main className="p-6 max-w-3xl mx-auto w-full">
        <PageHeader
          title="New project"
          subtitle="Spin up a brand engagement."
          back={{ href: "/projects", label: "Projects" }}
        />

        <form action={createProject} className="card p-6 space-y-5">
          <div>
            <label className="label">Project name</label>
            <input name="name" required className="input" placeholder="Acme Rebrand" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client</label>
              <select name="client_id" required className="input">
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Starting stage</label>
              <select name="current_stage_id" required className="input" defaultValue={stages[0]?.id}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={3}
              className="input resize-none"
              placeholder="Full identity refresh — logo, type, color, guidelines."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Deadline</label>
              <input type="date" name="deadline" className="input" />
            </div>
            <div>
              <label className="label">Budget (USD)</label>
              <input type="number" step="0.01" name="budget" className="input" placeholder="15000" />
            </div>
          </div>

          <div>
            <label className="label">Brief link (Notion / Drive / Figma URL)</label>
            <input name="brief_url" type="url" className="input" placeholder="https://notion.so/..." />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Owner</label>
              <select name="owner_id" defaultValue={user.id} className="input">
                {designers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" defaultValue="med" className="input">
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Assign team</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {designers.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line bg-bg-3 hover:bg-bg-4 cursor-pointer transition"
                >
                  <input type="checkbox" name="assignees" value={d.id} className="accent-accent" />
                  <span className="text-sm">{d.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-ink-3 ml-auto">{d.role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-line">
            <button type="submit" className="btn-primary">Create project</button>
            <Link href="/projects" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}
