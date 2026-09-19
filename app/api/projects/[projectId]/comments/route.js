import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { commentService } from "@/lib/services/commentService";
import { createCommentSchema } from "@/lib/validations/commentSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      taskId: searchParams.get("taskId") || undefined,
    };

    const comments = await commentService.getProjectComments(projectId, filters);
    return successResponse(comments);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    const comment = await commentService.createComment(projectId, user.id, validated);
    return successResponse(comment, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
