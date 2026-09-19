import { requireAuth } from "@/lib/utils/permissions";
import { notificationService } from "@/lib/services/notificationService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { notificationId } = params;

    let read = true;
    try {
      const body = await request.json();
      if (body?.read !== undefined) {
        read = Boolean(body.read);
      }
    } catch (e) {
      // Defaults to read = true
    }

    const updated = await notificationService.updateNotificationRead(
      notificationId,
      user.id,
      read
    );
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
