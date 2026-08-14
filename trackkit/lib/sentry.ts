import * as Sentry from "@sentry/nextjs";

export function initSentry(): void {
  // Sentry is automatically initialized via sentry.*.config.ts and instrumentation.ts
}

/**
 * Captures an exception and sends it to Sentry (if DSN is configured).
 * Falls back to console.error when in development.
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", err, context);
    return;
  }
  Sentry.captureException(err, { extra: context });
}
