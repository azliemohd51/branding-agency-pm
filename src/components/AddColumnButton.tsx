// Version: 1.4
"use client";

import { useState } from "react";
import { Plus, X, Type, Hash, Calendar, Link2 } from "lucide-react";
import { addCustomColumn, deleteCustomColumn } from "@/app/(app)/projects/actions";

const TYPES = [
  { value: "text", label: "Text", icon: Type, desc: "Free-form text" },
  { value: "number", label: "Number", icon: Hash, desc: "Numeric value" },
  { value: "date", label: "Date", icon: Calendar, desc: "Calendar date" },
  { value: "url", label: "URL", icon: Link2, desc: "Web link" },
] as const;

export function AddColumnButton({ canManage }: { canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"text" | "number" | "date" | "url">("text");

  if (!canManage) {
    return (
      <div
        title="Only admins can add columns"
        className="size-8 grid place-items-center text-ink-3"
      >
        <Plus size={14} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Add column"
        className="size-8 grid place-items-center text-ink-2 hover:text-accent hover:bg-bg-2 rounded transition"
      >
        <Plus size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div>
                <h3 className="text-base font-bold tracking-tight">Add column</h3>
                <p className="text-xs text-ink-2">Adds a column to every project row.</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost"><X size={16} /></button>
            </div>

            <form
              action={async (fd) => {
                await addCustomColumn(fd);
                setOpen(false);
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="label">Column name</label>
                <input
                  name="name"
                  required
                  autoFocus
                  className="input text-sm"
                  placeholder="e.g. Estimated hours, Folder, Notion link"
                />
              </div>

              <div>
                <label className="label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = type === t.value;
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition ${
                          active
                            ? "border-accent bg-accent/10 text-ink-0 ring-1 ring-accent/40"
                            : "border-line bg-bg-1 text-ink-1 hover:bg-bg-2"
                        }`}
                      >
                        <Icon size={16} className={active ? "text-accent" : "text-ink-2"} />
                        <div>
                          <div className="text-sm font-semibold">{t.label}</div>
                          <div className="text-[11px] text-ink-3">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="type" value={type} />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <button type="submit" className="btn-primary flex-1">Add column</button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteColumnButton({ columnId }: { columnId: number }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this column and all its values?")) {
          void deleteCustomColumn(columnId);
        }
      }}
      title="Delete column"
      className="text-ink-3 hover:text-danger transition opacity-0 group-hover/colhead:opacity-100"
    >
      <X size={12} />
    </button>
  );
}
