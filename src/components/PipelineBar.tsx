// Version: 1.0
"use client";

import { Check } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { useTransition } from "react";

export function PipelineBar({
  stages,
  currentStageId,
  onAdvance,
  canEdit,
}: {
  stages: PipelineStage[];
  currentStageId: number;
  onAdvance?: (stageId: number) => Promise<void> | void;
  canEdit?: boolean;
}) {
  const [pending, start] = useTransition();
  const currentIndex = stages.findIndex((s) => s.id === currentStageId);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-2">Pipeline</div>
          <div className="text-sm font-semibold mt-0.5">
            Stage {currentIndex + 1} of {stages.length}:{" "}
            <span style={{ color: stages[currentIndex]?.color }}>
              {stages[currentIndex]?.name}
            </span>
          </div>
        </div>
        {canEdit && currentIndex < stages.length - 1 && (
          <button
            disabled={pending}
            onClick={() => start(() => { void onAdvance?.(stages[currentIndex + 1].id); })}
            className="btn-secondary text-xs"
          >
            Advance →
          </button>
        )}
      </div>

      <div className="flex items-center">
        {stages.map((s, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          return (
            <div key={s.id} className="flex-1 flex items-center last:flex-none">
              <button
                disabled={!canEdit || pending}
                onClick={() => canEdit && start(() => { void onAdvance?.(s.id); })}
                className="flex flex-col items-center gap-2 group"
                style={{ minWidth: 60 }}
              >
                <div
                  className="size-8 rounded-full grid place-items-center transition-all"
                  style={{
                    background: isPast || isCurrent ? s.color : "transparent",
                    border: `2px solid ${isFuture ? "#cdd1dc" : s.color}`,
                    boxShadow: isCurrent ? `0 0 0 4px ${s.color}33, 0 0 16px ${s.color}66` : "none",
                  }}
                >
                  {isPast && <Check size={14} className="text-white" />}
                  {isCurrent && <span className="size-2 rounded-full bg-white" />}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest font-medium text-center whitespace-nowrap ${
                    isCurrent ? "text-ink-0" : isPast ? "text-ink-1" : "text-ink-3"
                  }`}
                >
                  {s.name}
                </div>
              </button>
              {i < stages.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-5 rounded"
                  style={{
                    background: isPast
                      ? s.color
                      : "linear-gradient(to right, #d1d5db, #e5e7eb)",
                    opacity: isPast ? 0.8 : 0.7,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
