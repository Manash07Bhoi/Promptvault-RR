import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before importing the module
vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => {
    // Mock the scope object passed to the callback
    const scope = {
      setExtras: vi.fn(),
    };
    callback(scope);
  }),
}));

vi.mock("../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("Sentry initialization", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let initSentry: typeof import("../lib/sentry.js").initSentry;
  let Sentry: typeof import("@sentry/node");
  let logger: typeof import("../utils/logger.js").logger;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear mocks before each test
    vi.clearAllMocks();
    // Reset modules to clear the `initialized` flag in sentry.ts
    vi.resetModules();

    // Dynamically import the module to ensure fresh state for each test
    const sentryModule = await import("../lib/sentry.js");
    initSentry = sentryModule.initSentry;

    // Import mocked dependencies
    Sentry = await import("@sentry/node");
    logger = (await import("../utils/logger.js")).logger;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it("should not initialize Sentry if SENTRY_DSN is missing", () => {
    delete process.env.SENTRY_DSN;

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Sentry DSN not set — error tracking disabled");
  });

  it("should initialize Sentry when SENTRY_DSN is provided", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    process.env.NODE_ENV = "test";
    process.env.npm_package_version = "1.2.3";

    initSentry();

    expect(Sentry.init).toHaveBeenCalledTimes(1);

    // Verify initialization config
    const initCallArgs = vi.mocked(Sentry.init).mock.calls[0][0];
    expect(initCallArgs).toBeDefined();
    expect(initCallArgs?.dsn).toBe("https://examplePublicKey@o0.ingest.sentry.io/0");
    expect(initCallArgs?.environment).toBe("test");
    expect(initCallArgs?.release).toBe("1.2.3");
    expect(initCallArgs?.tracesSampleRate).toBe(1.0); // Not production

    expect(logger.info).toHaveBeenCalledWith({ env: "test" }, "Sentry initialized");
  });

  it("should set tracesSampleRate to 0.1 in production", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    process.env.NODE_ENV = "production";

    initSentry();

    const initCallArgs = vi.mocked(Sentry.init).mock.calls[0][0];
    expect(initCallArgs?.tracesSampleRate).toBe(0.1);
  });

  it("beforeSend should strip PII from request data", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    initSentry();

    const initCallArgs = vi.mocked(Sentry.init).mock.calls[0][0];
    const beforeSend = initCallArgs?.beforeSend;

    expect(beforeSend).toBeDefined();

    if (beforeSend) {
      // Create a mock event with PII
      const mockEvent: any = {
        request: {
          cookies: { session_id: "secret_cookie" },
          headers: {
            authorization: "Bearer secret_token",
            "user-agent": "test-agent",
          },
        },
      };

      const resultEvent = beforeSend(mockEvent, {});

      // Verify cookies are wiped
      expect(resultEvent?.request?.cookies).toEqual({});

      // Verify authorization header is filtered
      expect(resultEvent?.request?.headers?.authorization).toBe("[Filtered]");

      // Verify other headers remain untouched
      expect(resultEvent?.request?.headers?.["user-agent"]).toBe("test-agent");
    }
  });

  it("should not initialize Sentry multiple times if already initialized", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    process.env.NODE_ENV = "test";

    // Call initSentry multiple times
    initSentry();
    initSentry();
    initSentry();

    // Verify Sentry.init is only called once
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });
});

describe("Sentry capture methods", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let sentryModule: typeof import("../lib/sentry.js");
  let Sentry: typeof import("@sentry/node");

  beforeEach(async () => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
    vi.resetModules();

    sentryModule = await import("../lib/sentry.js");
    Sentry = await import("@sentry/node");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("captureException should safely do nothing if not initialized", () => {
    delete process.env.SENTRY_DSN;
    sentryModule.initSentry(); // Attempt initialization but it fails safely

    expect(Sentry.init).not.toHaveBeenCalled();

    const err = new Error("Test error");
    sentryModule.captureException(err);

    // Verify Sentry wasn't invoked
    expect(Sentry.withScope).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("captureMessage should safely do nothing if not initialized", () => {
    delete process.env.SENTRY_DSN;
    sentryModule.initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();

    sentryModule.captureMessage("Test message");

    // Verify Sentry wasn't invoked
    expect(Sentry.withScope).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("captureException should call Sentry when initialized", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    sentryModule.initSentry();

    expect(Sentry.init).toHaveBeenCalled();

    const err = new Error("Test error");
    const context = { userId: "user_123" };

    sentryModule.captureException(err, context);

    expect(Sentry.withScope).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it("captureMessage should call Sentry when initialized", () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    sentryModule.initSentry();

    expect(Sentry.init).toHaveBeenCalled();

    const context = { action: "login" };

    sentryModule.captureMessage("Test message", "warning", context);

    expect(Sentry.withScope).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith("Test message", "warning");
  });
});
