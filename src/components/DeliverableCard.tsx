// Version: 1.0
"use client";

import { useState, useTransition } from "react";
import { ExternalLink, FileText, Plus, X } from "lucide-react";
import { StatusPill } from "./Pill";
import { addRevision, updateDeliverableStatus } from "@/app/(app)/projects/actions";
import type { DeliverableWithExtras } from "@/lib/queries";

const TYPE_LABEL: Record<string, string> = {
  logo: "Logo",
  guidelines: "Guidelines",
  business_card: "Business card",
  social: "Social kit",
  packaging: "Packaging",
  web: "Web mockup",
  signage: "Signage",
  other: "Other",
};

export function DeliverableCard({
  d,
  canEdit,
  canApprove,
}: {
  d: DeliverableWithExtras;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card card-hover p-4 text-left group block w-full"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="size-9 rounded-lg bg-bg-3 grid place-items-center shrink-0 text-ink-2 group-hover:text-accent transition">
            <FileText size={18} />
          </div>
          <StatusPill status={d.status} />
        </div>
        <div className="font-semibold text-sm group-hover:text-accent transition truncate">
          {d.name}
        </div>
        <div className="text-[11px] uppercase tracking-widest text-ink-3 mt-0.5">
          {TYPE_LABEL[d.type] ?? d.type} · v{d.current_version}
        </div>
        {d.feedback_count > 0 && (
          <div className="text-[11px] text-ink-2 mt-2">{d.feedback_count} comment{d.feedback_count === 1 ? "" : "s"}</div>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="card max-w-2xl w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-line">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-ink-3">
                  {TYPE_LABEL[d.type] ?? d.type} · v{d.current_version}
                </div>
                <h3 className="text-lg font-bold tracking-tight mt-0.5">{d.name}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              {d.latest_url && (
                <div className="surface-2 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-ink-2 mb-1">Latest</div>
                  <a
                    href={d.latest_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {d.latest_url} <ExternalLink size={12} />
                  </a>
                  {d.latest_notes && <div className="text-sm text-ink-1 mt-2">{d.latest_notes}</div>}
                </div>
              )}

              {/* Status controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StatusPill status={d.status} />
                </div>
                <div className="flex items-center gap-1.5">
                  {canApprove && d.status !== "approved" && (
                    <button
                      disabled={pending}
                      onClick={() => start(() => updateDeliverableStatus(d.id, "approved"))}
                      className="btn-primary text-xs"
                    >
                      Approve
                    </button>
                  )}
                  {canApprove && d.status !== "revision_requested" && (
                    <button
                      disabled={pending}
                      onClick={() => start(() => updateDeliverableStatus(d.id, "revision_requested"))}
                      className="btn-secondary text-xs"
                    >
                      Request revisions
                    </button>
                  )}
                  {canEdit && d.status !== "in_review" && (
                    <button
                      disabled={pending}
                      onClick={() => start(() => updateDeliverableStatus(d.id, "in_review"))}
                      className="btn-secondary text-xs"
                    >
                      Send to review
                    </button>
                  )}
                </div>
              </div>

              {canEdit && (
                <form
                  action={async (fd) => {
                    await addRevision(fd);
                    setOpen(false);
                  }}
                  className="surface-2 p-4 space-y-3"
                >
                  <input type="hidden" name="deliverable_id" value={d.id} />
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Plus size={14} /> Post v{d.current_version + 1}
                  </div>
                  <input
                    name="file_url"
                    placeholder="Figma / Drive / Notion URL"
                    className="input text-sm"
                  />
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="What changed in this revision?"
                    className="input resize-none text-sm"
                  />
                  <button type="submit" className="btn-primary text-xs w-full">
                    Post revision
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
