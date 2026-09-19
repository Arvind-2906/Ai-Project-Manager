import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { getProjectActivities } from "@/lib/services/activityService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      actorType: searchParams.get("actorType") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
    };

    const pagination = {
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    };

    const { activities, pagination: meta } = await getProjectActivities(
      projectId,
      filters,
      pagination
    );

    return successResponse(activities, 200, meta);
  } catch (err) {
    return handleApiError(err);
  }
}
