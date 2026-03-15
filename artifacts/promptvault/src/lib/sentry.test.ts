import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Sentry
vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  withScope: vi.fn((cb) => {
    const scope = { setExtras: vi.fn() };
    cb(scope);
  }),
  browserTracingIntegration: vi.fn(() => "browserTracingIntegration"),
  replayIntegration: vi.fn(() => "replayIntegration"),
}));

describe("sentry client initialization", () => {
  let sentryModule: typeof import("./sentry");
  let Sentry: typeof import("@sentry/react");

  const originalEnv = { ...import.meta.env };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.assign(import.meta.env, originalEnv);
  });

  describe("initSentry edge cases", () => {
    it("should not initialize Sentry if VITE_SENTRY_DSN is missing", async () => {
      vi.stubEnv("VITE_SENTRY_DSN", "");
      sentryModule = await import("./sentry");
      Sentry = await import("@sentry/react");

      sentryModule.initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it("should initialize Sentry with development defaults when not PROD", async () => {
      Object.assign(import.meta.env, {
        VITE_SENTRY_DSN: "https://example@sentry.io/123",
        MODE: "test-env",
        VITE_APP_VERSION: "1.0.0",
        PROD: false,
      });

      sentryModule = await import("./sentry");
      Sentry = await import("@sentry/react");

      sentryModule.initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://example@sentry.io/123",
          environment: "test-env",
          release: "1.0.0",
          tracesSampleRate: 1.0,
          replaysOnErrorSampleRate: 0.0,
        })
      );
    });

    it("should initialize Sentry with production defaults when PROD is true", async () => {
      Object.assign(import.meta.env, {
        VITE_SENTRY_DSN: "https://example@sentry.io/123",
        MODE: "production",
        VITE_APP_VERSION: "1.0.0",
        PROD: true,
      });

      sentryModule = await import("./sentry");
      Sentry = await import("@sentry/react");

      sentryModule.initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: "production",
          tracesSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        })
      );
    });

    it("should strip PII from URLs in beforeSend", async () => {
      Object.assign(import.meta.env, {
        VITE_SENTRY_DSN: "https://example@sentry.io/123",
        MODE: "production",
        PROD: true,
      });

      sentryModule = await import("./sentry");
      Sentry = await import("@sentry/react");

      sentryModule.initSentry();

      // Extract beforeSend from the mock call arguments
      const initCallArgs = vi.mocked(Sentry.init).mock.calls[0][0];
      const beforeSend = initCallArgs.beforeSend;

      expect(beforeSend).toBeDefined();

      if (!beforeSend) throw new Error("beforeSend not defined");

      const mockEvent = {
        request: {
          url: "https://example.com/api/data?token=secret123&session_id=abc456&other=keep",
        },
      };

      // @ts-expect-error - testing partial event
      const resultEvent = beforeSend(mockEvent, {});

      expect(resultEvent?.request?.url).toBe("https://example.com/api/data?other=keep");
    });

    it("should handle malformed URLs gracefully in beforeSend without throwing", async () => {
      Object.assign(import.meta.env, {
        VITE_SENTRY_DSN: "https://example@sentry.io/123",
        MODE: "production",
        PROD: true,
      });

      sentryModule = await import("./sentry");
      Sentry = await import("@sentry/react");

      sentryModule.initSentry();

      const initCallArgs = vi.mocked(Sentry.init).mock.calls[0][0];
      const beforeSend = initCallArgs.beforeSend;

      if (!beforeSend) throw new Error("beforeSend not defined");

      const malformedEvent = {
        request: {
          url: "not-a-valid-url",
        },
      };

      // @ts-expect-error - testing partial event
      const resultEvent = beforeSend(malformedEvent, {});

      // It shouldn't crash and should leave the url intact if it fails to parse
      expect(resultEvent?.request?.url).toBe("not-a-valid-url");
    });
  });

  describe("helper functions", () => {
    describe("when uninitialized", () => {
      beforeEach(async () => {
        // Ensure initialized state is false (default)
        sentryModule = await import("./sentry");
        Sentry = await import("@sentry/react");

        // Suppress console.error output for expected error logging
        vi.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("should safely skip captureException when uninitialized", () => {
        const error = new Error("test error");
        sentryModule.captureException(error);

        expect(Sentry.withScope).not.toHaveBeenCalled();
        expect(Sentry.captureException).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(error);
      });

      it("should safely skip captureMessage when uninitialized", () => {
        sentryModule.captureMessage("test message");
        expect(Sentry.captureMessage).not.toHaveBeenCalled();
      });

      it("should safely skip setUser when uninitialized", () => {
        sentryModule.setUser(1, "test@example.com");
        expect(Sentry.setUser).not.toHaveBeenCalled();
      });

      it("should safely skip clearUser when uninitialized", () => {
        sentryModule.clearUser();
        expect(Sentry.setUser).not.toHaveBeenCalled();
      });
    });

    describe("when initialized", () => {
      beforeEach(async () => {
        Object.assign(import.meta.env, {
          VITE_SENTRY_DSN: "https://example@sentry.io/123",
        });

        sentryModule = await import("./sentry");
        Sentry = await import("@sentry/react");
        sentryModule.initSentry();
      });

      it("should delegate captureException to Sentry", () => {
        const error = new Error("test error");
        const context = { extra: "data" };

        sentryModule.captureException(error, context);

        expect(Sentry.withScope).toHaveBeenCalled();
        expect(Sentry.captureException).toHaveBeenCalledWith(error);
      });

      it("should delegate captureMessage to Sentry", () => {
        sentryModule.captureMessage("test message", "warning");
        expect(Sentry.captureMessage).toHaveBeenCalledWith("test message", "warning");
      });

      it("should delegate setUser to Sentry, using stringified ID", () => {
        sentryModule.setUser(42, "user@example.com");
        expect(Sentry.setUser).toHaveBeenCalledWith({ id: "42" });
      });

      it("should delegate clearUser to Sentry", () => {
        sentryModule.clearUser();
        expect(Sentry.setUser).toHaveBeenCalledWith(null);
      });
    });
  });
});
