import { requireAuth, requireOrganizationMember, requireOrganizationRole } from "@/lib/utils/permissions";
import { organizationService } from "@/lib/services/organizationService";
import { addOrganizationMemberSchema } from "@/lib/validations/organizationSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationMember(user.id, organizationId);
    const organization = await organizationService.getOrganizationById(organizationId);

    return successResponse(organization.members);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationRole(user.id, organizationId, ["OWNER", "ADMIN"]);
    const body = await request.json();
    const validated = addOrganizationMemberSchema.parse(body);

    const newMember = await organizationService.addOrganizationMember(organizationId, validated);
    return successResponse(newMember, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
