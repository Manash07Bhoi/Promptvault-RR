import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetUserPurchases, useGetUserSavedPacks, useListPacks } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/use-auth-store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Download, Heart, ShoppingBag, ArrowRight, Star, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { PackCard } from "@/components/shared/pack-card";
import { cn } from "@/lib/utils";

// Profile completion items
function getProfileCompletion(user: any): { score: number; items: { label: string; done: boolean; href: string; points: number }[] } {
  const items = [
    { label: "Avatar uploaded", done: !!user?.avatarUrl, href: "/dashboard/profile/edit", points: 15 },
    { label: "Display name set", done: !!(user?.displayName && user.displayName !== user?.email), href: "/dashboard/profile/edit", points: 10 },
    { label: "Bio written (50+ chars)", done: !!(user?.bio && user.bio.length >= 50), href: "/dashboard/profile/edit", points: 15 },
    { label: "Username set", done: !!(user?.username), href: "/dashboard/profile/edit", points: 10 },
    { label: "At least one social link", done: !!(user?.twitterHandle || user?.linkedinUrl || user?.githubHandle || user?.websiteUrl), href: "/dashboard/profile/edit", points: 10 },
    { label: "At least 3 specialties", done: !!(user?.specialties && user.specialties.length >= 3), href: "/dashboard/profile/edit", points: 10 },
    { label: "Location set", done: !!(user?.location), href: "/dashboard/profile/edit", points: 5 },
    { label: "First pack purchased", done: !!(user?.purchaseCount > 0), href: "/explore", points: 10 },
  ];
  const total = items.reduce((acc, i) => acc + i.points, 0);
  const earned = items.filter(i => i.done).reduce((acc, i) => acc + i.points, 0);
  const score = Math.round((earned / total) * 100);
  return { score, items };
}

function ProfileCompletionWidget({ user }: { user: any }) {
  const { score, items } = getProfileCompletion(user);
  const incomplete = items.filter(i => !i.done);

  if (score >= 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mt-0.5">You're {score}% done — finish to boost your visibility</p>
        </div>
        <div className="flex-shrink-0 relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeDasharray={`${score} ${100 - score}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="text-primary transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{score}%</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-1.5">
        {incomplete.slice(0, 4).map(item => (
          <Link key={item.label} href={item.href}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-primary/5">
              <Circle className="w-4 h-4 flex-shrink-0 text-border" />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto text-xs text-primary font-medium">+{item.points}pts</span>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/dashboard/profile/edit">
        <Button size="sm" variant="outline" className="mt-3 w-full gap-2 text-primary border-primary/30 hover:bg-primary/5">
          Complete Profile <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { data: purchases } = useGetUserPurchases();
  const { data: savedPacks } = useGetUserSavedPacks();

  const recentOrders = (purchases || []).slice(0, 5);
  const wishlist = savedPacks || [];

  const statCards = [
    { icon: ShoppingBag, label: "Purchases", value: purchases?.length || 0, color: "from-primary to-violet-700", link: "/dashboard/purchases" },
    { icon: Download, label: "Downloads", value: purchases?.length || 0, color: "from-secondary to-cyan-600", link: "/dashboard/downloads" },
    { icon: Heart, label: "Saved Packs", value: wishlist.length, color: "from-pink-500 to-rose-600", link: "/dashboard/wishlist" },
    { icon: Star, label: "Reviews Left", value: 0, color: "from-amber-500 to-orange-600", link: "/dashboard/purchases" },
  ];

  const profileScore = getProfileCompletion(user).score;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-border p-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {user?.displayName || "there"} 👋
              </h1>
              <p className="text-muted-foreground mt-2">Here's what's happening with your PromptVault account.</p>
              {profileScore < 100 && (
                <Link href="/dashboard/profile/edit">
                  <div className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline cursor-pointer">
                    <span>Profile {profileScore}% complete</span>
                    <span className="text-muted-foreground">— finish to unlock your public profile</span>
                  </div>
                </Link>
              )}
            </div>
            <Link href="/explore">
              <Button className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Browse More Packs
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Profile completion widget */}
        <ProfileCompletionWidget user={user} />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link href={stat.link}>
                <div className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Recent Purchases</h2>
              <Link href="/dashboard/purchases">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground mb-2">No purchases yet</p>
                <p className="text-sm text-muted-foreground mb-4">Find your first prompt pack to get started</p>
                <Link href="/explore"><Button size="sm">Browse Packs</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">Order #{order.id}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={order.status === "COMPLETED" ? "default" : "outline"} className="text-xs">
                          {order.status}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{formatPrice(order.totalCents)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Saved Packs */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Saved Packs</h2>
              <Link href="/dashboard/wishlist">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-foreground mb-2">No saved packs</p>
                <p className="text-sm text-muted-foreground mb-4">Save packs you're interested in for later</p>
                <Link href="/explore"><Button size="sm" variant="outline">Explore Packs</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlist.slice(0, 4).map((pack: any) => (
                  <Link key={pack.id} href={`/packs/${pack.slug}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group">
                      <img
                        src={pack.thumbnailUrl || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80"}
                        alt={pack.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <div className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{pack.title}</div>
                        <div className="text-xs text-muted-foreground">{pack.categoryName}</div>
                      </div>
                      <span className="font-bold text-sm text-foreground shrink-0">{formatPrice(pack.priceCents)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
              <p className="text-sm text-muted-foreground">Popular packs you might love</p>
            </div>
            <Link href="/explore"><Button variant="outline" size="sm">See All <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          </div>
          <RecommendedPacks />
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: "/dashboard/library", label: "Prompt Library", desc: "Browse your purchased prompts", icon: Sparkles, color: "from-violet-500 to-purple-600" },
            { href: "/dashboard/notifications", label: "Notifications", desc: "Check your latest updates", icon: Star, color: "from-amber-500 to-orange-500" },
            { href: "/dashboard/referrals", label: "Earn Rewards", desc: "Refer friends and earn credits", icon: Heart, color: "from-pink-500 to-rose-600" },
          ].map(q => (
            <Link key={q.href} href={q.href}>
              <div className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center flex-shrink-0`}>
                  <q.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{q.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{q.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function RecommendedPacks() {
  const { data: packs } = useListPacks({ limit: 4, sort: "popular" });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(packs?.packs || []).slice(0, 4).map((pack: any, i: number) => (
        <PackCard key={pack.id} pack={pack} index={i} />
      ))}
    </div>
  );
}
