import { requireAuth } from "@/lib/utils/permissions";
import { organizationService } from "@/lib/services/organizationService";
import { createOrganizationSchema } from "@/lib/validations/organizationSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const organizations = await organizationService.getUserOrganizations(user.id);
    return successResponse(organizations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json();
    const validated = createOrganizationSchema.parse(body);

    const organization = await organizationService.createOrganization(user.id, validated);
    return successResponse(organization, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
