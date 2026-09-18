import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { storyService } from "@/lib/services/storyService";
import { createUserStorySchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      featureId: searchParams.get("featureId") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const stories = await storyService.getProjectStories(projectId, filters);
    return successResponse(stories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createUserStorySchema.parse(body);

    const story = await storyService.createStory(projectId, user.id, validated);
    return successResponse(story, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
