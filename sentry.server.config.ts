import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove cookies and authorization headers
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["clerk-session"];
      }
    }

    // Filter sensitive environment variables
    if (event.contexts?.runtime?.environment) {
      const sensitiveEnvVars = [
        "DATABASE_URL",
        "CLERK_SECRET_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "GOOGLE_CLIENT_SECRET",
        "ANTHROPIC_API_KEY",
        "SENTRY_AUTH_TOKEN",
      ];

      sensitiveEnvVars.forEach((envVar) => {
        if (event.contexts?.runtime?.environment?.[envVar]) {
          event.contexts.runtime.environment[envVar] = "[FILTERED]";
        }
      });
    }

    return event;
  },
});
