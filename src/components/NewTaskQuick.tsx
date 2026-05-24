// Version: 1.0
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTask } from "@/app/(app)/projects/actions";

export function NewTaskQuick({
  designers,
  projects,
  defaultAssignee,
}: {
  designers: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  defaultAssignee?: number;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"project" | "social_media" | "adhoc">("project");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} /> New task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="text-base font-bold tracking-tight">New task</h3>
          <button onClick={() => setOpen(false)} className="btn-ghost"><X size={16} /></button>
        </div>
        <form
          action={async (fd) => {
            await createTask(fd);
            setOpen(false);
          }}
          className="p-4 space-y-3"
        >
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { v: "project", label: "Project", color: "#7c5cff" },
                { v: "social_media", label: "Social", color: "#ec4899" },
                { v: "adhoc", label: "Ad-hoc", color: "#f59e0b" },
              ] as const).map((c) => (
                <button
                  type="button"
                  key={c.v}
                  onClick={() => setCategory(c.v)}
                  className={`text-xs px-2 py-2 rounded-lg border transition ${
                    category === c.v
                      ? "border-line-strong"
                      : "border-line bg-bg-3 text-ink-2 hover:bg-bg-4"
                  }`}
                  style={
                    category === c.v
                      ? { background: `${c.color}1f`, color: c.color, borderColor: `${c.color}66` }
                      : {}
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="category" value={category} />
          </div>

          {category === "project" && (
            <div>
              <label className="label">Project</label>
              <select name="project_id" required className="input text-sm">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Title</label>
            <input name="title" required autoFocus className="input text-sm" placeholder="What needs doing?" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={2} className="input text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Assignee</label>
              <select name="assignee_id" defaultValue={defaultAssignee} className="input text-sm">
                <option value="">Unassigned</option>
                {designers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" defaultValue="med" className="input text-sm">
                <option value="low">Low</option>
                <option value="med">Med</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Due date</label>
            <input type="date" name="due_date" className="input text-sm" />
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-line">
            <button type="submit" className="btn-primary flex-1">Create task</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
