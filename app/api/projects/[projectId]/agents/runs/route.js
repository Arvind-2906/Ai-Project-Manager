import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { agentService } from "@/lib/services/agentService";
import { createAgentRunSchema } from "@/lib/validations/agentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      agentId: searchParams.get("agentId") || undefined,
      status: searchParams.get("status") || undefined,
      workflowId: searchParams.get("workflowId") || undefined,
    };

    const runs = await agentService.getAgentRuns(projectId, filters);
    return successResponse(runs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const body = await request.json();
    const validated = createAgentRunSchema.parse(body);

    const run = await agentService.createAgentRun(projectId, validated);
    return successResponse(run, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
