import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Navbar } from "./navbar";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, Users, Cpu, CheckCircle, Tag, DollarSign,
  HardDrive, BarChart2, Bell, Settings, Layers, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    ]
  },
  {
    label: "Content",
    items: [
      { href: "/admin/packs", label: "Packs", icon: Package },
      { href: "/admin/approval", label: "Approval Queue", icon: CheckCircle },
      { href: "/admin/categories", label: "Categories", icon: Tag },
    ]
  },
  {
    label: "Automation",
    items: [
      { href: "/admin/automation", label: "Job Queue", icon: Cpu },
      { href: "/admin/files", label: "Files", icon: HardDrive },
    ]
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/pricing", label: "Pricing & Coupons", icon: DollarSign },
      { href: "/admin/users", label: "Users", icon: Users },
    ]
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ]
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? location === href : location.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-border bg-card shrink-0 hidden md:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
          <nav className="p-3 flex-1 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}>
                      <a className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive(href)
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col overflow-y-auto shadow-2xl pt-16">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Admin Panel</p>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 flex-1 space-y-4">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href}>
                          <a
                            onClick={() => setMobileSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                              isActive(href)
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}>
                            <Icon className="w-4 h-4" />
                            {label}
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Mobile Admin Top Nav Bar */}
          <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-card/80 sticky top-0 z-10 backdrop-blur-md">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
              <span className="text-xs font-medium">Menu</span>
            </Button>
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1 min-w-max">
                {allNavItems.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <a className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                      isActive(href)
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}>
                      <Icon className="w-3 h-3" />
                      {label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 sm:p-6 md:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
