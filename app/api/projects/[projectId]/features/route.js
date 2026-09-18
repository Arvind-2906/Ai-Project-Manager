import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { featureService } from "@/lib/services/featureService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      epicId: searchParams.get("epicId") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const features = await featureService.getProjectFeatures(projectId, filters);
    return successResponse(features);
  } catch (err) {
    return handleApiError(err);
  }
}
