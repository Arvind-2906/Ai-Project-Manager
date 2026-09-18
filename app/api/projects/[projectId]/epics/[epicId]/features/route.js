import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { featureService } from "@/lib/services/featureService";
import { createFeatureSchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, epicId } = params;

    await requireProjectMember(user.id, projectId);
    const features = await featureService.getFeaturesByEpic(projectId, epicId);

    return successResponse(features);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, epicId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createFeatureSchema.parse({ ...body, epicId });

    const feature = await featureService.createFeature(projectId, epicId, user.id, validated);
    return successResponse(feature, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
