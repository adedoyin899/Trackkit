import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  beforeSend(event) {
    if (event.message) {
      event.message = event.message.replace(/\+?\d{10,15}/g, "[PHONE_REDACTED]");
    }
    return event;
  },
});
