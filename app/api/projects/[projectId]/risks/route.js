import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { riskService } from "@/lib/services/riskService";
import { createRiskSchema } from "@/lib/validations/riskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      severity: searchParams.get("severity") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const risks = await riskService.getProjectRisks(projectId, filters);
    return successResponse(risks);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createRiskSchema.parse(body);

    const risk = await riskService.createRisk(projectId, user.id, validated);
    return successResponse(risk, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
