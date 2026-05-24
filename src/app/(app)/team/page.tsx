// Version: 1.0
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listDesignerWorkload, listTasks } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/format";

export default async function TeamPage() {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const workload = listDesignerWorkload();
  // Pull tasks once and group in JS so we render workload + top tasks per person
  const tasks = listTasks();
  const tasksByUser = new Map<number, any[]>();
  for (const t of tasks) {
    if (!t.assignee_id || t.status === "done") continue;
    if (!tasksByUser.has(t.assignee_id)) tasksByUser.set(t.assignee_id, []);
    tasksByUser.get(t.assignee_id)!.push(t);
  }

  return (
    <>
      <TopBar user={user} title="Team" subtitle={`${workload.length} member${workload.length === 1 ? "" : "s"}`} />
      <main className="p-6 max-w-7xl mx-auto w-full">
        <PageHeader title="Team" subtitle="Workload across designers and admins." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workload.map((w) => {
            const myTasks = tasksByUser.get(w.id) ?? [];
            const topThree = [...myTasks]
              .sort((a, b) => (a.due_date ?? 9e9) - (b.due_date ?? 9e9))
              .slice(0, 3);
            return (
              <div key={w.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={w.name} color={w.avatar_color} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold tracking-tight truncate">{w.name}</div>
                    <div className="text-xs text-ink-2 truncate">{w.email}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-3">{w.role}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Stat label="Projects" value={w.active_projects} />
                  <Stat label="Tasks" value={w.open_tasks} />
                  <Stat
                    label="Next due"
                    value={w.upcoming_deadline ? formatDate(w.upcoming_deadline) : "—"}
                    small
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-line">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3 mb-2">Top open tasks</div>
                  {topThree.length === 0 ? (
                    <div className="text-xs text-ink-3">—</div>
                  ) : (
                    <div className="space-y-1.5">
                      {topThree.map((t) => (
                        <Link
                          key={t.id}
                          href={t.project_id ? `/projects/${t.project_id}` : "/tasks"}
                          className="flex items-center gap-2 group hover:bg-bg-3 -mx-1 px-1 py-1 rounded transition"
                        >
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ background: t.priority === "high" ? "#ef4444" : t.priority === "med" ? "#3b82f6" : "#52525b" }}
                          />
                          <span className="text-sm truncate flex-1 group-hover:text-accent transition">{t.title}</span>
                          {t.due_date && (
                            <span className="text-[10px] text-ink-3">{formatDate(t.due_date)}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: any; small?: boolean }) {
  return (
    <div className="surface-2 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-ink-2">{label}</div>
      <div className={small ? "text-sm font-semibold mt-0.5" : "text-xl font-bold mt-0.5"}>{value}</div>
    </div>
  );
}
