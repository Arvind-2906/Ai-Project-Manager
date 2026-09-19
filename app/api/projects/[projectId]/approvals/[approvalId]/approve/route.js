import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { approvalService } from "@/lib/services/approvalService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, approvalId } = params;

    // Approving mutations requires PROJECT_MANAGER role or org OWNER/ADMIN authority
    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);

    const result = await approvalService.approveProposal(projectId, approvalId, user.id);
    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
