// Version: 1.0
// Server-side wrapper that binds the advance action to the project id.
import { advanceStage } from "@/app/(app)/projects/actions";
import { PipelineBar } from "./PipelineBar";
import type { PipelineStage } from "@/lib/types";

export function PipelineBarServer({
  stages,
  currentStageId,
  projectId,
  canEdit,
}: {
  stages: PipelineStage[];
  currentStageId: number;
  projectId: number;
  canEdit: boolean;
}) {
  async function onAdvance(stageId: number) {
    "use server";
    await advanceStage(projectId, stageId);
  }
  return (
    <PipelineBar
      stages={stages}
      currentStageId={currentStageId}
      onAdvance={canEdit ? onAdvance : undefined}
      canEdit={canEdit}
    />
  );
}
