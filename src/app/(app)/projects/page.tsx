// Version: 1.2
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listProjects, listStages, listTasks } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ProjectsTable } from "@/components/ProjectsTable";
import { Plus, FolderKanban } from "lucide-react";
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

  // Pre-fetch tasks grouped by project (one query, then bucket)
  const allTasks = listTasks();
  const tasksByProject = new Map<number, typeof allTasks>();
  for (const t of allTasks) {
    if (t.project_id) {
      if (!tasksByProject.has(t.project_id)) tasksByProject.set(t.project_id, []);
      tasksByProject.get(t.project_id)!.push(t);
    }
  }

  return (
    <>
      <TopBar
        user={user}
        title="Projects"
        subtitle={`${filtered.length} of ${allProjects.length}`}
      />
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
        <div className="flex flex-wrap items-center gap-2 mb-5">
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
            <div className="text-sm text-ink-2 mt-1 mb-5">
              Spin up your first brand engagement.
            </div>
            {user.role === "admin" && (
              <Link href="/projects/new" className="btn-primary inline-flex">
                <Plus size={16} /> New project
              </Link>
            )}
          </div>
        ) : (
          <ProjectsTable
            stages={stages}
            projects={filtered}
            tasksByProject={tasksByProject}
            canCreate={user.role === "admin"}
          />
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
      style={
        active && color ? { borderColor: `${color}66`, color, background: `${color}1a` } : {}
      }
    >
      {color && active && (
        <span className="size-1.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </Link>
  );
}
