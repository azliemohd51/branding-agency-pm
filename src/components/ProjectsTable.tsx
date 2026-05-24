// Version: 1.4
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, Link2, X, Plus } from "lucide-react";
import type { ProjectWithExtras, TaskWithExtras } from "@/lib/queries";
import type { PipelineStage, CustomColumn, Client, User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { EditableCell } from "./EditableCell";
import { AddColumnButton } from "./AddColumnButton";
import { formatDate, relativeDeadline, dateInputValue } from "@/lib/format";
import {
  updateProjectField,
  updateTaskField,
  setCustomColumnValue,
  deleteCustomColumn,
} from "@/app/(app)/projects/actions";

export function ProjectsTable({
  stages,
  projects,
  tasksByProject,
  clients,
  users,
  customColumns,
  customValues,
  canEdit,
  isAdmin,
}: {
  stages: PipelineStage[];
  projects: ProjectWithExtras[];
  tasksByProject: Map<number, TaskWithExtras[]>;
  clients: Client[];
  users: User[];
  customColumns: CustomColumn[];
  customValues: Map<number, Map<number, string>>;
  canEdit: boolean;
  isAdmin: boolean;
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

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.company ?? c.name }));
  const userOptions = users
    .filter((u) => u.role !== "client")
    .map((u) => ({ value: String(u.id), label: u.name }));
  const stageOptions = stages.map((s) => ({ value: String(s.id), label: s.name, color: s.color }));
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "med", label: "Medium" },
    { value: "high", label: "High" },
  ];
  const statusOptions = [
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "Working" },
    { value: "done", label: "Done" },
  ];

  // Grid template: chevron · name · brief · client · phase · owner · due · priority · [custom...] · add
  const mainGrid = [
    "32px",                       // chevron
    "minmax(220px, 2fr)",         // project name
    "minmax(160px, 1.3fr)",       // brief link
    "minmax(150px, 1.2fr)",       // client
    "120px",                      // phase
    "84px",                       // owner
    "112px",                      // due
    "100px",                      // priority
    ...customColumns.map((c) => (c.type === "url" ? "minmax(160px, 1.3fr)" : c.type === "text" ? "minmax(140px, 1.2fr)" : "120px")),
    "44px",                       // add column / spacing
  ].join(" ");

  return (
    <div className="space-y-5">
      {grouped.map(({ stage, projects: gProjects }) => {
        const isCollapsed = collapsedGroups.has(stage.id);
        return (
          <section key={stage.id} className="card overflow-x-auto">
            {/* Group header */}
            <header
              className="flex items-center gap-3 px-4 py-3 border-b border-line cursor-pointer hover:bg-bg-2 transition sticky left-0"
              style={{ borderLeft: `4px solid ${stage.color}` }}
              onClick={() => toggleGroup(stage.id)}
            >
              <button className="text-ink-2 hover:text-ink-0 transition">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <h2 className="text-sm font-bold tracking-tight" style={{ color: stage.color }}>
                {stage.name}
              </h2>
              <span className="text-xs text-ink-3">({gProjects.length})</span>
            </header>

            {!isCollapsed && (
              <>
                {/* Column headers */}
                <div
                  className="grid items-center px-2 py-2 border-b border-line bg-bg-2 text-[10px] uppercase tracking-widest text-ink-2 font-semibold"
                  style={{ gridTemplateColumns: mainGrid, minWidth: "fit-content" }}
                >
                  <div></div>
                  <div className="px-2">Projects</div>
                  <div className="px-2">Brief Link</div>
                  <div className="px-2">Client</div>
                  <div className="text-center">Phase</div>
                  <div className="text-center">Owner</div>
                  <div className="text-center">Due Date</div>
                  <div className="text-center">Priority</div>
                  {customColumns.map((c) => (
                    <div key={c.id} className="px-2 text-center group/colhead flex items-center justify-center gap-1.5">
                      <span className="truncate">{c.name}</span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete column "${c.name}" and all values?`)) {
                              void deleteCustomColumn(c.id);
                            }
                          }}
                          className="text-ink-3 hover:text-danger transition opacity-0 group-hover/colhead:opacity-100"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-center">
                    <AddColumnButton canManage={isAdmin} />
                  </div>
                </div>

                {/* Project rows */}
                <div className="divide-y divide-line" style={{ minWidth: "fit-content" }}>
                  {gProjects.map((p) => {
                    const expanded = expandedProjects.has(p.id);
                    const subtasks = tasksByProject.get(p.id) ?? [];
                    const projectSubs = subtasks.filter((t) => t.category === "project");
                    const colVals = customValues.get(p.id);
                    return (
                      <div key={p.id}>
                        {/* Project row */}
                        <div
                          className="grid items-center py-1 hover:bg-bg-2 transition group/row"
                          style={{
                            gridTemplateColumns: mainGrid,
                            borderLeft: `3px solid ${stage.color}`,
                          }}
                        >
                          <button
                            onClick={() => toggleProject(p.id)}
                            className="text-ink-3 hover:text-ink-0 transition flex items-center justify-center"
                            title={expanded ? "Collapse" : "Expand subtasks"}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {/* Project name + open link */}
                          <div className="flex items-center gap-2 group/name pr-2">
                            <div className="flex-1 min-w-0">
                              <EditableCell
                                type="text"
                                value={p.name}
                                disabled={!canEdit}
                                onSave={(v) => updateProjectField(p.id, "name", v)}
                                display={
                                  <span className="font-medium text-sm tracking-tight truncate flex items-center gap-2">
                                    <span className="truncate">{p.name}</span>
                                    {projectSubs.length > 0 && (
                                      <span className="text-[10px] font-mono text-ink-3 bg-bg-3 rounded px-1.5 py-0.5 shrink-0">
                                        {projectSubs.length}
                                      </span>
                                    )}
                                  </span>
                                }
                              />
                            </div>
                            <Link
                              href={`/projects/${p.id}`}
                              title="Open project"
                              className="text-ink-3 hover:text-accent opacity-0 group-hover/row:opacity-100 transition shrink-0"
                            >
                              <ExternalLink size={12} />
                            </Link>
                          </div>

                          {/* Brief link */}
                          <EditableCell
                            type="url"
                            value={p.brief_url}
                            disabled={!canEdit}
                            placeholder="Add link…"
                            onSave={(v) => updateProjectField(p.id, "brief_url", v)}
                            display={
                              p.brief_url ? (
                                <BriefLinkDisplay url={p.brief_url} />
                              ) : (
                                <span className="text-xs text-ink-3 italic">Add link…</span>
                              )
                            }
                          />

                          {/* Client */}
                          <EditableCell
                            type="select"
                            value={String(p.client_id)}
                            options={clientOptions}
                            disabled={!canEdit}
                            commitOnBlur
                            onSave={(v) => updateProjectField(p.id, "client_id", v)}
                            display={<span className="text-sm text-ink-1 truncate">{p.client_name}</span>}
                          />

                          {/* Phase */}
                          <EditableCell
                            type="select"
                            value={String(p.current_stage_id)}
                            options={stageOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "current_stage_id", v)}
                            display={<PhaseChip stage={stage} />}
                          />

                          {/* Owner */}
                          <EditableCell
                            type="select"
                            value={p.owner_id ? String(p.owner_id) : ""}
                            options={userOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "owner_id", v)}
                            display={
                              p.owner_name ? (
                                <Avatar name={p.owner_name} color={p.owner_color || "#71717a"} size={24} />
                              ) : (
                                <div className="size-6 rounded-full border border-dashed border-line grid place-items-center text-ink-3">
                                  <Plus size={10} />
                                </div>
                              )
                            }
                          />

                          {/* Due Date */}
                          <EditableCell
                            type="date"
                            value={dateInputValue(p.deadline)}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "deadline", v)}
                            display={<DueDateDisplay ts={p.deadline} />}
                          />

                          {/* Priority */}
                          <EditableCell
                            type="select"
                            value={p.priority}
                            options={priorityOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "priority", v)}
                            display={<PriorityChip priority={p.priority} />}
                          />

                          {/* Custom columns */}
                          {customColumns.map((c) => {
                            const v = colVals?.get(c.id) ?? null;
                            return (
                              <EditableCell
                                key={c.id}
                                type={c.type}
                                value={v}
                                disabled={!canEdit}
                                align={c.type === "text" || c.type === "url" ? "left" : "center"}
                                placeholder="—"
                                onSave={(nv) => setCustomColumnValue(c.id, p.id, nv)}
                                display={
                                  v ? (
                                    c.type === "url" ? (
                                      <BriefLinkDisplay url={v} />
                                    ) : c.type === "date" ? (
                                      <span className="text-xs text-ink-1 tabular-nums">{formatDate(Number(v))}</span>
                                    ) : (
                                      <span className="text-sm text-ink-1 truncate">{v}</span>
                                    )
                                  ) : (
                                    <span className="text-xs text-ink-3 italic">—</span>
                                  )
                                }
                              />
                            );
                          })}

                          {/* Spacer for add-column header alignment */}
                          <div></div>
                        </div>

                        {/* Subtask rows */}
                        {expanded && (
                          <SubtasksTable
                            projectId={p.id}
                            stage={stage}
                            tasks={projectSubs}
                            users={users}
                            canEdit={canEdit}
                            statusOptions={statusOptions}
                            userOptions={userOptions}
                          />
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

function SubtasksTable({
  projectId,
  stage,
  tasks,
  users,
  canEdit,
  statusOptions,
  userOptions,
}: {
  projectId: number;
  stage: PipelineStage;
  tasks: TaskWithExtras[];
  users: User[];
  canEdit: boolean;
  statusOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
}) {
  const subGrid = "minmax(280px, 2fr) 130px 80px 112px 1fr";

  return (
    <div
      className="border-t border-line"
      style={{
        background: "rgba(124, 92, 255, 0.04)",
        borderLeft: `3px solid ${stage.color}66`,
      }}
    >
      {/* Sub column headers */}
      <div
        className="grid items-center py-2 border-b border-line text-[10px] uppercase tracking-widest text-ink-2 font-semibold pl-10"
        style={{ gridTemplateColumns: subGrid }}
      >
        <div className="px-2">Subitem</div>
        <div className="text-center">Task Status</div>
        <div className="text-center">Designer</div>
        <div className="text-center">Due Date</div>
        <div></div>
      </div>

      {tasks.length === 0 ? (
        <div className="px-10 py-3 text-xs text-ink-3">
          No tasks yet.{" "}
          <Link href={`/projects/${projectId}?tab=tasks`} className="text-accent hover:underline">
            Add tasks →
          </Link>
        </div>
      ) : (
        tasks.map((t, i) => (
          <div
            key={t.id}
            className="grid items-center py-1 hover:bg-bg-2/40 transition pl-10"
            style={{
              gridTemplateColumns: subGrid,
              borderTop: i > 0 ? "1px solid rgba(229, 231, 235, 0.5)" : undefined,
            }}
          >
            {/* Title */}
            <div className="flex items-center gap-2 pr-2">
              <span className="text-ink-3 font-mono text-[10px] shrink-0">TASK {i + 1}</span>
              <div className="flex-1 min-w-0">
                <EditableCell
                  type="text"
                  value={t.title}
                  disabled={!canEdit}
                  onSave={(v) => updateTaskField(t.id, "title", v)}
                  display={<span className="text-sm text-ink-1 truncate">{t.title}</span>}
                />
              </div>
            </div>

            {/* Status */}
            <EditableCell
              type="select"
              value={t.status}
              options={statusOptions}
              disabled={!canEdit}
              align="center"
              onSave={(v) => updateTaskField(t.id, "status", v)}
              display={<TaskStatusChip status={t.status} />}
            />

            {/* Designer */}
            <EditableCell
              type="select"
              value={t.assignee_id ? String(t.assignee_id) : ""}
              options={userOptions}
              disabled={!canEdit}
              align="center"
              onSave={(v) => updateTaskField(t.id, "assignee_id", v)}
              display={
                t.assignee_name ? (
                  <Avatar name={t.assignee_name} color={t.assignee_color || "#71717a"} size={22} />
                ) : (
                  <div className="size-5 rounded-full border border-dashed border-line grid place-items-center text-ink-3">
                    <Plus size={9} />
                  </div>
                )
              }
            />

            {/* Due */}
            <EditableCell
              type="date"
              value={dateInputValue(t.due_date)}
              disabled={!canEdit}
              align="center"
              onSave={(v) => updateTaskField(t.id, "due_date", v)}
              display={<DueDateDisplay ts={t.due_date} small />}
            />

            <div></div>
          </div>
        ))
      )}

      <Link
        href={`/projects/${projectId}?tab=tasks`}
        className="block px-10 py-2 text-xs text-ink-3 hover:text-accent hover:bg-bg-2 transition border-t border-line"
      >
        + Add subitem
      </Link>
    </div>
  );
}

// ===== Cell display components =====

function PhaseChip({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[90px] text-center"
      style={{
        background: stage.color,
        color: "#fff",
        textShadow: "0 1px 0 rgba(0,0,0,0.18)",
      }}
    >
      {stage.name}
    </span>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    high: { label: "High", bg: "#dc2626" },
    med: { label: "Medium", bg: "#d97706" },
    low: { label: "Low", bg: "#71717a" },
  };
  const v = map[priority] ?? map.med;
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[78px]"
      style={{ background: v.bg, color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.18)" }}
    >
      {v.label}
    </span>
  );
}

function TaskStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    todo: { label: "Todo", bg: "#71717a" },
    in_progress: { label: "Working", bg: "#2563eb" },
    done: { label: "Done", bg: "#16a34a" },
  };
  const v = map[status] ?? map.todo;
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-semibold rounded-md px-2.5 py-1 min-w-[90px]"
      style={{ background: v.bg, color: "#fff", textShadow: "0 1px 0 rgba(0,0,0,0.18)" }}
    >
      {v.label}
    </span>
  );
}

function BriefLinkDisplay({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return (
    <span className="flex items-center gap-1.5 text-xs text-accent truncate" title={url}>
      <Link2 size={11} className="shrink-0" />
      <span className="truncate">{display}</span>
    </span>
  );
}

function DueDateDisplay({ ts, small }: { ts: number | null; small?: boolean }) {
  if (!ts) return <span className="text-xs text-ink-3 italic">—</span>;
  const rd = relativeDeadline(ts);
  return (
    <span
      className={`${small ? "text-[11px]" : "text-xs"} font-medium tabular-nums ${
        rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-1"
      }`}
    >
      {formatDate(ts)}
    </span>
  );
}
