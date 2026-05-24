// Version: 1.0
"use client";

import { useTransition } from "react";
import { Trash2, ChevronRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusPill, CategoryPill } from "./Pill";
import { relativeDeadline } from "@/lib/format";
import type { TaskWithExtras } from "@/lib/queries";
import { updateTaskStatus, deleteTask } from "@/app/(app)/projects/actions";
import Link from "next/link";

export function TaskCard({
  task,
  compact = false,
  showProject = false,
  canEdit = true,
}: {
  task: TaskWithExtras;
  compact?: boolean;
  showProject?: boolean;
  canEdit?: boolean;
}) {
  const [pending, start] = useTransition();
  const rd = relativeDeadline(task.due_date);

  return (
    <div
      className={`card p-3 group ${pending ? "opacity-50" : ""}`}
      style={{
        borderLeft: `3px solid ${
          task.priority === "high" ? "#ef4444" : task.priority === "med" ? "#3b82f6" : "#52525b"
        }`,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug">{task.title}</div>
          {task.description && !compact && (
            <div className="text-xs text-ink-2 mt-1 line-clamp-2">{task.description}</div>
          )}
          {showProject && task.category === "project" && task.project_id && (
            <Link
              href={`/projects/${task.project_id}`}
              className="text-[11px] text-ink-2 hover:text-accent transition mt-1 inline-flex items-center gap-1"
            >
              {task.project_name} <ChevronRight size={10} />
            </Link>
          )}
          {showProject && task.category !== "project" && (
            <div className="mt-1"><CategoryPill category={task.category} /></div>
          )}
        </div>
        {task.assignee_name && (
          <Avatar name={task.assignee_name} color={task.assignee_color || "#7c5cff"} size={22} />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <select
              defaultValue={task.status}
              disabled={pending}
              onChange={(e) => start(() => updateTaskStatus(task.id, e.target.value))}
              className="text-[11px] bg-bg-3 border border-line rounded px-1.5 py-0.5 text-ink-1 hover:bg-bg-4 transition cursor-pointer"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          ) : (
            <StatusPill status={task.status} />
          )}
          <span
            className={`text-[11px] font-medium ${
              rd.tone === "overdue" ? "text-danger" : rd.tone === "soon" ? "text-warn" : "text-ink-2"
            }`}
          >
            {rd.text}
          </span>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              if (confirm("Delete this task?")) start(() => deleteTask(task.id));
            }}
            className="text-ink-3 hover:text-danger transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
