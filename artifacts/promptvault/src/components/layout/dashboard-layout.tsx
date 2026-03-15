import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Navbar } from "./navbar";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Download, Heart, Settings, FileText, Star,
  Bell, BookOpen, Rss, Users, CreditCard, MessageSquare, Gift, ChevronUp, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const unreadCount: number = unreadData?.count ?? 0;

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/purchases", label: "My Purchases", icon: ShoppingBag },
    { href: "/dashboard/downloads", label: "Downloads", icon: Download },
    { href: "/dashboard/wishlist", label: "Saved Packs", icon: Heart },
    { href: "/dashboard/library", label: "Prompt Library", icon: BookOpen },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : undefined,
    },
    { href: "/dashboard/activity", label: "Activity Feed", icon: Rss },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
    { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { href: "/dashboard/team", label: "Team", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? location === href : location.startsWith(href);

  const mobileBottomItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBag },
    {
      href: "/dashboard/notifications",
      label: "Alerts",
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : undefined,
    },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-border bg-card shrink-0 hidden md:flex flex-col">
          <div className="p-6 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Dashboard</p>
          </div>
          <nav className="p-4 space-y-0.5 flex-1 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive(href)
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {badge}
                    </span>
                  )}
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border space-y-0.5">
            <Link href="/dashboard/profile/edit">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Settings className="w-4 h-4" />
                Edit Profile
              </a>
            </Link>
            <Link href="/explore">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Star className="w-4 h-4" />
                Browse Marketplace
              </a>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border">
        {/* More Panel */}
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">More</p>
              <button onClick={() => setMoreOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-0.5 p-2">
              {navItems.slice(5).map(({ href, label, icon: Icon, badge }) => (
                <Link key={href} href={href}>
                  <a
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive(href)
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {badge && (
                      <span className="ml-auto flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                        {badge}
                      </span>
                    )}
                  </a>
                </Link>
              ))}
              <Link href="/explore">
                <a
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Marketplace</span>
                </a>
              </Link>
              <Link href="/dashboard/profile/edit">
                <a
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Edit Profile</span>
                </a>
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-around px-1 py-1 safe-area-inset-bottom">
          {mobileBottomItems.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative",
                  isActive(href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold leading-none">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive(href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </a>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ChevronUp className={cn("w-5 h-5 transition-transform", moreOpen && "rotate-180")} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
