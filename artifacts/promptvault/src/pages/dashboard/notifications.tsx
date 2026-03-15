import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Bell, CheckCheck, Trash2, Package, Star, Heart, UserPlus,
  ShoppingBag, Info, Megaphone, MessageCircle, Download,
  TrendingUp, Shield, CheckCircle2, XCircle, Flame, Settings, Rss
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Matches DB notification_type enum exactly
const TYPE_CONFIG: Record<string, { icon: any; color: string; category: "social" | "commerce" | "system" }> = {
  new_follower:           { icon: UserPlus,      color: "text-blue-500 bg-blue-500/10",    category: "social"   },
  review_posted:          { icon: Star,          color: "text-amber-500 bg-amber-500/10",  category: "social"   },
  pack_appreciated:       { icon: Heart,         color: "text-pink-500 bg-pink-500/10",    category: "social"   },
  new_comment:            { icon: MessageCircle, color: "text-violet-500 bg-violet-500/10", category: "social"  },
  comment_reply:          { icon: MessageCircle, color: "text-indigo-500 bg-indigo-500/10", category: "social"  },
  new_pack_from_followed: { icon: Rss,           color: "text-cyan-500 bg-cyan-500/10",    category: "social"   },
  collection_updated:     { icon: Package,       color: "text-teal-500 bg-teal-500/10",    category: "social"   },
  new_message:            { icon: MessageCircle, color: "text-blue-400 bg-blue-400/10",    category: "social"   },
  pack_purchase:          { icon: ShoppingBag,   color: "text-green-500 bg-green-500/10",  category: "commerce" },
  price_drop:             { icon: Flame,         color: "text-orange-500 bg-orange-500/10", category: "commerce" },
  download_ready:         { icon: Download,      color: "text-emerald-500 bg-emerald-500/10", category: "commerce" },
  milestone_reached:      { icon: TrendingUp,    color: "text-yellow-500 bg-yellow-500/10", category: "system"  },
  admin_announcement:     { icon: Megaphone,     color: "text-orange-500 bg-orange-500/10", category: "system"  },
  creator_approved:       { icon: CheckCircle2,  color: "text-green-500 bg-green-500/10",  category: "system"   },
  creator_rejected:       { icon: XCircle,       color: "text-red-500 bg-red-500/10",      category: "system"   },
  verification_approved:  { icon: Shield,        color: "text-blue-600 bg-blue-600/10",    category: "system"   },
};

const FALLBACK_CFG = { icon: Info, color: "text-blue-400 bg-blue-400/10", category: "system" as const };

type FilterTab = "all" | "unread" | "social" | "commerce" | "system";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "unread",   label: "Unread" },
  { value: "social",   label: "Social" },
  { value: "commerce", label: "Commerce" },
  { value: "system",   label: "System" },
];

function NotificationItem({
  n, onRead, onDelete
}: {
  n: any;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = TYPE_CONFIG[n.type] || FALLBACK_CFG;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all group",
        n.isRead
          ? "border-border bg-card/50"
          : "border-primary/20 bg-primary/5 shadow-sm"
      )}
    >
      <div className={cn("p-2.5 rounded-xl flex-shrink-0", cfg.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm text-foreground", !n.isRead && "font-semibold")}>
              {n.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {n.body}
            </p>
          </div>
          {!n.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
          {n.ctaUrl && (
            <Link href={n.ctaUrl}>
              <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                {n.ctaLabel || "View"}
              </Button>
            </Link>
          )}
          {!n.isRead && (
            <button
              onClick={() => onRead(n.id)}
              className="text-xs text-primary hover:underline"
            >
              Mark read
            </button>
          )}
          <button
            onClick={() => onDelete(n.id)}
            className="text-xs text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Determine API filter parameter based on active tab
  const apiFilter = activeTab === "unread" ? "unread" : "all";

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({ filter: apiFilter, page: "1" });
      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount: number = unreadData?.count ?? 0;

  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const allNotifications: any[] = data?.notifications ?? [];

  // Client-side category filter for social/commerce/system tabs
  const filteredNotifications = (() => {
    if (activeTab === "all" || activeTab === "unread") return allNotifications;
    return allNotifications.filter(n => {
      const cfg = TYPE_CONFIG[n.type] || FALLBACK_CFG;
      return cfg.category === activeTab;
    });
  })();

  const isEmpty = !isLoading && filteredNotifications.length === 0;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {data?.total ?? 0} total notification{(data?.total ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Link href="/dashboard/settings?tab=notifications">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as FilterTab)}
        >
          <TabsList className="w-full sm:w-auto">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 sm:flex-none">
                {tab.label}
                {tab.value === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-[84px] rounded-xl border border-border bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground">You're all caught up!</p>
            <p className="text-sm mt-1">
              No{" "}
              {activeTab === "unread"
                ? "unread "
                : activeTab !== "all"
                ? `${activeTab} `
                : ""}
              notifications yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n: any) => (
              <NotificationItem
                key={n.id}
                n={n}
                onRead={id => readMutation.mutate(id)}
                onDelete={id => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!isLoading && filteredNotifications.length > 0 && (data?.total ?? 0) > filteredNotifications.length && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              Load more
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
