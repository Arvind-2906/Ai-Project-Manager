import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Authentication required. Please sign in.") {
    super(message, 401, "UNAUTHENTICATED");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Invalid request payload.", details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource conflict.") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * Centralized API error response handler
 */
export function handleApiError(error) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error handling
  if (error?.name === "ZodError") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
      },
      { status: 422 }
    );
  }

  console.error("Unhandled API Error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred."
            : error?.message || "An unexpected error occurred.",
      },
    },
    { status: 500 }
  );
}

/**
 * Standard API success response builder
 */
export function successResponse(data, status = 200, pagination = null) {
  const body = {
    success: true,
    data,
  };
  if (pagination) {
    body.pagination = pagination;
  }
  return NextResponse.json(body, { status });
}
