import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { storyService } from "@/lib/services/storyService";
import { updateUserStorySchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, storyId } = params;

    await requireProjectMember(user.id, projectId);
    const story = await storyService.getStoryById(projectId, storyId);

    return successResponse(story);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, storyId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateUserStorySchema.parse(body);

    const updated = await storyService.updateStory(projectId, storyId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, storyId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await storyService.deleteStory(projectId, storyId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
