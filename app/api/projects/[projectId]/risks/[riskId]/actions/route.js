import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { riskService } from "@/lib/services/riskService";
import { createRiskActionSchema } from "@/lib/validations/riskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId } = params;

    await requireProjectMember(user.id, projectId);
    const actions = await riskService.getRiskActions(projectId, riskId);

    return successResponse(actions);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createRiskActionSchema.parse(body);

    const action = await riskService.createRiskAction(projectId, riskId, user.id, validated);
    return successResponse(action, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
