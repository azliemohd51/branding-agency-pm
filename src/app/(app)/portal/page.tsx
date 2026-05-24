// Version: 1.0
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  listProjects,
  listStages,
  listDeliverables,
  listFeedback,
  getClient,
  getProjectTeam,
} from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { StagePill, StatusPill } from "@/components/Pill";
import { Avatar } from "@/components/Avatar";
import { DeliverableCard } from "@/components/DeliverableCard";
import { FeedbackThread } from "@/components/FeedbackThread";
import { relativeDeadline } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export default async function PortalPage() {
  const user = await requireUser();
  if (user.role !== "client") redirect("/dashboard");

  const projects = listProjects({ user });
  const stages = listStages();
  const client = user.client_id ? getClient(user.client_id) : null;

  return (
    <>
      <TopBar user={user} title="My Projects" subtitle={client?.company ?? client?.name ?? ""} />
      <main className="p-6 max-w-5xl mx-auto w-full">
        <PageHeader
          title={`Hi ${user.name.split(" ")[0]}.`}
          subtitle={`${projects.length} active project${projects.length === 1 ? "" : "s"} with your team.`}
        />

        {projects.length === 0 ? (
          <div className="card p-12 text-center bg-dotgrid">
            <div className="text-base font-semibold">No projects yet.</div>
            <div className="text-sm text-ink-2 mt-1">Your studio will add projects here when they start.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((p) => (
              <ProjectBlock key={p.id} projectId={p.id} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

async function ProjectBlock({ projectId }: { projectId: number }) {
  const p = (listProjects()).find((x) => x.id === projectId)!;
  const stages = listStages();
  const deliverables = listDeliverables(projectId);
  const team = getProjectTeam(projectId);
  const feedback = listFeedback({ projectId });
  const rd = relativeDeadline(p.deadline);
  const stageIdx = stages.findIndex((s) => s.id === p.current_stage_id);

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-bold tracking-tight">{p.name}</div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <StatusPill status={p.status} />
            <span className="text-ink-3">·</span>
            <span className={rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-2"}>
              {rd.text}
            </span>
          </div>
        </div>
        <StagePill name={p.stage_name} color={p.stage_color} />
      </div>

      {/* Mini pipeline */}
      <div className="flex items-center gap-1 mb-5">
        {stages.map((s, i) => {
          const past = i < stageIdx;
          const cur = i === stageIdx;
          return (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div
                className="flex-1 h-1 rounded-full"
                style={{
                  background: past || cur ? s.color : "#2a2a31",
                  opacity: cur ? 1 : past ? 0.7 : 0.5,
                  boxShadow: cur ? `0 0 0 2px ${s.color}33` : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-2 mb-2">Deliverables</div>
          {deliverables.length === 0 ? (
            <div className="text-sm text-ink-3">Your team hasn't posted any deliverables yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {deliverables.map((d) => (
                <DeliverableCard key={d.id} d={d} canEdit={false} canApprove={true} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-2 mb-2">Your team</div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 surface-2 pl-1 pr-3 py-1 rounded-full">
                <Avatar name={m.name} color={m.avatar_color} size={20} />
                <span className="text-xs">{m.name}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-widest text-ink-2 mb-2">Conversation</div>
          <FeedbackThread feedback={feedback.slice(0, 3)} projectId={projectId} canModerate={false} />
        </div>
      </div>
    </section>
  );
}
