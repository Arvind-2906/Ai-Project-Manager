import { requireAuth } from "@/lib/utils/permissions";
import { notificationService } from "@/lib/services/notificationService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function POST(request) {
  try {
    const { user } = await requireAuth(request);

    let projectId = null;
    try {
      const body = await request.json();
      projectId = body?.projectId || null;
    } catch (e) {
      // Optional body
    }

    const result = await notificationService.markAllAsRead(user.id, projectId);
    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
