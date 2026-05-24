// Version: 1.2
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, ExternalLink, Link2 } from "lucide-react";
import type { ProjectWithExtras, TaskWithExtras } from "@/lib/queries";
import type { PipelineStage } from "@/lib/types";
import { Avatar } from "./Avatar";
import { formatDate, relativeDeadline } from "@/lib/format";

export function ProjectsTable({
  stages,
  projects,
  tasksByProject,
  canCreate,
}: {
  stages: PipelineStage[];
  projects: ProjectWithExtras[];
  tasksByProject: Map<number, TaskWithExtras[]>;
  canCreate: boolean;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  const toggleGroup = (sid: number) => {
    const next = new Set(collapsedGroups);
    next.has(sid) ? next.delete(sid) : next.add(sid);
    setCollapsedGroups(next);
  };
  const toggleProject = (pid: number) => {
    const next = new Set(expandedProjects);
    next.has(pid) ? next.delete(pid) : next.add(pid);
    setExpandedProjects(next);
  };

  const grouped = stages
    .map((s) => ({
      stage: s,
      projects: projects.filter((p) => p.current_stage_id === s.id),
    }))
    .filter((g) => g.projects.length > 0);

  return (
    <div className="space-y-5">
      {grouped.map(({ stage, projects: gProjects }) => {
        const isCollapsed = collapsedGroups.has(stage.id);
        return (
          <section key={stage.id} className="card overflow-hidden">
            {/* Group header */}
            <header
              className="flex items-center gap-3 px-4 py-3 border-b border-line cursor-pointer hover:bg-bg-2 transition"
              style={{ borderLeft: `4px solid ${stage.color}` }}
              onClick={() => toggleGroup(stage.id)}
            >
              <button className="text-ink-2 hover:text-ink-0 transition">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <h2
                className="text-sm font-bold tracking-tight"
                style={{ color: stage.color }}
              >
                {stage.name}
              </h2>
              <span className="text-xs text-ink-3">({gProjects.length})</span>
            </header>

            {!isCollapsed && (
              <>
                {/* Column headers */}
                <div
                  className="grid items-center px-2 py-2 border-b border-line bg-bg-1 text-[10px] uppercase tracking-widest text-ink-3 font-semibold"
                  style={{ gridTemplateColumns: COLUMNS }}
                >
                  <div></div>
                  <div className="flex items-center gap-1">Projects</div>
                  <div className="flex items-center gap-1">
                    Brief Link <Info />
                  </div>
                  <div className="flex items-center gap-1">
                    Client <Info />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    Phase <Info />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    Owner <Info />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    Due Date <Info />
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    Priority <Info />
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-line">
                  {gProjects.map((p) => {
                    const expanded = expandedProjects.has(p.id);
                    const subtasks = tasksByProject.get(p.id) ?? [];
                    const projectSubs = subtasks.filter((t) => t.category === "project");
                    return (
                      <div key={p.id}>
                        {/* Project row */}
                        <div
                          className="grid items-center px-2 py-2.5 hover:bg-bg-2 transition group"
                          style={{
                            gridTemplateColumns: COLUMNS,
                            borderLeft: `3px solid ${stage.color}`,
                          }}
                        >
                          <button
                            onClick={() => toggleProject(p.id)}
                            className="text-ink-3 hover:text-ink-0 transition flex items-center gap-1 px-2"
                            title={expanded ? "Collapse" : "Expand subtasks"}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium text-sm tracking-tight truncate hover:text-accent transition pr-2 flex items-center gap-2"
                          >
                            <span className="truncate">{p.name}</span>
                            {projectSubs.length > 0 && (
                              <span className="text-[10px] font-mono text-ink-3 bg-bg-3 rounded px-1.5 py-0.5">
                                {projectSubs.length}
                              </span>
                            )}
                          </Link>

                          <BriefLinkCell url={p.brief_url} />

                          <div className="text-sm text-ink-1 truncate pr-2">
                            {p.client_name}
                          </div>

                          <div className="flex justify-center">
                            <PhaseChip stage={stage} />
                          </div>

                          <div className="flex justify-center">
                            {p.owner_name ? (
                              <Avatar
                                name={p.owner_name}
                                color={p.owner_color || "#71717a"}
                                size={24}
                              />
                            ) : (
                              <div className="size-6 rounded-full border border-dashed border-line grid place-items-center text-ink-3">
                                <Plus size={10} />
                              </div>
                            )}
                          </div>

                          <DueDateCell ts={p.deadline} />

                          <div className="flex justify-center">
                            <PriorityChip priority={p.priority} />
                          </div>
                        </div>

                        {/* Subtask rows */}
                        {expanded && (
                          <div
                            className="border-t border-line"
                            style={{
                              background: "rgba(124, 92, 255, 0.025)",
                              borderLeft: `3px solid ${stage.color}66`,
                            }}
                          >
                            {/* Sub column headers */}
                            <div
                              className="grid items-center px-2 py-2 border-b border-line text-[10px] uppercase tracking-widest text-ink-3 font-semibold pl-12"
                              style={{ gridTemplateColumns: SUB_COLUMNS }}
                            >
                              <div>Subitem</div>
                              <div className="text-center flex items-center justify-center gap-1">
                                Task Status <Info />
                              </div>
                              <div className="text-center flex items-center justify-center gap-1">
                                Designer <Info />
                              </div>
                              <div className="text-center flex items-center justify-center gap-1">
                                Due Date <Info />
                              </div>
                            </div>

                            {projectSubs.length === 0 ? (
                              <div className="px-12 py-4 text-xs text-ink-3">
                                No tasks yet for this project.{" "}
                                <Link
                                  href={`/projects/${p.id}?tab=tasks`}
                                  className="text-accent hover:underline"
                                >
                                  Add tasks →
                                </Link>
                              </div>
                            ) : (
                              <>
                                {projectSubs.map((t, i) => (
                                  <div
                                    key={t.id}
                                    className="grid items-center px-2 py-2 hover:bg-bg-2 transition pl-12"
                                    style={{
                                      gridTemplateColumns: SUB_COLUMNS,
                                      borderTop: i > 0 ? "1px solid var(--line)" : undefined,
                                    }}
                                  >
                                    <div className="text-sm text-ink-1 truncate pr-2">
                                      <span className="text-ink-3 font-mono text-[10px] mr-2">
                                        TASK {i + 1}:
                                      </span>
                                      {t.title}
                                    </div>
                                    <div className="flex justify-center">
                                      <TaskStatusChip status={t.status} />
                                    </div>
                                    <div className="flex justify-center">
                                      {t.assignee_name ? (
                                        <Avatar
                                          name={t.assignee_name}
                                          color={t.assignee_color || "#71717a"}
                                          size={22}
                                        />
                                      ) : (
                                        <div className="size-5 rounded-full border border-dashed border-line grid place-items-center text-ink-3">
                                          <Plus size={9} />
                                        </div>
                                      )}
                                    </div>
                                    <DueDateCell ts={t.due_date} small />
                                  </div>
                                ))}
                              </>
                            )}

                            <Link
                              href={`/projects/${p.id}?tab=tasks`}
                              className="block px-12 py-2.5 text-xs text-ink-3 hover:text-accent hover:bg-bg-2 transition border-t border-line"
                            >
                              + Add subitem
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

// 8 columns: expand · projects · brief link · client · phase · owner · due · priority
const COLUMNS = "32px 2fr 1.4fr 1.3fr 110px 80px 110px 90px";
// 4 columns within subtasks: subitem · status · designer · due
const SUB_COLUMNS = "2fr 130px 80px 110px";

function Info() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3/60">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </svg>
  );
}

function PhaseChip({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[80px] text-center"
      style={{
        background: stage.color,
        color: "#fff",
        textShadow: "0 1px 0 rgba(0,0,0,0.2)",
      }}
    >
      {stage.name}
    </span>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    high: { label: "High", bg: "#ef4444" },
    med: { label: "Medium", bg: "#f59e0b" },
    low: { label: "Low", bg: "#52525b" },
  };
  const v = map[priority] ?? map.med;
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[70px] text-center"
      style={{ background: v.bg, color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
    >
      {v.label}
    </span>
  );
}

function TaskStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    todo: { label: "Todo", bg: "#52525b" },
    in_progress: { label: "Working", bg: "#3b82f6" },
    done: { label: "Done", bg: "#22c55e" },
  };
  const v = map[status] ?? map.todo;
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[90px]"
      style={{ background: v.bg, color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
    >
      {v.label}
    </span>
  );
}

function BriefLinkCell({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center px-2">
        <span className="text-xs text-ink-3 italic">—</span>
      </div>
    );
  }
  let display = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-xs text-accent hover:underline truncate px-2 group"
      title={url}
    >
      <Link2 size={11} className="shrink-0" />
      <span className="truncate">{display}</span>
      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 shrink-0" />
    </a>
  );
}

function DueDateCell({ ts, small }: { ts: number | null; small?: boolean }) {
  const rd = relativeDeadline(ts);
  return (
    <div className="flex justify-center">
      <span
        className={`text-${small ? "[11px]" : "xs"} font-medium tabular-nums ${
          rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-1"
        }`}
      >
        {ts ? formatDate(ts) : <span className="text-ink-3">—</span>}
      </span>
    </div>
  );
}
