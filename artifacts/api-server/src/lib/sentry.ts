/**
 * Sentry error tracking for the API server.
 * Only initializes if SENTRY_DSN is configured — no-ops otherwise.
 */
import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger.js";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("Sentry DSN not set — error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.npm_package_version,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      // Strip PII from request data
      if (event.request?.cookies) event.request.cookies = {};
      if (event.request?.headers?.authorization) {
        event.request.headers.authorization = "[Filtered]";
      }
      return event;
    },
  });

  initialized = true;
  logger.info({ env: process.env.NODE_ENV }, "Sentry initialized");
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureMessage(message, level);
  });
}

export { Sentry };
