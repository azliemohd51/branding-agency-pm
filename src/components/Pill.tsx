// Version: 1.0
export function StagePill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="pill"
      style={{ background: `${color}22`, color, borderColor: `${color}44` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "#22c55e" },
    on_hold: { label: "On hold", color: "#f59e0b" },
    completed: { label: "Completed", color: "#3b82f6" },
    cancelled: { label: "Cancelled", color: "#71717a" },
    draft: { label: "Draft", color: "#71717a" },
    in_review: { label: "In review", color: "#3b82f6" },
    revision_requested: { label: "Revisions", color: "#f59e0b" },
    approved: { label: "Approved", color: "#22c55e" },
    todo: { label: "Todo", color: "#71717a" },
    in_progress: { label: "In progress", color: "#3b82f6" },
    done: { label: "Done", color: "#22c55e" },
    low: { label: "Low", color: "#52525b" },
    med: { label: "Med", color: "#3b82f6" },
    high: { label: "High", color: "#ef4444" },
  };
  const v = map[status] ?? { label: status, color: "#71717a" };
  return (
    <span className="pill" style={{ background: `${v.color}1f`, color: v.color, borderColor: `${v.color}44` }}>
      {v.label}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  const map: Record<string, { label: string; color: string }> = {
    project: { label: "Project", color: "#7c5cff" },
    social_media: { label: "Social", color: "#ec4899" },
    adhoc: { label: "Ad-hoc", color: "#f59e0b" },
  };
  const v = map[category] ?? { label: category, color: "#71717a" };
  return (
    <span className="chip" style={{ background: `${v.color}1f`, color: v.color }}>
      {v.label}
    </span>
  );
}
