import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { commentService } from "@/lib/services/commentService";
import { updateCommentSchema } from "@/lib/validations/commentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, commentId } = params;

    await requireProjectMember(user.id, projectId);
    const body = await request.json();
    const validated = updateCommentSchema.parse(body);

    const updated = await commentService.updateComment(
      projectId,
      commentId,
      user.id,
      validated
    );
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, commentId } = params;

    const { projectMember, orgMember } = await requireProjectMember(user.id, projectId);
    const isProjectManager =
      projectMember?.role === "PROJECT_MANAGER" ||
      orgMember?.role === "OWNER" ||
      orgMember?.role === "ADMIN";

    const result = await commentService.deleteComment(
      projectId,
      commentId,
      user.id,
      isProjectManager
    );
    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
