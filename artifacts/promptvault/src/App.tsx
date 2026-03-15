import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect, useRef } from "react";
import { useAuthStore } from "./store/use-auth-store";
import { useGetMe } from "@workspace/api-client-react";
import { initSentry } from "./lib/sentry";
import { toast } from "sonner";

// Initialize Sentry (no-ops if VITE_SENTRY_DSN not set)
initSentry();

// All pages are lazy-loaded for optimal initial bundle size
const Home = lazy(() => import("@/pages/home"));
const Explore = lazy(() => import("@/pages/explore"));
const PackDetail = lazy(() => import("@/pages/pack-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));

const Login = lazy(() => import("@/pages/auth/login"));
const AdminLogin = lazy(() => import("@/pages/auth/admin-login"));
const Signup = lazy(() => import("@/pages/auth/signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const EmailVerification = lazy(() => import("@/pages/auth/email-verification"));

const SearchPage = lazy(() => import("@/pages/search"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const TrendingPage = lazy(() => import("@/pages/trending"));
const CategoryPage = lazy(() => import("@/pages/category"));
const CreatorPage = lazy(() => import("@/pages/creator"));
const CreatorsPage = lazy(() => import("@/pages/creators"));

const DashboardHome = lazy(() => import("@/pages/dashboard/home"));
const Purchases = lazy(() => import("@/pages/dashboard/purchases"));
const Downloads = lazy(() => import("@/pages/dashboard/downloads"));
const Wishlist = lazy(() => import("@/pages/dashboard/wishlist"));
const AccountSettings = lazy(() => import("@/pages/dashboard/settings"));
const OrderDetail = lazy(() => import("@/pages/dashboard/order-detail"));
const WriteReview = lazy(() => import("@/pages/dashboard/write-review"));

const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminAutomation = lazy(() => import("@/pages/admin/automation"));
const AdminApproval = lazy(() => import("@/pages/admin/approval"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminPricing = lazy(() => import("@/pages/admin/pricing"));
const AdminFiles = lazy(() => import("@/pages/admin/files"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminPacks = lazy(() => import("@/pages/admin/packs"));
const AdminPackEditor = lazy(() => import("@/pages/admin/pack-editor"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminNotifications = lazy(() => import("@/pages/admin/notifications"));

const Checkout = lazy(() => import("@/pages/checkout/index"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout/success"));
const CheckoutCancel = lazy(() => import("@/pages/checkout/cancel"));

const AboutPage = lazy(() => import("@/pages/about"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const ContactPage = lazy(() => import("@/pages/contact"));

const ForbiddenPage = lazy(() => import("@/pages/forbidden"));
const ServerErrorPage = lazy(() => import("@/pages/server-error"));

// Phase 2 — User Profile
const UserProfilePage = lazy(() => import("@/pages/user-profile"));
const EditProfilePage = lazy(() => import("@/pages/dashboard/edit-profile"));
const FollowersPage = lazy(() => import("@/pages/followers"));
const FollowingPage = lazy(() => import("@/pages/following"));

// Phase 2 — Social
const ActivityFeedPage = lazy(() => import("@/pages/dashboard/activity-feed"));
const DiscoverCreatorsPage = lazy(() => import("@/pages/discover-creators"));
const CollectionsPage = lazy(() => import("@/pages/collections-page"));
const CollectionDetailPage = lazy(() => import("@/pages/collection-detail"));

// Phase 2 — Notifications
const NotificationsPage = lazy(() => import("@/pages/dashboard/notifications"));

// Phase 2 — Prompts
const PromptLibraryPage = lazy(() => import("@/pages/dashboard/prompt-library"));
const PackPromptsPage = lazy(() => import("@/pages/pack-prompts"));

// Phase 2 — Creator Platform
const BecomeCreatorPage = lazy(() => import("@/pages/creator/apply"));
const CreatorDashboardPage = lazy(() => import("@/pages/creator/dashboard"));
const CreatorNewPackPage = lazy(() => import("@/pages/creator/new-pack"));
const CreatorEditPackPage = lazy(() => import("@/pages/creator/edit-pack"));
const CreatorAnalyticsPage = lazy(() => import("@/pages/creator/analytics"));
const CreatorPayoutsPage = lazy(() => import("@/pages/creator/payouts"));

// Phase 2 — Commerce
const CartPage = lazy(() => import("@/pages/cart"));
const GiftRedeemPage = lazy(() => import("@/pages/gift-redeem"));
const FlashSalesPage = lazy(() => import("@/pages/flash-sales"));
const SubscriptionPage = lazy(() => import("@/pages/dashboard/subscription"));

// Phase 2 — Dashboard
const TeamPage = lazy(() => import("@/pages/dashboard/team"));
const ReferralsPage = lazy(() => import("@/pages/dashboard/referrals"));
const MessagesPage = lazy(() => import("@/pages/dashboard/messages"));
const DashboardCollectionsPage = lazy(() => import("@/pages/dashboard/collections"));

// Phase 2 — Admin Extensions
const AdminModerationPage = lazy(() => import("@/pages/admin/moderation"));
const AdminCreatorsPage = lazy(() => import("@/pages/admin/creators"));
const AdminFinancePage = lazy(() => import("@/pages/admin/finance"));
const AdminSEOPage = lazy(() => import("@/pages/admin/seo"));
const AdminExperimentsPage = lazy(() => import("@/pages/admin/experiments"));
const AdminSupportPage = lazy(() => import("@/pages/admin/support"));
const AdminConfigPage = lazy(() => import("@/pages/admin/config"));

// Phase 2 — Legal & Other
const ContentPolicyPage = lazy(() => import("@/pages/legal/content-policy"));

// Phase 2 — New Pages
const CommunityPage = lazy(() => import("@/pages/community"));
const AffiliatePage = lazy(() => import("@/pages/affiliate"));
const DeveloperPage = lazy(() => import("@/pages/developer"));
const ApiDocsPage = lazy(() => import("@/pages/docs/api-docs"));
const VerificationPage = lazy(() => import("@/pages/dashboard/verification"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const e = error as { status?: number };
        if (e?.status === 401 || e?.status === 404 || e?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function RequireAuth({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [location] = useLocation();
  const shownAccessDenied = useRef(false);

  const accessDenied = isAuthenticated && requireAdmin && !isAdmin;

  useEffect(() => {
    if (accessDenied && !shownAccessDenied.current) {
      shownAccessDenied.current = true;
      toast.error("Access denied. Administrators only.");
    }
  }, [accessDenied]);

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location);
    return <Redirect to={`/login?returnUrl=${returnUrl}`} />;
  }

  if (accessDenied) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  const { setAuth, logout } = useAuthStore();

  const { data: user, isError } = useGetMe({
    query: { retry: false, enabled: !!useAuthStore.getState().accessToken } as any,
  });

  useEffect(() => {
    if (isError) logout();
    if (user) setAuth(user, useAuthStore.getState().accessToken || "");
    // cleanup: nothing to tear down for this auth check
  }, [user, isError, setAuth, logout]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public */}
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/packs/:slug" component={PackDetail} />
        <Route path="/search" component={SearchPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/trending" component={TrendingPage} />
        <Route path="/categories/:slug" component={CategoryPage} />
        <Route path="/creator/:username" component={CreatorPage} />

        {/* Info Pages */}
        <Route path="/about" component={AboutPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/contact" component={ContactPage} />

        {/* Checkout */}
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />

        {/* Creators Directory */}
        <Route path="/creators" component={CreatorsPage} />
        <Route path="/discover-creators" component={DiscoverCreatorsPage} />

        {/* User Profiles (Phase 2) */}
        <Route path="/u/:username" component={UserProfilePage} />
        <Route path="/u/:username/followers" component={FollowersPage} />
        <Route path="/u/:username/following" component={FollowingPage} />

        {/* Collections (Phase 2) */}
        <Route path="/collections" component={CollectionsPage} />
        <Route path="/collections/:id" component={CollectionDetailPage} />

        {/* Commerce (Phase 2) */}
        <Route path="/cart" component={CartPage} />
        <Route path="/gift/:token" component={GiftRedeemPage} />
        <Route path="/sales" component={FlashSalesPage} />

        {/* Creator Platform (Phase 2) */}
        <Route path="/become-a-creator" component={BecomeCreatorPage} />
        <Route path="/creator/dashboard">
          {() => <RequireAuth><CreatorDashboardPage /></RequireAuth>}
        </Route>
        <Route path="/creator/packs/new">
          {() => <RequireAuth><CreatorNewPackPage /></RequireAuth>}
        </Route>
        <Route path="/creator/packs/:id/edit">
          {() => <RequireAuth><CreatorEditPackPage /></RequireAuth>}
        </Route>
        <Route path="/creator/analytics">
          {() => <RequireAuth><CreatorAnalyticsPage /></RequireAuth>}
        </Route>
        <Route path="/creator/payouts">
          {() => <RequireAuth><CreatorPayoutsPage /></RequireAuth>}
        </Route>

        {/* Legal (Phase 2) */}
        <Route path="/legal/content-policy" component={ContentPolicyPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/affiliate" component={AffiliatePage} />
        <Route path="/docs/api" component={ApiDocsPage} />
        <Route path="/developer">
          {() => <RequireAuth><DeveloperPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/verification">
          {() => <RequireAuth><VerificationPage /></RequireAuth>}
        </Route>

        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/pvx-admin" component={AdminLogin} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={EmailVerification} />

        {/* Dashboard */}
        <Route path="/dashboard">
          {() => <RequireAuth><DashboardHome /></RequireAuth>}
        </Route>
        <Route path="/dashboard/purchases">
          {() => <RequireAuth><Purchases /></RequireAuth>}
        </Route>
        <Route path="/dashboard/downloads">
          {() => <RequireAuth><Downloads /></RequireAuth>}
        </Route>
        <Route path="/dashboard/wishlist">
          {() => <RequireAuth><Wishlist /></RequireAuth>}
        </Route>
        <Route path="/dashboard/settings">
          {() => <RequireAuth><AccountSettings /></RequireAuth>}
        </Route>
        <Route path="/dashboard/orders/:id">
          {(params) => <RequireAuth><OrderDetail id={params.id} /></RequireAuth>}
        </Route>
        <Route path="/dashboard/review/:packId">
          {(params) => <RequireAuth><WriteReview packId={params.packId} /></RequireAuth>}
        </Route>

        {/* Dashboard Phase 2 */}
        <Route path="/dashboard/profile/edit">
          {() => <RequireAuth><EditProfilePage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/notifications">
          {() => <RequireAuth><NotificationsPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/library">
          {() => <RequireAuth><PromptLibraryPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/packs/:packId/prompts">
          {(params) => <RequireAuth><PackPromptsPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/activity">
          {() => <RequireAuth><ActivityFeedPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/subscription">
          {() => <RequireAuth><SubscriptionPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/team">
          {() => <RequireAuth><TeamPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/referrals">
          {() => <RequireAuth><ReferralsPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/messages">
          {() => <RequireAuth><MessagesPage /></RequireAuth>}
        </Route>
        <Route path="/dashboard/collections">
          {() => <RequireAuth><DashboardCollectionsPage /></RequireAuth>}
        </Route>

        {/* Admin */}
        <Route path="/admin">
          {() => <RequireAuth requireAdmin><AdminDashboard /></RequireAuth>}
        </Route>
        <Route path="/admin/automation">
          {() => <RequireAuth requireAdmin><AdminAutomation /></RequireAuth>}
        </Route>
        <Route path="/admin/approval">
          {() => <RequireAuth requireAdmin><AdminApproval /></RequireAuth>}
        </Route>
        <Route path="/admin/categories">
          {() => <RequireAuth requireAdmin><AdminCategories /></RequireAuth>}
        </Route>
        <Route path="/admin/pricing">
          {() => <RequireAuth requireAdmin><AdminPricing /></RequireAuth>}
        </Route>
        <Route path="/admin/files">
          {() => <RequireAuth requireAdmin><AdminFiles /></RequireAuth>}
        </Route>
        <Route path="/admin/analytics">
          {() => <RequireAuth requireAdmin><AdminAnalytics /></RequireAuth>}
        </Route>
        <Route path="/admin/users">
          {() => <RequireAuth requireAdmin><AdminUsers /></RequireAuth>}
        </Route>
        <Route path="/admin/packs">
          {() => <RequireAuth requireAdmin><AdminPacks /></RequireAuth>}
        </Route>
        <Route path="/admin/packs/:id/edit">
          {(params) => <RequireAuth requireAdmin><AdminPackEditor id={params.id} /></RequireAuth>}
        </Route>
        <Route path="/admin/settings">
          {() => <RequireAuth requireAdmin><AdminSettings /></RequireAuth>}
        </Route>
        <Route path="/admin/notifications">
          {() => <RequireAuth requireAdmin><AdminNotifications /></RequireAuth>}
        </Route>

        {/* Admin Phase 2 */}
        <Route path="/admin/moderation">
          {() => <RequireAuth requireAdmin><AdminModerationPage /></RequireAuth>}
        </Route>
        <Route path="/admin/creators">
          {() => <RequireAuth requireAdmin><AdminCreatorsPage /></RequireAuth>}
        </Route>
        <Route path="/admin/finance">
          {() => <RequireAuth requireAdmin><AdminFinancePage /></RequireAuth>}
        </Route>
        <Route path="/admin/seo">
          {() => <RequireAuth requireAdmin><AdminSEOPage /></RequireAuth>}
        </Route>
        <Route path="/admin/experiments">
          {() => <RequireAuth requireAdmin><AdminExperimentsPage /></RequireAuth>}
        </Route>
        <Route path="/admin/support">
          {() => <RequireAuth requireAdmin><AdminSupportPage /></RequireAuth>}
        </Route>
        <Route path="/admin/config">
          {() => <RequireAuth requireAdmin><AdminConfigPage /></RequireAuth>}
        </Route>

        {/* Error pages */}
        <Route path="/403" component={ForbiddenPage} />
        <Route path="/500" component={ServerErrorPage} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
