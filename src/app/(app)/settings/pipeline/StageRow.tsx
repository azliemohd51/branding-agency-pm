// Version: 1.0
"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Trash2, Save, X } from "lucide-react";
import { updateStage, moveStage, deleteStage } from "@/app/(app)/projects/actions";
import type { PipelineStage } from "@/lib/types";

export function StageRow({
  stage,
  index,
  total,
  projectCount,
}: {
  stage: PipelineStage;
  index: number;
  total: number;
  projectCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateStage(fd);
          setEditing(false);
        }}
        className="grid grid-cols-[40px_1fr_120px_100px_80px_auto] gap-3 items-center px-4 py-3 bg-bg-2"
      >
        <input type="hidden" name="id" value={stage.id} />
        <span className="text-xs text-ink-3 font-mono">#{stage.position}</span>
        <input name="name" defaultValue={stage.name} required className="input text-sm py-1.5" />
        <input
          name="color"
          type="color"
          defaultValue={stage.color}
          className="input h-[34px] cursor-pointer p-1"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-2">
          <input type="checkbox" name="is_terminal" defaultChecked={!!stage.is_terminal} className="accent-accent" />
          Final
        </label>
        <span className="text-xs text-ink-2">{projectCount}</span>
        <div className="flex items-center gap-1 justify-end">
          <button type="submit" className="btn-primary text-xs">
            <Save size={12} /> Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
            <X size={14} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`grid grid-cols-[40px_1fr_120px_100px_80px_auto] gap-3 items-center px-4 py-3 hover:bg-bg-2 transition ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-0.5">
        <button
          disabled={index === 0 || pending}
          onClick={() => start(() => moveStage(stage.id, "up"))}
          className="size-5 grid place-items-center text-ink-3 hover:text-ink-0 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronUp size={14} />
        </button>
        <button
          disabled={index === total - 1 || pending}
          onClick={() => start(() => moveStage(stage.id, "down"))}
          className="size-5 grid place-items-center text-ink-3 hover:text-ink-0 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: stage.color }} />
        <span className="font-medium text-sm">{stage.name}</span>
      </div>
      <div>
        <span
          className="inline-block size-5 rounded border border-line"
          style={{ background: stage.color }}
          title={stage.color}
        />
      </div>
      <div className="text-xs text-ink-2">{stage.is_terminal ? "Yes" : "—"}</div>
      <div className="text-xs text-ink-2">{projectCount}</div>
      <div className="flex items-center gap-1 justify-end">
        <button onClick={() => setEditing(true)} className="btn-ghost text-xs">Edit</button>
        <button
          disabled={pending || projectCount > 0}
          onClick={() => {
            if (!confirm(`Delete stage "${stage.name}"?`)) return;
            setError(null);
            start(async () => {
              try {
                await deleteStage(stage.id);
              } catch (e: any) {
                setError(e.message ?? "Could not delete.");
              }
            });
          }}
          className={`btn-ghost text-xs ${projectCount > 0 ? "opacity-30" : "hover:text-danger"}`}
          title={projectCount > 0 ? "Move projects off this stage first" : "Delete"}
        >
          <Trash2 size={13} />
        </button>
      </div>
      {error && <div className="col-span-full text-xs text-danger pl-12">{error}</div>}
    </div>
  );
}
