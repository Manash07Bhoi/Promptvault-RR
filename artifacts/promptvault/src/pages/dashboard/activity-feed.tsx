import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Package, Star, Heart, UserPlus, Users, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Matches DB user_activity_type enum exactly
const ACTIVITY_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  pack_published:      { icon: Package,  color: "text-violet-500 bg-violet-500/10", label: "published a new pack" },
  pack_updated:        { icon: Package,  color: "text-indigo-500 bg-indigo-500/10", label: "updated their pack" },
  review_posted:       { icon: Star,     color: "text-amber-500 bg-amber-500/10",   label: "left a review" },
  milestone_reached:   { icon: Users,    color: "text-emerald-500 bg-emerald-500/10", label: "reached a milestone" },
  new_follower:        { icon: UserPlus, color: "text-blue-500 bg-blue-500/10",     label: "gained a new follower" },
  collection_created:  { icon: Rss,      color: "text-cyan-500 bg-cyan-500/10",     label: "created a collection" },
  collection_updated:  { icon: Rss,      color: "text-teal-500 bg-teal-500/10",     label: "updated a collection" },
};

export default function ActivityFeedPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const res = await fetch("/api/user/activity", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const activities = data?.activities || [];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Activity Feed</h1>
            <p className="text-muted-foreground text-sm">Latest from people you follow</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl border border-border bg-muted animate-pulse" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Rss className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm mt-1">Follow creators to see their activity here.</p>
            <Link href="/creators"><Button className="mt-4">Discover Creators</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((a: any) => {
              const defaultCfg = { icon: Package, color: "text-muted-foreground bg-muted", label: a.activityType?.replace(/_/g, " ") };
              const cfg = ACTIVITY_ICONS[a.activityType] || defaultCfg;
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={a.userAvatar} />
                    <AvatarFallback className="text-sm font-semibold">{a.userName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <Link href={`/u/${a.userUsername}`} className="font-semibold hover:text-primary transition-colors">
                        {a.userName}
                      </Link>{" "}
                      <span className="text-muted-foreground">{cfg.label}</span>
                    </p>
                    {a.metadata?.packTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-medium">
                        {a.metadata.packTitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
