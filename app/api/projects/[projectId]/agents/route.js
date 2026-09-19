import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { agentService } from "@/lib/services/agentService";
import { registerAgentSchema } from "@/lib/validations/agentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const agents = await agentService.getProjectAgents(projectId);

    return successResponse(agents);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = registerAgentSchema.parse(body);

    const agent = await agentService.registerAgent(projectId, user.id, validated);
    return successResponse(agent, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
