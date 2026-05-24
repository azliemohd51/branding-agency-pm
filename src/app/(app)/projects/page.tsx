// Version: 1.0
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listProjects, listStages } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { StagePill, StatusPill } from "@/components/Pill";
import { relativeDeadline, formatMoney } from "@/lib/format";
import { Plus, Search, FolderKanban } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const sp = await searchParams;
  const stages = listStages();
  const allProjects = listProjects({ user });

  const filtered = allProjects.filter((p) => {
    if (sp.stage && String(p.current_stage_id) !== sp.stage) return false;
    if (sp.status && p.status !== sp.status) return false;
    return true;
  });

  const grouped = stages.map((s) => ({
    stage: s,
    projects: filtered.filter((p) => p.current_stage_id === s.id),
  }));

  return (
    <>
      <TopBar user={user} title="Projects" subtitle={`${filtered.length} of ${allProjects.length}`} />
      <main className="p-6 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Projects"
          subtitle="Brand work moving through your pipeline."
          actions={
            user.role === "admin" && (
              <Link href="/projects/new" className="btn-primary">
                <Plus size={16} /> New project
              </Link>
            )
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <FilterPill href="/projects" label="All stages" active={!sp.stage} />
          {stages.map((s) => (
            <FilterPill
              key={s.id}
              href={`/projects?stage=${s.id}`}
              label={s.name}
              active={String(s.id) === sp.stage}
              color={s.color}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center bg-dotgrid">
            <FolderKanban size={28} className="mx-auto text-ink-3 mb-3" />
            <div className="text-base font-semibold">No projects yet.</div>
            <div className="text-sm text-ink-2 mt-1 mb-5">Spin up your first brand engagement.</div>
            {user.role === "admin" && (
              <Link href="/projects/new" className="btn-primary inline-flex">
                <Plus size={16} /> New project
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {grouped.map(({ stage, projects }) =>
              projects.length === 0 ? null : (
                <div key={stage.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-1.5 rounded-full" style={{ background: stage.color }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: stage.color }}>
                      {stage.name}
                    </h2>
                    <div className="text-xs text-ink-3">({projects.length})</div>
                    <div className="flex-1 h-px bg-line ml-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {projects.map((p) => {
                      const rd = relativeDeadline(p.deadline);
                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          className="card card-hover p-4 group block"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-semibold tracking-tight truncate group-hover:text-accent transition">
                              {p.name}
                            </div>
                            <StatusPill status={p.status} />
                          </div>
                          <div className="text-xs text-ink-2 mb-3">{p.client_name}</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <StagePill name={stage.name} color={stage.color} />
                            </div>
                            <span
                              className={`font-medium ${
                                rd.tone === "overdue"
                                  ? "text-danger"
                                  : rd.tone === "soon"
                                  ? "text-warn"
                                  : "text-ink-2"
                              }`}
                            >
                              {rd.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-line text-[11px] text-ink-2">
                            <span>{p.team_count} member{p.team_count === 1 ? "" : "s"}</span>
                            <span>·</span>
                            <span>{p.task_count} open task{p.task_count === 1 ? "" : "s"}</span>
                            {p.open_feedback > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-warn">{p.open_feedback} open feedback</span>
                              </>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}

function FilterPill({
  href,
  label,
  active,
  color,
}: {
  href: string;
  label: string;
  active: boolean;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className={`pill transition ${
        active
          ? "bg-bg-3 border-line-strong text-ink-0"
          : "border-line bg-bg-1 text-ink-2 hover:bg-bg-2 hover:text-ink-0"
      }`}
      style={active && color ? { borderColor: `${color}66`, color, background: `${color}1a` } : {}}
    >
      {color && active && <span className="size-1.5 rounded-full" style={{ background: color }} />}
      {label}
    </Link>
  );
}
