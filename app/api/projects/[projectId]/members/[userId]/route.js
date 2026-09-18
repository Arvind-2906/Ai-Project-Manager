import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { projectService } from "@/lib/services/projectService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, userId: targetUserId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await projectService.removeProjectMember(projectId, user.id, targetUserId);

    return successResponse({
      message: "Member successfully removed from project.",
      ...result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
