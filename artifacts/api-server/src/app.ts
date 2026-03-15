import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";
import router from "./routes/index.js";
import { logger } from "./utils/logger.js";

export { authLoginLimit, authRegisterLimit, authForgotLimit, searchLimit } from "./lib/rate-limiters.js";

const app: Express = express();

app.set("trust proxy", 1);

const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = [
  process.env.APP_URL,
  process.env.CLIENT_URL,
  ...(isDev ? ["http://localhost:19275", "http://localhost:19276"] : []),
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Exact allowed origins always permitted
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    // In production: only exact allowed origins (no wildcard subdomain matching)
    if (!isDev) return callback(null, false);
    // In development: allow all Replit preview domains and localhost
    const devAllowed =
      origin.includes(".replit.dev") ||
      origin.includes(".repl.co") ||
      origin.includes("localhost");
    return callback(null, devAllowed);
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Request-ID", crypto.randomUUID());
  next();
});

const globalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/api/checkout/webhook",
});

app.use(globalLimit);

app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const authReq = req as Request & { user?: { userId: number } };
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: res.getHeader("X-Request-ID"),
      userId: authReq.user?.userId,
      ip: req.ip,
    });

    // Log rate limit triggers
    if (res.statusCode === 429) {
      logger.warn({ path: req.path, ip: req.ip }, "Rate limit triggered");
    }
  });
  next();
});

// Serve sitemap.xml at root level for search engine crawlers
app.get("/sitemap.xml", (req: Request, res: Response, next: NextFunction) => {
  req.url = "/api/sitemap.xml";
  router(req, res, next);
});

app.use("/api", router);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e.status || e.statusCode || 500;
  if (status >= 500) {
    logger.error({ err }, "Unhandled server error");
  }
  if (isDev) {
    res.status(status).json({ error: e.message || "Internal server error" });
  } else {
    const safeMessage = status < 500 ? (e.message || "Bad request") : "An unexpected error occurred";
    res.status(status).json({ error: safeMessage });
  }
});

export default app;
