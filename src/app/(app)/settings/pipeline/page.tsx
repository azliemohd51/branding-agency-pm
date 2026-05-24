// Version: 1.0
import { requireRole } from "@/lib/session";
import { listStages } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { StageRow } from "./StageRow";
import { addStage } from "@/app/(app)/projects/actions";
import { Plus } from "lucide-react";

export default async function PipelineSettingsPage() {
  const user = await requireRole("admin");
  const stages = listStages();
  // count projects per stage so UI can show if delete is allowed
  const counts = new Map<number, number>();
  const rows = getDb()
    .prepare("SELECT current_stage_id as sid, COUNT(*) as c FROM projects GROUP BY current_stage_id")
    .all() as { sid: number; c: number }[];
  for (const r of rows) counts.set(r.sid, r.c);

  return (
    <>
      <TopBar user={user} title="Pipeline settings" subtitle="Customize your studio's project stages" />
      <main className="p-6 max-w-3xl mx-auto w-full">
        <PageHeader
          title="Pipeline"
          subtitle="The stages every project moves through. Rename, recolor, reorder, or add stages to match your studio's workflow."
        />

        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-line bg-bg-1 text-[10px] uppercase tracking-widest text-ink-3 grid grid-cols-[40px_1fr_120px_100px_80px_auto] gap-3 items-center">
            <span>Order</span>
            <span>Name</span>
            <span>Color</span>
            <span>Terminal</span>
            <span>Projects</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-line">
            {stages.map((s, i) => (
              <StageRow
                key={s.id}
                stage={s}
                index={i}
                total={stages.length}
                projectCount={counts.get(s.id) ?? 0}
              />
            ))}
          </div>
        </div>

        <form action={addStage} className="card p-5 mt-5 space-y-3">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Plus size={14} /> Add a new stage
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input name="name" required placeholder="e.g. Client Review" className="input text-sm md:col-span-2" />
            <input name="color" type="color" defaultValue="#7c5cff" className="input text-sm h-[38px] cursor-pointer" />
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-2">
            <input type="checkbox" name="is_terminal" className="accent-accent" />
            Terminal stage (project is finished — e.g. Completed, Cancelled)
          </label>
          <button type="submit" className="btn-primary text-sm">Add stage</button>
        </form>
      </main>
    </>
  );
}
