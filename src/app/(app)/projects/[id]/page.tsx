// Version: 1.0
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import {
  getProject,
  listStages,
  getProjectTeam,
  listTasks,
  listDeliverables,
  listFeedback,
  getClient,
  listDesigners,
} from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { StagePill, StatusPill } from "@/components/Pill";
import { PipelineBarServer } from "@/components/PipelineBarServer";
import { Avatar } from "@/components/Avatar";
import { TaskCard } from "@/components/TaskCard";
import { NewTaskInline } from "@/components/NewTaskForm";
import { DeliverableCard } from "@/components/DeliverableCard";
import { FeedbackThread } from "@/components/FeedbackThread";
import { relativeDeadline, formatDate, formatMoney } from "@/lib/format";
import {
  CheckSquare,
  FileText,
  MessageSquare,
  ScrollText,
  Users,
  LayoutDashboard,
  Plus,
  ExternalLink,
} from "lucide-react";
import { createDeliverable, addProjectMember, removeProjectMember } from "../actions";
import { getDb } from "@/lib/db";

type TabKey = "overview" | "tasks" | "deliverables" | "feedback" | "brief" | "team";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "deliverables", label: "Deliverables", icon: FileText },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "brief", label: "Brief", icon: ScrollText },
  { key: "team", label: "Team", icon: Users },
];

export default async function ProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const projectId = Number(id);

  const project = getProject(projectId);
  if (!project) notFound();
  if (user.role === "client" && project.client_id !== user.client_id) redirect("/portal");

  const team = getProjectTeam(projectId);
  const isOnTeam = team.some((m) => m.id === user.id);
  if (user.role === "designer" && !isOnTeam) {
    // Designers see only assigned projects
    redirect("/projects");
  }

  const canEdit = user.role === "admin" || (user.role === "designer" && isOnTeam);
  const canApprove = user.role === "client" || user.role === "admin";

  const stages = listStages();
  const tasks = listTasks({ projectId });
  const deliverables = listDeliverables(projectId);
  const feedback = listFeedback({ projectId });
  const client = getClient(project.client_id);
  const designers = listDesigners();

  const tab: TabKey = (TABS.find((t) => t.key === tabParam)?.key ?? "overview") as TabKey;
  const rd = relativeDeadline(project.deadline);

  // Tasks grouped by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <>
      <TopBar user={user} title={project.name} subtitle={project.client_name} />
      <main className="p-6 max-w-7xl mx-auto w-full">
        <PageHeader
          title={project.name}
          back={{ href: "/projects", label: "Projects" }}
          meta={
            <>
              <Link href={`/clients/${project.client_id}`} className="text-ink-2 hover:text-accent transition">
                {project.client_name}
              </Link>
              <span className="text-ink-3">·</span>
              <StatusPill status={project.status} />
              <span className="text-ink-3">·</span>
              <span className={rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-2"}>
                {rd.text}
              </span>
              {project.budget && (
                <>
                  <span className="text-ink-3">·</span>
                  <span className="text-ink-2">{formatMoney(project.budget)}</span>
                </>
              )}
            </>
          }
        />

        {/* Pipeline */}
        <div className="mb-6">
          <PipelineBarServer
            stages={stages}
            currentStageId={project.current_stage_id}
            projectId={projectId}
            canEdit={canEdit}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-line mb-6 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            if (t.key === "team" && user.role === "client") return null;
            const active = tab === t.key;
            const count =
              t.key === "tasks" ? tasks.filter((x) => x.status !== "done").length
                : t.key === "deliverables" ? deliverables.length
                : t.key === "feedback" ? feedback.filter((f) => !f.resolved).length
                : t.key === "team" ? team.length
                : 0;
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={`/projects/${projectId}?tab=${t.key}`}
                className={`tab whitespace-nowrap ${active ? "tab-active" : ""}`}
              >
                <Icon size={14} />
                {t.label}
                {count > 0 && (
                  <span className={`text-[10px] ${active ? "text-accent" : "text-ink-3"}`}>{count}</span>
                )}
              </Link>
            );
          })}
        </div>

        {tab === "overview" && (
          <Overview
            project={project}
            tasks={tasks}
            deliverables={deliverables}
            feedback={feedback}
            team={team}
          />
        )}
        {tab === "tasks" && (
          <TasksBoard
            tasksByStatus={tasksByStatus}
            projectId={projectId}
            canEdit={canEdit}
            designers={designers}
          />
        )}
        {tab === "deliverables" && (
          <DeliverablesGrid
            deliverables={deliverables}
            projectId={projectId}
            canEdit={canEdit}
            canApprove={canApprove}
          />
        )}
        {tab === "feedback" && (
          <FeedbackThread feedback={feedback} projectId={projectId} canModerate={canEdit} />
        )}
        {tab === "brief" && <Brief project={project} client={client!} />}
        {tab === "team" && (
          <TeamPanel
            projectId={projectId}
            team={team}
            designers={designers}
            isAdmin={user.role === "admin"}
          />
        )}
      </main>
    </>
  );
}

