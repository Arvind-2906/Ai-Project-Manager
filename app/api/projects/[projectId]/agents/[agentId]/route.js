import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { agentService } from "@/lib/services/agentService";
import { updateAgentSchema } from "@/lib/validations/agentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, agentId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = updateAgentSchema.parse(body);

    const updated = await agentService.updateAgent(projectId, agentId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
