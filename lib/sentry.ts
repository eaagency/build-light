/**
 * Sentry Error Tracking Utilities
 *
 * Custom wrappers around Sentry SDK for consistent error tracking
 * across the BuildLight application.
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Capture an exception and send to Sentry
 *
 * @param error - Error object to capture
 * @param context - Additional context to include with the error
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // In development, just log to console
    console.error("Error captured:", error, context);
  }
}

/**
 * Capture a message and send to Sentry
 *
 * @param message - Message to capture
 * @param level - Severity level
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" | "debug" = "info"
) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

/**
 * Set user context for error tracking
 * This associates all future errors with this user
 *
 * @param userId - Clerk user ID
 * @param email - User's email address
 * @param orgId - Organization ID (optional)
 * @param name - User's name (optional)
 */
export function setUserContext(
  userId: string,
  email: string,
  orgId?: string,
  name?: string
) {
  Sentry.setUser({
    id: userId,
    email: email,
    username: name || email.split("@")[0],
    organization_id: orgId,
  });
}

/**
 * Clear user context
 * Call this on logout to stop associating errors with the user
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the sequence of events leading to an error
 *
 * @param message - Breadcrumb message
 * @param category - Category (e.g., "navigation", "api", "ui")
 * @param level - Severity level
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category: string = "default",
  level: "info" | "warning" | "error" | "debug" = "info",
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Set context for current scope
 * Useful for adding request-specific context
 *
 * @param key - Context key
 * @param value - Context value
 */
export function setContext(key: string, value: Record<string, any>) {
  Sentry.setContext(key, value);
}

/**
 * Set a tag for filtering errors
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Start a transaction for performance monitoring
 *
 * @param name - Transaction name
 * @param op - Operation type
 * @returns Transaction object
 */
export function startTransaction(name: string, op: string = "default") {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap an async function with error tracking
 * Automatically captures exceptions and adds context
 *
 * @param fn - Function to wrap
 * @param context - Context to include if error occurs
 * @returns Wrapped function
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Track file upload for monitoring
 *
 * @param fileName - Name of file being uploaded
 * @param fileSize - Size in bytes
 * @param projectId - Project ID
 */
export function trackFileUpload(
  fileName: string,
  fileSize: number,
  projectId: string
) {
  addBreadcrumb(
    `Uploading file: ${fileName}`,
    "file-upload",
    "info",
    {
      fileName,
      fileSize,
      projectId,
    }
  );
}

/**
 * Track API call for monitoring
 *
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param statusCode - Response status code
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number
) {
  addBreadcrumb(
    `API ${method} ${endpoint}`,
    "api",
    statusCode >= 400 ? "error" : "info",
    {
      endpoint,
      method,
      statusCode,
    }
  );
}

// Re-export Sentry for advanced usage
export { Sentry };
