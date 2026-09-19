import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { approvalService } from "@/lib/services/approvalService";
import { createApprovalSchema } from "@/lib/validations/approvalSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") || undefined,
    };

    const approvals = await approvalService.getProjectApprovals(projectId, filters);
    return successResponse(approvals);
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
    const validated = createApprovalSchema.parse(body);

    const approval = await approvalService.createApproval(projectId, user.id, validated);
    return successResponse(approval, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
