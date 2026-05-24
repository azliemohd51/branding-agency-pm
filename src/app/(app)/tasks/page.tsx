// Version: 1.7
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { listTasks, listClients, listProjects, listDesigners } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { TaskCard } from "@/components/TaskCard";
import { CheckSquare, Filter, Hash } from "lucide-react";
import { NewTaskQuick } from "@/components/NewTaskQuick";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "project", label: "Projects" },
  { key: "social_media", label: "Social Media" },
  { key: "adhoc", label: "Ad-hoc" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; scope?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const sp = await searchParams;
  const scope = sp.scope === "all" && user.role === "admin" ? "all" : "mine";
  const category = sp.category && sp.category !== "all" ? sp.category : undefined;

  // Personal queue = ALL tasks assigned to me, across categories.
  // (Project tasks still ALSO live inside their project page — this is the cross-cutting view.)
  const baseFilter = {
    ...(scope === "mine" ? { assigneeId: user.id } : {}),
    ...(category ? { category } : {}),
  };
  const tasks = listTasks(baseFilter);

  const projects = listProjects();
  const designers = listDesigners();

  const todo = tasks.filter((t) => t.status === "todo");
  const inProg = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  const title = scope === "all" ? "All Tasks" : user.role === "designer" ? "My Tasks" : "Tasks";

  return (
    <>
      <TopBar
        user={user}
        title={title}
        subtitle={
          scope === "all"
            ? "Across the whole team"
            : "Your daily queue — projects, social, ad-hoc"
        }
      />
      <main className="p-6 max-w-7xl mx-auto w-full">
        <PageHeader
          title={title}
          subtitle="Everything assigned to you across projects, social media, and ad-hoc work."
          actions={
            <NewTaskQuick
              designers={designers}
              projects={projects}
              defaultAssignee={user.id}
            />
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-ink-3" />
            {FILTERS.map((f) => {
              const active = (f.key === "all" && !category) || f.key === category;
              const params = new URLSearchParams();
              if (f.key !== "all") params.set("category", f.key);
              if (scope === "all") params.set("scope", "all");
              const href = "/tasks" + (params.toString() ? `?${params}` : "");
              return (
                <Link
                  key={f.key}
                  href={href}
                  className={`pill transition ${
                    active
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "border-line bg-bg-1 text-ink-2 hover:bg-bg-2 hover:text-ink-0"
                  }`}
                >
                  <Hash size={10} />
                  {f.label}
                </Link>
              );
            })}
          </div>

          {user.role === "admin" && (
            <div className="flex items-center gap-1">
              <Link
                href={`/tasks${category ? `?category=${category}` : ""}`}
                className={`tab text-xs py-1.5 ${scope === "mine" ? "tab-active" : ""}`}
              >
                Mine
              </Link>
              <Link
                href={`/tasks?scope=all${category ? `&category=${category}` : ""}`}
                className={`tab text-xs py-1.5 ${scope === "all" ? "tab-active" : ""}`}
              >
                Everyone
              </Link>
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="card p-12 text-center bg-dotgrid">
            <CheckSquare size={28} className="mx-auto text-ink-3 mb-3" />
            <div className="text-base font-semibold">Inbox zero.</div>
            <div className="text-sm text-ink-2 mt-1">Nothing assigned to you right now.</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <Column label="Todo" color="#71717a" tasks={todo} />
            <Column label="Working on it" color="#fdab3d" tasks={inProg} />
            <Column label="Done" color="#00c875" tasks={done} />
          </div>
        )}
      </main>
    </>
  );
}

function Column({ label, color, tasks }: { label: string; color: string; tasks: any[] }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </div>
        <div className="text-xs text-ink-3 ml-auto">{tasks.length}</div>
      </div>
      {tasks.length === 0 && <div className="text-xs text-ink-3 text-center py-3">—</div>}
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} showProject />
      ))}
    </div>
  );
}
