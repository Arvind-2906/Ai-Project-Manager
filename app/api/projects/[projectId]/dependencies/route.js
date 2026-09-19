import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { dependencyService } from "@/lib/services/dependencyService";
import { createDependencySchema } from "@/lib/validations/dependencySchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const dependencies = await dependencyService.getProjectDependencies(projectId);

    return successResponse(dependencies);
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
    const validated = createDependencySchema.parse(body);

    const dependency = await dependencyService.createDependency(projectId, user.id, validated);
    return successResponse(dependency, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
