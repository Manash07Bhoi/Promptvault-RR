import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Search, Sparkles, Menu, LogOut, LayoutDashboard, Shield,
  Bell, ShoppingCart, CheckCheck, Home, TrendingUp, DollarSign,
  Users, Settings, Download, Heart, X,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLogout } from "@workspace/api-client-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, isAdmin, logout, accessToken } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const handleLogoClick = (e: React.MouseEvent) => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 2) {
      e.preventDefault();
      logoClickCount.current = 0;
      navigate("/pvx-admin");
      return;
    }
    logoClickTimer.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 500);
  };

  const { mutate: performLogout } = useLogout({
    mutation: {
      onSuccess: () => logout(),
      onError: () => logout(),
    },
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const { data: recentNotifs } = useQuery({
    queryKey: ["notifications-recent"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?filter=all&page=1", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const unreadCount: number = unreadData?.count ?? 0;
  const recent = (recentNotifs?.notifications ?? []).slice(0, 5);

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
    },
  });

  const handleNotifClick = useCallback((id: number, isRead: boolean) => {
    if (!isRead) markRead.mutate(id);
  }, [markRead]);

  const navLinks = [
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/trending", label: "Trending", icon: TrendingUp },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/creators", label: "Creators", icon: Users },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-border shadow-sm"
            : "bg-transparent border-transparent"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo - double-click to open admin login */}
            <Link href="/" className="flex items-center gap-2 group" aria-label="PromptVault Home" onClick={handleLogoClick}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white hidden sm:block">
                Prompt<span className="text-secondary">Vault</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link href="/search" aria-label="Search" className="p-2 text-muted-foreground hover:text-primary transition-colors hidden sm:block">
                <Search className="w-5 h-5" />
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Cart */}
                  <Link href="/cart" aria-label="Shopping cart">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </Link>

                  {/* Notification Bell */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                      >
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-[440px] overflow-y-auto">
                      <DropdownMenuLabel className="flex items-center justify-between py-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead.mutate()}
                            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                            aria-label="Mark all as read"
                          >
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {recent.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          No notifications yet
                        </div>
                      ) : (
                        recent.map((n: any) => (
                          <DropdownMenuItem key={n.id} asChild>
                            <Link
                              href={n.ctaUrl || "/dashboard/notifications"}
                              onClick={() => handleNotifClick(n.id, n.isRead)}
                            >
                              <div className={cn(
                                "w-full text-left px-1 py-1.5 cursor-pointer rounded-md transition-colors",
                                !n.isRead && "bg-primary/5"
                              )}>
                                <div className="flex items-start gap-2">
                                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs leading-snug", !n.isRead ? "font-semibold text-foreground" : "text-foreground")}>
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/notifications" className="w-full text-center text-xs text-primary font-medium py-1 cursor-pointer">
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Dashboard */}
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="secondary" size="sm" className="hidden lg:flex gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-surface border border-border"
                    aria-label="Log out"
                    onClick={() => performLogout()}
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" aria-label="Log in">
                    <Button variant="ghost" className="hidden sm:flex">Log In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden ml-1"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer — slides in from the right */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px] flex flex-col p-0 gap-0 bg-background border-l border-border">
          {/* Drawer Header */}
          <SheetHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <SheetTitle className="font-display font-bold text-lg tracking-tight text-foreground">
                Prompt<span className="text-secondary">Vault</span>
              </SheetTitle>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label="Close menu">
                <X className="w-4 h-4" />
              </Button>
            </SheetClose>
          </SheetHeader>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-4">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Navigation
              </p>
              <nav className="flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <SheetClose key={href} asChild>
                    <Link
                      href={href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        location === href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </SheetClose>
                ))}

                <SheetClose asChild>
                  <Link
                    href="/search"
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      location === "/search"
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Search className="w-4 h-4 shrink-0" />
                    Search
                  </Link>
                </SheetClose>
              </nav>
            </div>

            {/* Authenticated Links */}
            {isAuthenticated && (
              <div className="px-3 py-2 border-t border-border">
                <p className="px-3 mb-2 mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  My Account
                </p>
                <nav className="flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        location.startsWith("/dashboard")
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      Dashboard
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/dashboard/notifications"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Bell className="w-4 h-4 shrink-0" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/dashboard/purchases"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      My Purchases
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/dashboard/wishlist"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Heart className="w-4 h-4 shrink-0" />
                      Wishlist
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/dashboard/settings"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      Settings
                    </Link>
                  </SheetClose>

                  {isAdmin && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors"
                      >
                        <Shield className="w-4 h-4 shrink-0" />
                        Admin Panel
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </div>
            )}

            {/* Unauthenticated CTAs */}
            {!isAuthenticated && (
              <div className="px-3 py-3 border-t border-border">
                <p className="px-3 mb-2 mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Get Started
                </p>
                <nav className="flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0 rotate-180" />
                      Log In
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/signup" onClick={closeMobileMenu}>
                      <Button className="w-full mt-1" size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Sign Up Free
                      </Button>
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            )}
          </div>

          {/* Drawer Footer — logged-in logout */}
          {isAuthenticated && (
            <div className="px-5 py-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-sm font-semibold text-foreground border border-border">
                  {user?.displayName?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.displayName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  closeMobileMenu();
                  performLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
