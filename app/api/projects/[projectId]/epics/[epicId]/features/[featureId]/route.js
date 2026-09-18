import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { featureService } from "@/lib/services/featureService";
import { updateFeatureSchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, featureId } = params;

    await requireProjectMember(user.id, projectId);
    const feature = await featureService.getFeatureById(projectId, featureId);

    return successResponse(feature);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, featureId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateFeatureSchema.parse(body);

    const updated = await featureService.updateFeature(projectId, featureId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, featureId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await featureService.deleteFeature(projectId, featureId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
