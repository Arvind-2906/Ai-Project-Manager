import { requireAuth, requireOrganizationRole } from "@/lib/utils/permissions";
import { organizationService } from "@/lib/services/organizationService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId, userId: targetUserId } = params;

    await requireOrganizationRole(user.id, organizationId, ["OWNER", "ADMIN"]);
    await organizationService.removeOrganizationMember(organizationId, targetUserId, user.id);

    return successResponse({
      message: "Member successfully removed from organization.",
      organizationId,
      userId: targetUserId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
