import { requireAuth, requireProjectMember } from "@/lib/utils/permissions";
import { approvalService } from "@/lib/services/approvalService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, approvalId } = params;

    await requireProjectMember(user.id, projectId);
    const approval = await approvalService.getApprovalById(projectId, approvalId);

    return successResponse(approval);
  } catch (err) {
    return handleApiError(err);
  }
}
