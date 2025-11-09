import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove cookies and authorization headers
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
    }

    // Filter out sensitive query parameters
    if (event.request?.query_string) {
      const sensitiveParams = ["token", "password", "api_key", "secret"];
      sensitiveParams.forEach((param) => {
        if (event.request?.query_string?.includes(param)) {
          event.request.query_string = event.request.query_string.replace(
            new RegExp(`${param}=[^&]*`, "gi"),
            `${param}=[FILTERED]`
          );
        }
      });
    }

    return event;
  },
});
