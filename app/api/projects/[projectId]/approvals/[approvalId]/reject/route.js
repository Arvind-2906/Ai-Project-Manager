import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { approvalService } from "@/lib/services/approvalService";
import { rejectApprovalSchema } from "@/lib/validations/approvalSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, approvalId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);

    let reason = null;
    try {
      const body = await request.json();
      const validated = rejectApprovalSchema.parse(body);
      reason = validated.reason || null;
    } catch (e) {
      // Reason is optional
    }

    const result = await approvalService.rejectProposal(projectId, approvalId, user.id, reason);
    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
