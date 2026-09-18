import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { storyService } from "@/lib/services/storyService";
import { createUserStorySchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, featureId } = params;

    await requireProjectMember(user.id, projectId);
    const stories = await storyService.getProjectStories(projectId, { featureId });

    return successResponse(stories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, featureId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createUserStorySchema.parse({ ...body, featureId });

    const story = await storyService.createStory(projectId, user.id, validated);
    return successResponse(story, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
