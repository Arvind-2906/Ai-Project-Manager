import { requireAuth, requireOrganizationMember, requireOrganizationRole } from "@/lib/utils/permissions";
import { organizationService } from "@/lib/services/organizationService";
import { updateOrganizationSchema } from "@/lib/validations/organizationSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationMember(user.id, organizationId);
    const organization = await organizationService.getOrganizationById(organizationId);

    return successResponse(organization);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationRole(user.id, organizationId, ["OWNER", "ADMIN"]);
    const body = await request.json();
    const validated = updateOrganizationSchema.parse(body);

    const updated = await organizationService.updateOrganization(organizationId, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
