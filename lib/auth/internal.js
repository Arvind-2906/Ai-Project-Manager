import { AuthenticationError } from "./errors";
import { isInternalServiceRequest } from "./session";

/**
 * Validates that an incoming request originates from the internal Python AI microservice.
 * Enforces the presence and correctness of the x-internal-secret header.
 *
 * @param {Request} request Incoming Next.js API Request
 * @throws {AuthenticationError} If internal secret is missing or invalid
 */
export function validateInternalServiceRequest(request) {
  if (!isInternalServiceRequest(request)) {
    throw new AuthenticationError(
      "Invalid or missing internal service secret header."
    );
  }
  return true;
}
