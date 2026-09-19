import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { agentService } from "@/lib/services/agentService";
import { updateAgentRunSchema } from "@/lib/validations/agentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, runId } = params;

    await requireProjectMember(user.id, projectId);
    const body = await request.json();
    const validated = updateAgentRunSchema.parse(body);

    const updated = await agentService.updateAgentRun(projectId, runId, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
