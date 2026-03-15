import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, subscriptionsTable, subscriptionCreditsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/subscription
router.get("/subscription", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
  const [credits] = await db.select().from(subscriptionCreditsTable).where(eq(subscriptionCreditsTable.userId, userId)).limit(1);
  const [user] = await db.select({ subscriptionPlan: usersTable.subscriptionPlan }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.json({
    subscription: sub || null,
    credits: credits || { creditsAvailable: 0, creditsUsed: 0 },
    currentPlan: user?.subscriptionPlan || "free",
  });
});

// POST /api/subscription/upgrade - Create Stripe subscription checkout
router.post("/subscription/upgrade", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { plan } = req.body;
  const PLAN_PRICES: Record<string, string> = {
    pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    teams: process.env.STRIPE_TEAMS_PRICE_ID || "price_teams",
  };

  if (!PLAN_PRICES[plan]) { res.status(400).json({ error: "Invalid plan" }); return; }

  const [user] = await db.select({ stripeCustomerId: usersTable.stripeCustomerId, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "Payment service unavailable. Please contact support." });
      return;
    }
    res.status(503).json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID/STRIPE_TEAMS_PRICE_ID to enable subscriptions." });
    return;
  }

  const priceId = PLAN_PRICES[plan];
  if (!priceId || priceId.startsWith("price_pro") || priceId.startsWith("price_teams")) {
    res.status(503).json({ error: "Subscription plan price IDs not configured. Set STRIPE_PRO_PRICE_ID and STRIPE_TEAMS_PRICE_ID environment variables." });
    return;
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const APP_URL = process.env.APP_URL || "http://localhost:19275";

  const sessionParams: any = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/subscription?upgraded=1`,
    cancel_url: `${APP_URL}/pricing`,
    client_reference_id: String(req.user!.userId),
    metadata: { userId: String(req.user!.userId), plan },
  };

  if (user?.stripeCustomerId) {
    sessionParams.customer = user.stripeCustomerId;
  } else if (user?.email) {
    sessionParams.customer_email = user.email;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ checkoutUrl: session.url });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create subscription checkout session" });
  }
});

// POST /api/subscription/cancel
router.post("/subscription/cancel", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db.update(subscriptionsTable)
    .set({ cancelAtPeriodEnd: true })
    .where(eq(subscriptionsTable.userId, req.user!.userId));
  res.json({ success: true });
});

// POST /api/subscription/reactivate
router.post("/subscription/reactivate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db.update(subscriptionsTable)
    .set({ cancelAtPeriodEnd: false })
    .where(eq(subscriptionsTable.userId, req.user!.userId));
  res.json({ success: true });
});

// GET /api/subscription/credits
router.get("/subscription/credits", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [credits] = await db.select().from(subscriptionCreditsTable)
    .where(eq(subscriptionCreditsTable.userId, req.user!.userId)).limit(1);
  res.json(credits || { creditsAvailable: 0, creditsUsed: 0, creditsExpiring: 0 });
});

export default router;
