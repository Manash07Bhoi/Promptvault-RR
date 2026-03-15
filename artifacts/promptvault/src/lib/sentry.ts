/**
 * Sentry client-side error tracking.
 * Only initializes if VITE_SENTRY_DSN is set — no-ops otherwise.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // Silently skip — Sentry is optional

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0.0,
    beforeSend(event) {
      // Strip PII from URLs (query strings may have tokens)
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          url.searchParams.delete("token");
          url.searchParams.delete("session_id");
          event.request.url = url.toString();
        } catch {}
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    console.error(err);
    return;
  }
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

export function setUser(id: number, email: string): void {
  if (!initialized) return;
  // Redact email — use ID for privacy
  Sentry.setUser({ id: String(id) });
}

export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

export { Sentry };
