// Version: 1.0
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTask } from "@/app/(app)/projects/actions";

export function NewTaskInline({
  projectId,
  designers,
}: {
  projectId: number;
  designers: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full p-3 border border-dashed border-line text-ink-2 hover:text-ink-0 hover:border-line-strong hover:bg-bg-2 transition rounded-lg text-sm flex items-center justify-center gap-1.5"
      >
        <Plus size={14} /> Add task
      </button>
    );
  return (
    <form
      action={async (fd) => {
        await createTask(fd);
        setOpen(false);
      }}
      className="card p-3 space-y-2"
    >
      <input type="hidden" name="category" value="project" />
      <input type="hidden" name="project_id" value={projectId} />
      <input
        name="title"
        required
        autoFocus
        placeholder="Task title…"
        className="input text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select name="assignee_id" className="input text-xs py-1.5">
          <option value="">Unassigned</option>
          {designers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select name="priority" defaultValue="med" className="input text-xs py-1.5">
          <option value="low">Low</option>
          <option value="med">Med</option>
          <option value="high">High</option>
        </select>
      </div>
      <input type="date" name="due_date" className="input text-xs py-1.5" />
      <div className="flex items-center gap-1.5">
        <button type="submit" className="btn-primary text-xs flex-1">Add task</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost"><X size={14} /></button>
      </div>
    </form>
  );
}
