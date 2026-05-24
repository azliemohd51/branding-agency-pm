// Version: 1.0
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  listProjects,
  listTasks,
  listStages,
  listDesignerWorkload,
} from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { StagePill, StatusPill } from "@/components/Pill";
import { Avatar } from "@/components/Avatar";
import { formatDate, relativeDeadline } from "@/lib/format";
import { ArrowRight, Folder, CheckSquare, MessageSquare, TrendingUp, Inbox } from "lucide-react";

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "client") redirect("/portal");

  const projects = listProjects({ user });
  const tasks = listTasks({ assigneeId: user.id });
  const myOpenTasks = tasks.filter((t) => t.status !== "done");
  const stages = listStages();
  const workload = user.role === "admin" ? listDesignerWorkload() : [];

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalOpenFeedback = projects.reduce((s, p) => s + p.open_feedback, 0);

  return (
    <>
      <TopBar
        user={user}
        title={greeting(user.name)}
        subtitle={`${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"} · ${myOpenTasks.length} open item${myOpenTasks.length === 1 ? "" : "s"}`}
      />

      <main className="p-6 max-w-7xl mx-auto w-full">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Metric icon={Folder} label="Active projects" value={activeProjects.length} accent="#7c5cff" />
          <Metric icon={CheckSquare} label="Open tasks" value={myOpenTasks.length} accent="#ec4899" />
          <Metric icon={MessageSquare} label="Open feedback" value={totalOpenFeedback} accent="#f59e0b" />
          <Metric icon={TrendingUp} label="Stages defined" value={stages.length} accent="#22c55e" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Tasks — designers/admins */}
          <section className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Up next</h2>
                <p className="text-xs text-ink-2">Open tasks assigned to you, across projects and inbox</p>
              </div>
              <Link href="/tasks" className="btn-ghost text-xs">
                <Inbox size={12} /> Open Inbox
              </Link>
            </div>

            {myOpenTasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Inbox zero." sub="Nothing assigned to you right now." />
            ) : (
              <div className="space-y-1.5">
                {myOpenTasks.slice(0, 8).map((t) => {
                  const rd = relativeDeadline(t.due_date);
                  return (
                    <Link
                      key={t.id}
                      href={t.project_id ? `/projects/${t.project_id}` : "/tasks"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-3 transition group"
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: t.priority === "high" ? "#ef4444" : t.priority === "med" ? "#3b82f6" : "#52525b" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-accent transition">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-ink-2 truncate flex items-center gap-1.5 mt-0.5">
                          {t.category === "project" ? (
                            <>
                              <span>{t.project_name}</span>
                              <span className="text-ink-3">·</span>
                              <span>{t.client_name}</span>
                            </>
                          ) : t.category === "social_media" ? (
                            <span className="text-pink-400">Social media</span>
                          ) : (
                            <span className="text-amber-400">Ad-hoc</span>
                          )}
                        </div>
                      </div>
                      <StatusPill status={t.status} />
                      <span
                        className={`text-[11px] font-medium shrink-0 w-20 text-right ${
                          rd.tone === "overdue"
                            ? "text-danger"
                            : rd.tone === "soon"
                            ? "text-warn"
                            : rd.tone === "ok"
                            ? "text-ink-1"
                            : "text-ink-3"
                        }`}
                      >
                        {rd.text}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sidebar column */}
          <section className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold tracking-tight">Active projects</h3>
                <Link href="/projects" className="btn-ghost text-xs">All <ArrowRight size={12} /></Link>
              </div>
              {activeProjects.length === 0 ? (
                <EmptyState title="No active projects." sub="" />
              ) : (
                <div className="space-y-2">
                  {activeProjects.slice(0, 5).map((p) => {
                    const rd = relativeDeadline(p.deadline);
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="block p-3 rounded-lg hover:bg-bg-3 border border-line transition group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-sm font-semibold truncate group-hover:text-accent transition">
                            {p.name}
                          </div>
                          <StagePill name={p.stage_name} color={p.stage_color} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-ink-2">
                          <span className="truncate">{p.client_name}</span>
                          <span className={rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : ""}>
                            {rd.text}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {user.role === "admin" && workload.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-bold tracking-tight mb-4">Team workload</h3>
                <div className="space-y-3">
                  {workload.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center gap-3">
                      <Avatar name={w.name} color={w.avatar_color} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{w.name}</div>
                        <div className="text-[11px] text-ink-2">
                          {w.active_projects} project{w.active_projects === 1 ? "" : "s"} · {w.open_tasks} task{w.open_tasks === 1 ? "" : "s"}
                        </div>
                      </div>
                      {w.upcoming_deadline && (
                        <div className="text-[10px] text-ink-2">
                          Next {formatDate(w.upcoming_deadline)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function greeting(name: string) {
  const h = new Date().getHours();
  const first = name.split(" ")[0];
  if (h < 12) return `Good morning, ${first}.`;
  if (h < 18) return `Good afternoon, ${first}.`;
  return `Good evening, ${first}.`;
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div
        className="size-10 rounded-lg grid place-items-center shrink-0"
        style={{ background: `${accent}1a`, color: accent }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-2 truncate">{label}</div>
        <div className="text-xl font-bold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  sub,
  icon: Icon,
}: {
  title: string;
  sub?: string;
  icon?: any;
}) {
  return (
    <div className="text-center py-8">
      {Icon && (
        <div className="mx-auto size-10 rounded-full bg-bg-3 grid place-items-center text-ink-2 mb-3">
          <Icon size={18} />
        </div>
      )}
      <div className="text-sm font-medium text-ink-1">{title}</div>
      {sub && <div className="text-xs text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}
