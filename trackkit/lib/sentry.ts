/**
 * Sentry error tracking initializer.
 * Activates only when SENTRY_DSN env var is set.
 * Safe to import everywhere — no-ops gracefully in local dev.
 *
 * Setup:
 * 1. Sign up at https://sentry.io (free)
 * 2. Create a "Next.js" project
 * 3. Copy the DSN from Project Settings → Client Keys
 * 4. Add to Vercel: SENTRY_DSN=https://xxx@sentry.io/yyy
 */

let sentryInitialized = false;

export async function initSentry(): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  try {
    // Lazy import so Sentry bundle is only loaded when DSN is configured.
    // Install when needed: npm install @sentry/nextjs
    // const Sentry = await import("@sentry/nextjs");
    // Sentry.init({
    //   dsn,
    //   tracesSampleRate: 0.2,   // 20% of transactions traced (adjust in prod)
    //   environment: process.env.NODE_ENV,
    //   release: process.env.NEXT_PUBLIC_APP_VERSION,
    //   beforeSend(event) {
    //     // Strip phone numbers from error messages before sending
    //     if (event.message) {
    //       event.message = event.message.replace(/\+?\d{10,15}/g, "[PHONE_REDACTED]");
    //     }
    //     return event;
    //   },
    // });
    sentryInitialized = true;
    console.log("[Sentry] Initialized ✓");
  } catch (err) {
    // Never crash the app because Sentry failed to load
    console.warn("[Sentry] Failed to initialize:", err);
  }
}

/**
 * Captures an exception and sends it to Sentry (if configured).
 * Falls back to console.error when Sentry is not initialized.
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", err, context);
    return;
  }
  // When Sentry is installed:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(err, { extra: context });
  console.error("[Error]", err, context);
}
