// Version: 1.8
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Info,
  X,
  Plus,
  Link2,
} from "lucide-react";
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
  createTask,
} from "@/app/(app)/projects/actions";

// Build a CSS grid template for the project rows.
const COL_DEFS = {
  check: "36px",
  projects: "minmax(360px, 2.2fr)",
  brief: "minmax(180px, 1.3fr)",
  client: "minmax(150px, 1.2fr)",
  phase: "130px",
  owner: "88px",
  due: "108px",
  priority: "108px",
};

const SUB_COL_DEFS = {
  check: "36px",
  subitem: "minmax(380px, 2.2fr)",
  status: "150px",
  designer: "100px",
  due: "108px",
};

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
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set(projects.slice(0, 1).map((p) => p.id)) // expand first project by default to mirror screenshot
  );

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
  const stageOptions = stages.map((s) => ({ value: String(s.id), label: s.name }));
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "med", label: "Medium" },
    { value: "high", label: "High" },
  ];
  const statusOptions = [
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "Working on it" },
    { value: "done", label: "Done" },
  ];

  const mainGridCols = [
    COL_DEFS.check,
    COL_DEFS.projects,
    COL_DEFS.brief,
    COL_DEFS.client,
    COL_DEFS.phase,
    COL_DEFS.owner,
    COL_DEFS.due,
    COL_DEFS.priority,
    ...customColumns.map((c) =>
      c.type === "url" ? "minmax(160px, 1.2fr)" : c.type === "text" ? "minmax(140px, 1.1fr)" : "120px"
    ),
    "44px", // + add column
  ].join(" ");

  const subGridCols = [
    SUB_COL_DEFS.check,
    SUB_COL_DEFS.subitem,
    SUB_COL_DEFS.status,
    SUB_COL_DEFS.designer,
    SUB_COL_DEFS.due,
    "44px", // + sub-add
  ].join(" ");

  return (
    <div className="space-y-8">
      {grouped.map(({ stage, projects: gProjects }) => {
        const isCollapsed = collapsedGroups.has(stage.id);
        return (
          <section key={stage.id} className="space-y-2">
            {/* Group header — purple text + chevron */}
            <button
              onClick={() => toggleGroup(stage.id)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-bg-2 rounded-md transition group"
            >
              {isCollapsed ? (
                <ChevronRight size={16} style={{ color: stage.color }} />
              ) : (
                <ChevronDown size={16} style={{ color: stage.color }} />
              )}
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: stage.color }}
              >
                {stage.name}
              </span>
            </button>

            {!isCollapsed && (
              <div className="bg-bg-1 border border-line rounded-lg overflow-x-auto shadow-card">
                {/* Header row */}
                <div
                  className="grid items-center border-b border-line bg-bg-1 text-[12px] font-semibold text-ink-1"
                  style={{ gridTemplateColumns: mainGridCols, minWidth: "fit-content" }}
                >
                  <Cell border="r">
                    <FakeCheckbox />
                  </Cell>
                  <HeaderCell label="Projects" />
                  <HeaderCell label="Brief Link" />
                  <HeaderCell label="Client" />
                  <HeaderCell label="Phase" center />
                  <HeaderCell label="Owner" center />
                  <HeaderCell label="Due Date" center />
                  <HeaderCell label="Priority" center isLast={customColumns.length === 0} />
                  {customColumns.map((c, i) => (
                    <div
                      key={c.id}
                      className={`group/colhead flex items-center justify-center gap-1.5 px-3 py-2.5 ${
                        i < customColumns.length - 1 ? "border-r border-line" : "border-r border-line"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <Info size={12} className="text-ink-3/60" />
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete column "${c.name}"?`)) {
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
                  <div className="flex items-center justify-center px-1">
                    <AddColumnButton canManage={isAdmin} />
                  </div>
                </div>

                {/* Project rows */}
                {gProjects.map((p, idx) => {
                  const expanded = expandedProjects.has(p.id);
                  const subtasks = tasksByProject.get(p.id) ?? [];
                  const projectSubs = subtasks.filter((t) => t.category === "project");
                  const colVals = customValues.get(p.id);
                  return (
                    <div key={p.id}>
                      {/* Project row */}
                      <div
                        className={`grid items-stretch hover:bg-bg-2/40 transition group/row ${
                          idx > 0 ? "border-t border-line" : ""
                        }`}
                        style={{ gridTemplateColumns: mainGridCols, minWidth: "fit-content" }}
                      >
                        <Cell border="r" center>
                          <FakeCheckbox />
                        </Cell>

                        {/* Projects column */}
                        <Cell border="r">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={() => toggleProject(p.id)}
                              className="text-ink-3 hover:text-ink-0 transition shrink-0"
                            >
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <EditableCell
                                type="text"
                                value={p.name}
                                disabled={!canEdit}
                                onSave={(v) => updateProjectField(p.id, "name", v)}
                                display={
                                  <span className="text-[14px] font-medium text-ink-0 truncate">
                                    {p.name}
                                  </span>
                                }
                              />
                            </div>
                            {projectSubs.length > 0 && (
                              <span className="text-[10px] font-bold text-ink-2 bg-bg-3 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
                                {projectSubs.length}
                              </span>
                            )}
                            <Link
                              href={`/projects/${p.id}`}
                              title="Open project"
                              className="text-ink-3 hover:text-accent transition opacity-0 group-hover/row:opacity-100 shrink-0"
                            >
                              <Maximize2 size={12} />
                            </Link>
                            {p.open_feedback > 0 && (
                              <Link
                                href={`/projects/${p.id}?tab=feedback`}
                                title={`${p.open_feedback} open feedback`}
                                className="relative shrink-0 text-info hover:text-accent transition"
                              >
                                <MessageSquare size={14} />
                                <span className="absolute -top-1 -right-1.5 size-3.5 grid place-items-center rounded-full bg-info text-white text-[9px] font-bold">
                                  {p.open_feedback}
                                </span>
                              </Link>
                            )}
                          </div>
                        </Cell>

                        {/* Brief Link */}
                        <Cell border="r">
                          <EditableCell
                            type="url"
                            value={p.brief_url}
                            disabled={!canEdit}
                            placeholder="Add link…"
                            onSave={(v) => updateProjectField(p.id, "brief_url", v)}
                            display={
                              p.brief_url ? (
                                <BriefLinkBadge url={p.brief_url} />
                              ) : (
                                <span className="text-xs text-ink-3 italic">Add link…</span>
                              )
                            }
                          />
                        </Cell>

                        {/* Client */}
                        <Cell border="r">
                          <EditableCell
                            type="select"
                            value={String(p.client_id)}
                            options={clientOptions}
                            disabled={!canEdit}
                            onSave={(v) => updateProjectField(p.id, "client_id", v)}
                            display={
                              <span className="text-[13px] text-ink-1 truncate">
                                {p.client_name}
                              </span>
                            }
                          />
                        </Cell>

                        {/* Phase */}
                        <Cell border="r" center>
                          <EditableCell
                            type="select"
                            value={String(p.current_stage_id)}
                            options={stageOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "current_stage_id", v)}
                            display={<SolidChip color={stage.color} label={stage.name} width={104} />}
                          />
                        </Cell>

                        {/* Owner */}
                        <Cell border="r" center>
                          <EditableCell
                            type="select"
                            value={p.owner_id ? String(p.owner_id) : ""}
                            options={userOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "owner_id", v)}
                            display={
                              p.owner_name ? (
                                <Avatar name={p.owner_name} color={p.owner_color || "#71717a"} size={26} />
                              ) : (
                                <EmptyAvatar size={26} />
                              )
                            }
                          />
                        </Cell>

                        {/* Due Date */}
                        <Cell border="r" center>
                          <EditableCell
                            type="date"
                            value={dateInputValue(p.deadline)}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "deadline", v)}
                            display={<DueDateText ts={p.deadline} />}
                          />
                        </Cell>

                        {/* Priority */}
                        <Cell border="r" center>
                          <EditableCell
                            type="select"
                            value={p.priority}
                            options={priorityOptions}
                            disabled={!canEdit}
                            align="center"
                            onSave={(v) => updateProjectField(p.id, "priority", v)}
                            display={<PriorityChip priority={p.priority} />}
                          />
                        </Cell>

                        {/* Custom columns */}
                        {customColumns.map((c, i) => {
                          const v = colVals?.get(c.id) ?? null;
                          return (
                            <Cell key={c.id} border="r" center={c.type === "date" || c.type === "number"}>
                              <EditableCell
                                type={c.type}
                                value={v}
                                disabled={!canEdit}
                                align={c.type === "text" || c.type === "url" ? "left" : "center"}
                                placeholder="—"
                                onSave={(nv) => setCustomColumnValue(c.id, p.id, nv)}
                                display={
                                  v ? (
                                    c.type === "url" ? (
                                      <BriefLinkBadge url={v} />
                                    ) : c.type === "date" ? (
                                      <span className="text-[13px] text-ink-1 tabular-nums">
                                        {formatDate(Number(v))}
                                      </span>
                                    ) : (
                                      <span className="text-[13px] text-ink-1 truncate">{v}</span>
                                    )
                                  ) : (
                                    <span className="text-xs text-ink-3 italic">—</span>
                                  )
                                }
                              />
                            </Cell>
                          );
                        })}

                        <div></div>
                      </div>

                      {/* Subitems table — nested inside, indented, colored left bar */}
                      {expanded && (
                        <SubtasksBlock
                          projectId={p.id}
                          stage={stage}
                          tasks={projectSubs}
                          canEdit={canEdit}
                          statusOptions={statusOptions}
                          userOptions={userOptions}
                          subGridCols={subGridCols}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ===== Subtasks block =====

function SubtasksBlock({
  projectId,
  stage,
  tasks,
  canEdit,
  statusOptions,
  userOptions,
  subGridCols,
}: {
  projectId: number;
  stage: PipelineStage;
  tasks: TaskWithExtras[];
  canEdit: boolean;
  statusOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  subGridCols: string;
}) {
  return (
    <div className="border-t border-line">
      {/* indented wrapper with thick colored left bar */}
      <div className="pl-9 py-2">
        <div
          className="relative rounded-md overflow-hidden border border-line bg-bg-1"
          style={{
            borderLeft: `6px solid ${stage.color}`,
            boxShadow: "0 1px 0 rgba(15,17,26,0.02)",
          }}
        >
          {/* Sub header row */}
          <div
            className="grid items-center border-b border-line bg-bg-2/40 text-[11px] font-semibold text-ink-2 uppercase tracking-wide"
            style={{ gridTemplateColumns: subGridCols, minWidth: "fit-content" }}
          >
            <Cell border="r" center>
              <FakeCheckbox />
            </Cell>
            <SubHeaderCell label="Subitem" />
            <SubHeaderCell label="Task Status" center />
            <SubHeaderCell label="Designer" center />
            <SubHeaderCell label="Due Date" center />
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled
                className="size-8 grid place-items-center text-ink-3"
                title="Sub-columns coming in v1.6"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Subitem rows */}
          {tasks.length === 0 ? (
            <div className="px-4 py-3 text-xs text-ink-3">
              No tasks yet.{" "}
              <Link href={`/projects/${projectId}?tab=tasks`} className="text-accent hover:underline">
                Add tasks →
              </Link>
            </div>
          ) : (
            tasks.map((t, i) => (
              <div
                key={t.id}
                className={`grid items-stretch hover:bg-bg-2/40 transition ${
                  i > 0 ? "border-t border-line" : ""
                }`}
                style={{ gridTemplateColumns: subGridCols, minWidth: "fit-content" }}
              >
                <Cell border="r" center>
                  <FakeCheckbox />
                </Cell>
                <Cell border="r">
                  <div className="flex items-center gap-2 min-w-0 group/sub">
                    <div className="flex-1 min-w-0">
                      <EditableCell
                        type="text"
                        value={t.title}
                        disabled={!canEdit}
                        onSave={(v) => updateTaskField(t.id, "title", v)}
                        display={
                          <span className="text-[13px] text-ink-1 truncate">
                            <span className="text-ink-3 font-mono text-[10px] mr-1.5">
                              TASK {i + 1}:
                            </span>
                            {t.title}
                          </span>
                        }
                      />
                    </div>
                    <button
                      title="Add comment (coming soon)"
                      className="text-ink-3 hover:text-ink-1 shrink-0 opacity-0 group-hover/sub:opacity-100 transition"
                    >
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </Cell>
                <Cell border="r" center>
                  <EditableCell
                    type="select"
                    value={t.status}
                    options={statusOptions}
                    disabled={!canEdit}
                    align="center"
                    onSave={(v) => updateTaskField(t.id, "status", v)}
                    display={<TaskStatusCell status={t.status} />}
                  />
                </Cell>
                <Cell border="r" center>
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
                        <EmptyAvatar size={22} />
                      )
                    }
                  />
                </Cell>
                <Cell border="r" center>
                  <EditableCell
                    type="date"
                    value={dateInputValue(t.due_date)}
                    disabled={!canEdit}
                    align="center"
                    onSave={(v) => updateTaskField(t.id, "due_date", v)}
                    display={<DueDateText ts={t.due_date} small />}
                  />
                </Cell>
                <div></div>
              </div>
            ))
          )}

          {/* + Add subitem inline row */}
          {canEdit && (
            <AddSubitemRow
              projectId={projectId}
              subGridCols={subGridCols}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Inline-add subitem row — click to start, type title, Enter to save, Esc to cancel.
function AddSubitemRow({
  projectId,
  subGridCols,
}: {
  projectId: number;
  subGridCols: string;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const submit = (keepAdding: boolean) => {
    const t = title.trim();
    if (!t) {
      setAdding(false);
      setTitle("");
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("category", "project");
      fd.set("project_id", String(projectId));
      fd.set("title", t);
      fd.set("priority", "med");
      await createTask(fd);
      setTitle("");
      if (keepAdding) {
        // refocus next iteration
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        setAdding(false);
      }
    });
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full text-left border-t border-line"
      >
        <div
          className="grid items-stretch hover:bg-bg-2/40 transition"
          style={{ gridTemplateColumns: subGridCols, minWidth: "fit-content" }}
        >
          <Cell border="r" center>
            <FakeCheckbox disabled />
          </Cell>
          <div className="px-3 py-2.5 text-[13px] text-ink-3 hover:text-accent transition">
            + Add subitem
          </div>
          <div></div>
        </div>
      </button>
    );
  }

  return (
    <div className="border-t border-line">
      <div
        className={`grid items-stretch bg-bg-1 transition ${pending ? "opacity-60" : ""}`}
        style={{ gridTemplateColumns: subGridCols, minWidth: "fit-content" }}
      >
        <Cell border="r" center>
          <FakeCheckbox disabled />
        </Cell>
        <Cell border="r">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit(true); // save + keep adding next
              } else if (e.key === "Escape") {
                e.preventDefault();
                setAdding(false);
                setTitle("");
              } else if (e.key === "Tab") {
                // let tab work naturally
              }
            }}
            onBlur={() => submit(false)}
            placeholder="What needs doing? (Enter to save, Esc to cancel)"
            className="w-full text-[13px] bg-transparent border-none outline-none text-ink-0 placeholder:text-ink-3 px-1"
          />
        </Cell>
        <Cell border="r" center>
          <span className="inline-flex items-center justify-center text-[12px] font-semibold rounded-md py-1.5 px-3 bg-bg-3 text-ink-3 min-w-[120px]">
            Todo
          </span>
        </Cell>
        <Cell border="r" center>
          <EmptyAvatar size={22} />
        </Cell>
        <Cell border="r" center>
          <span className="text-[12px] text-ink-3 italic">—</span>
        </Cell>
        <div className="flex items-center justify-center gap-0.5 px-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              submit(true);
            }}
            title="Save (Enter)"
            className="size-6 grid place-items-center text-success hover:bg-bg-2 rounded transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setAdding(false);
              setTitle("");
            }}
            title="Cancel (Esc)"
            className="size-6 grid place-items-center text-ink-3 hover:bg-bg-2 hover:text-danger rounded transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Small UI primitives =====

function Cell({
  children,
  border,
  center,
}: {
  children: React.ReactNode;
  border?: "r";
  center?: boolean;
}) {
  return (
    <div
      className={`flex items-center px-3 py-2 ${center ? "justify-center" : ""} ${
        border === "r" ? "border-r border-line" : ""
      }`}
    >
      {children}
    </div>
  );
}

function HeaderCell({
  label,
  center,
  isLast,
}: {
  label: string;
  center?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2.5 border-r border-line ${
        center ? "justify-center" : ""
      }`}
    >
      <span className="text-[12px] font-semibold text-ink-1">{label}</span>
      <Info size={12} className="text-ink-3/60" />
    </div>
  );
}

function SubHeaderCell({ label, center }: { label: string; center?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 border-r border-line ${
        center ? "justify-center" : ""
      }`}
    >
      <span>{label}</span>
      <Info size={11} className="text-ink-3/60" />
    </div>
  );
}

function FakeCheckbox({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? "" : "Select (coming soon)"}
      className={`size-4 rounded border border-line-strong bg-bg-1 hover:border-accent transition ${
        disabled ? "opacity-40 cursor-default hover:border-line-strong" : ""
      }`}
    />
  );
}

function EmptyAvatar({ size }: { size: number }) {
  return (
    <div
      className="rounded-full border-2 border-dashed border-line grid place-items-center text-ink-3"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
      </svg>
    </div>
  );
}

function SolidChip({
  color,
  label,
  width,
}: {
  color: string;
  label: string;
  width?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center text-[12px] font-semibold rounded-md py-1.5 px-3"
      style={{
        background: color,
        color: "#fff",
        textShadow: "0 1px 0 rgba(0,0,0,0.18)",
        minWidth: width,
      }}
    >
      {label}
    </span>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    high: { label: "High", bg: "#ff7a59" },        // coral red-orange like screenshot
    med: { label: "Medium", bg: "#fdab3d" },       // amber
    low: { label: "Low", bg: "#9ca3af" },          // gray
  };
  const v = map[priority] ?? map.med;
  return <SolidChip color={v.bg} label={v.label} width={88} />;
}

function TaskStatusCell({ status }: { status: string }) {
  // For tasks: matches Monday's empty-gray "no value yet" look for Todo, colored for others
  if (status === "todo") {
    return (
      <span className="inline-flex items-center justify-center text-[12px] font-semibold rounded-md py-1.5 px-3 bg-bg-3 text-ink-2 min-w-[120px]">
        &nbsp;
      </span>
    );
  }
  const map: Record<string, { label: string; bg: string }> = {
    in_progress: { label: "Working on it", bg: "#fdab3d" },
    done: { label: "Done", bg: "#00c875" },
  };
  const v = map[status] ?? { label: status, bg: "#9ca3af" };
  return <SolidChip color={v.bg} label={v.label} width={120} />;
}

function BriefLinkBadge({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] text-ink-1 truncate bg-bg-3 rounded pl-2 pr-2.5 py-1 max-w-full"
      style={{ borderLeft: "3px solid #2563eb" }}
      title={url}
    >
      <Link2 size={11} className="shrink-0 text-info" />
      <span className="truncate">{display}</span>
    </span>
  );
}

function DueDateText({ ts, small }: { ts: number | null; small?: boolean }) {
  if (!ts) return <span className="text-xs text-ink-3 italic">—</span>;
  const rd = relativeDeadline(ts);
  return (
    <span
      className={`${small ? "text-[12px]" : "text-[13px]"} font-medium tabular-nums ${
        rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-1"
      }`}
    >
      {formatDate(ts)}
    </span>
  );
}
