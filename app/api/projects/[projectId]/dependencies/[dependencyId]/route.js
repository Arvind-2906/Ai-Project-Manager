import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { dependencyService } from "@/lib/services/dependencyService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, dependencyId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const result = await dependencyService.deleteDependency(projectId, dependencyId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