// ===== Tab views =====

function Overview({
  project,
  tasks,
  deliverables,
  feedback,
  team,
}: {
  project: any;
  tasks: any[];
  deliverables: any[];
  feedback: any[];
  team: any[];
}) {
  const open = tasks.filter((t) => t.status !== "done");
  const upcoming = [...open]
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date ?? 0) - (b.due_date ?? 0))
    .slice(0, 3);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Tasks (open)" value={open.length} hint={`${tasks.length} total`} color="#7c5cff" />
          <SummaryCard
            label="Deliverables"
            value={deliverables.length}
            hint={`${deliverables.filter((d) => d.status === "approved").length} approved`}
            color="#ec4899"
          />
          <SummaryCard
            label="Open feedback"
            value={feedback.filter((f) => !f.resolved).length}
            hint={`${feedback.length} total`}
            color="#f59e0b"
          />
          <SummaryCard label="Team" value={team.length} hint="members" color="#22c55e" />
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold tracking-tight mb-4">Description</h3>
          <p className="text-sm text-ink-1 leading-relaxed whitespace-pre-wrap">
            {project.description || <span className="text-ink-3">No description.</span>}
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold tracking-tight mb-4">Next up</h3>
          {upcoming.length === 0 ? (
            <div className="text-sm text-ink-3">Nothing due.</div>
          ) : (
            <div className="space-y-1">
              {upcoming.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ background: t.priority === "high" ? "#ef4444" : t.priority === "med" ? "#3b82f6" : "#52525b" }}
                  />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-[11px] text-ink-2">{formatDate(t.due_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold tracking-tight mb-3">Team</h3>
          {team.length === 0 ? (
            <div className="text-sm text-ink-3">No team assigned.</div>
          ) : (
            <div className="space-y-2">
              {team.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar name={m.name} color={m.avatar_color} size={26} />
                  <div className="text-sm">{m.name}</div>
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-ink-3">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, hint, color }: { label: string; value: number; hint?: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-2">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
      {hint && <div className="text-[11px] text-ink-3 mt-0.5">{hint}</div>}
    </div>
  );
}

function TasksBoard({
  tasksByStatus,
  projectId,
  canEdit,
  designers,
}: {
  tasksByStatus: { todo: any[]; in_progress: any[]; done: any[] };
  projectId: number;
  canEdit: boolean;
  designers: { id: number; name: string }[];
}) {
  const cols = [
    { key: "todo" as const, label: "Todo", color: "#71717a" },
    { key: "in_progress" as const, label: "In progress", color: "#3b82f6" },
    { key: "done" as const, label: "Done", color: "#22c55e" },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {cols.map((c) => (
        <div key={c.key} className="space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="size-1.5 rounded-full" style={{ background: c.color }} />
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>
              {c.label}
            </div>
            <div className="text-xs text-ink-3 ml-auto">{tasksByStatus[c.key].length}</div>
          </div>
          {tasksByStatus[c.key].length === 0 && (
            <div className="text-xs text-ink-3 text-center py-3">—</div>
          )}
          {tasksByStatus[c.key].map((t) => (
            <TaskCard key={t.id} task={t} canEdit={canEdit} />
          ))}
          {canEdit && c.key === "todo" && <NewTaskInline projectId={projectId} designers={designers} />}
        </div>
      ))}
    </div>
  );
}

function DeliverablesGrid({
  deliverables,
  projectId,
  canEdit,
  canApprove,
}: {
  deliverables: any[];
  projectId: number;
  canEdit: boolean;
  canApprove: boolean;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {deliverables.map((d) => (
          <DeliverableCard key={d.id} d={d} canEdit={canEdit} canApprove={canApprove} />
        ))}
      </div>
      {canEdit && (
        <form action={createDeliverable} className="card p-5 space-y-3">
          <input type="hidden" name="project_id" value={projectId} />
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Plus size={14} /> Add deliverable
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input name="name" required placeholder="e.g. Primary Logo Mark" className="input text-sm" />
            <select name="type" defaultValue="logo" className="input text-sm">
              <option value="logo">Logo</option>
              <option value="guidelines">Guidelines</option>
              <option value="business_card">Business card</option>
              <option value="social">Social kit</option>
              <option value="packaging">Packaging</option>
              <option value="web">Web mockup</option>
              <option value="signage">Signage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input name="file_url" placeholder="Figma / Drive URL (optional)" className="input text-sm" />
          <textarea name="notes" rows={2} placeholder="Notes (optional)" className="input text-sm resize-none" />
          <button type="submit" className="btn-primary text-sm">Add deliverable</button>
        </form>
      )}
    </div>
  );
}

function Brief({ project, client }: { project: any; client: any }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold tracking-tight">Client</h3>
          <Link href={`/clients/${client.id}`} className="btn-ghost text-xs">
            View client <ExternalLink size={12} />
          </Link>
        </div>
        <div className="text-base font-semibold">{client.company ?? client.name}</div>
        <div className="text-xs text-ink-2 mt-0.5">{client.contact_email}</div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold tracking-tight mb-2">Brand brief</h3>
        <p className="text-sm text-ink-1 leading-relaxed whitespace-pre-wrap">
          {client.brand_brief || <span className="text-ink-3">No brief set.</span>}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold tracking-tight mb-2">Target audience</h3>
          <p className="text-sm text-ink-1 leading-relaxed whitespace-pre-wrap">
            {client.target_audience || <span className="text-ink-3">—</span>}
          </p>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold tracking-tight mb-2">Brand values</h3>
          <p className="text-sm text-ink-1 leading-relaxed whitespace-pre-wrap">
            {client.brand_values || <span className="text-ink-3">—</span>}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold tracking-tight mb-2">Project description</h3>
        <p className="text-sm text-ink-1 leading-relaxed whitespace-pre-wrap">
          {project.description || <span className="text-ink-3">—</span>}
        </p>
      </div>
    </div>
  );
}

function TeamPanel({
  projectId,
  team,
  designers,
  isAdmin,
}: {
  projectId: number;
  team: any[];
  designers: any[];
  isAdmin: boolean;
}) {
  const onTeamIds = new Set(team.map((m) => m.id));
  const available = designers.filter((d) => !onTeamIds.has(d.id));

  async function addMember(formData: FormData) {
    "use server";
    const userId = Number(formData.get("user_id"));
    if (userId) await addProjectMember(projectId, userId);
  }
  async function removeMember(formData: FormData) {
    "use server";
    const userId = Number(formData.get("user_id"));
    if (userId) await removeProjectMember(projectId, userId);
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="card p-4">
        <div className="text-sm font-bold tracking-tight mb-3">Assigned</div>
        {team.length === 0 ? (
          <div className="text-sm text-ink-3 py-3">No team assigned yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={m.name} color={m.avatar_color} size={32} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-[11px] text-ink-2">{m.email}</div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-3">{m.role}</span>
                {isAdmin && (
                  <form action={removeMember}>
                    <input type="hidden" name="user_id" value={m.id} />
                    <button type="submit" className="btn-ghost text-xs text-ink-3 hover:text-danger">
                      Remove
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && available.length > 0 && (
        <form action={addMember} className="card p-4 flex items-center gap-2">
          <select name="user_id" className="input text-sm flex-1">
            {available.map((d) => (
              <option key={d.id} value={d.id}>{d.name} · {d.role}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-sm">Assign</button>
        </form>
      )}
    </div>
  );
}
