import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { riskService } from "@/lib/services/riskService";
import { updateRiskSchema } from "@/lib/validations/riskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId } = params;

    await requireProjectMember(user.id, projectId);
    const risk = await riskService.getRiskById(projectId, riskId);

    return successResponse(risk);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateRiskSchema.parse(body);

    const updated = await riskService.updateRisk(projectId, riskId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await riskService.deleteRisk(projectId, riskId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
