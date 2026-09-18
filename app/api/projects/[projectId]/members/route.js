import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { projectService } from "@/lib/services/projectService";
import { addProjectMemberSchema } from "@/lib/validations/projectSchemas";
import { handleApiError, successResponse, ValidationError } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const members = await projectService.getProjectMembers(projectId);

    return successResponse(members);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = addProjectMemberSchema.parse(body);

    const newMember = await projectService.addProjectMember(projectId, user.id, validated);
    return successResponse(newMember, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);

    const { searchParams } = new URL(request.url);
    let targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      try {
        const body = await request.json();
        targetUserId = body?.userId;
      } catch (e) {
        // No body provided
      }
    }

    if (!targetUserId) {
      throw new ValidationError("Target user ID is required to remove member.");
    }

    const result = await projectService.removeProjectMember(projectId, user.id, targetUserId);
    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
