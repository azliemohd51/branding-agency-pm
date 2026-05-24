// Version: 1.0
"use client";

import { useTransition } from "react";
import { Avatar } from "./Avatar";
import { Check, Circle } from "lucide-react";
import { addFeedback, toggleFeedback } from "@/app/(app)/projects/actions";
import type { FeedbackWithExtras } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export function FeedbackThread({
  feedback,
  projectId,
  canModerate,
}: {
  feedback: FeedbackWithExtras[];
  projectId: number;
  canModerate: boolean;
}) {
  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          fd.set("project_id", String(projectId));
          await addFeedback(fd);
        }}
        className="card p-4"
      >
        <textarea
          name="comment"
          rows={2}
          required
          placeholder="Share feedback, ask a question, or leave a note…"
          className="input resize-none text-sm border-none bg-transparent px-0 focus:ring-0"
        />
        <div className="flex items-center justify-end mt-2 pt-3 border-t border-line">
          <button type="submit" className="btn-primary text-xs">Post</button>
        </div>
      </form>

      {feedback.length === 0 ? (
        <div className="text-center text-sm text-ink-3 py-8">No feedback yet.</div>
      ) : (
        <div className="space-y-2">
          {feedback.map((f) => (
            <FeedbackItem key={f.id} f={f} canModerate={canModerate} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackItem({ f, canModerate }: { f: FeedbackWithExtras; canModerate: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className={`card p-4 ${pending ? "opacity-50" : ""} ${f.resolved ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar name={f.user_name || "?"} color={f.user_color || "#71717a"} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{f.user_name || "Unknown"}</span>
            {f.user_role && (
              <span className="text-[10px] uppercase tracking-widest text-ink-3">{f.user_role}</span>
            )}
            <span className="text-ink-3">·</span>
            <span className="text-xs text-ink-2">{formatDate(f.created_at)}</span>
            {f.deliverable_name && (
              <>
                <span className="text-ink-3">·</span>
                <span className="text-xs text-accent">on {f.deliverable_name}</span>
              </>
            )}
          </div>
          <div className="text-sm text-ink-1 whitespace-pre-wrap leading-relaxed">{f.comment}</div>
        </div>
        {canModerate && (
          <button
            disabled={pending}
            onClick={() => start(() => toggleFeedback(f.id))}
            className="text-ink-3 hover:text-success transition"
            title={f.resolved ? "Mark unresolved" : "Mark resolved"}
          >
            {f.resolved ? <Check size={16} className="text-success" /> : <Circle size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
