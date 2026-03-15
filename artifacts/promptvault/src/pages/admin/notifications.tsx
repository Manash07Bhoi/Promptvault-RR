import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Package, Users, AlertCircle, DollarSign, Cpu, Loader2, RefreshCw } from "lucide-react";
import { useGetAdminDashboard, useListAutomationJobs } from "@workspace/api-client-react";

interface Notification {
  id: string;
  type: "order" | "user" | "pack" | "error" | "automation";
  message: string;
  detail: string;
  timestamp: string;
  read: boolean;
}

const typeConfig = {
  order: { icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/15" },
  user: { icon: Users, color: "text-blue-400", bg: "bg-blue-400/15" },
  pack: { icon: Package, color: "text-primary", bg: "bg-primary/15" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/15" },
  automation: { icon: Cpu, color: "text-secondary", bg: "bg-secondary/15" },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminNotifications() {
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useGetAdminDashboard({
    query: { queryKey: ["adminDashboard"], staleTime: 30000 }
  });

  const { data: jobsData, isLoading: jobsLoading } = useListAutomationJobs(
    {},
    { query: { queryKey: ["automationJobs", "recent"], staleTime: 30000 } }
  );

  const isLoading = dashLoading || jobsLoading;

  const notifications: Notification[] = [];

  (dashboard?.recentOrders || []).slice(0, 5).forEach((order: any, i: number) => {
    notifications.push({
      id: `order-${order.id}`,
      type: "order",
      message: `New order #${order.id}`,
      detail: `Order completed — ${order.totalCents > 0 ? `$${(order.totalCents / 100).toFixed(2)}` : "Free"}`,
      timestamp: order.createdAt || new Date().toISOString(),
      read: false,
    });
  });

  const jobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : Array.isArray(jobsData) ? jobsData : [];
  jobs.slice(0, 5).forEach((job: any) => {
    const isFailed = job.status === "FAILED" || job.status === "DEAD";
    notifications.push({
      id: `job-${job.id}`,
      type: isFailed ? "error" : "automation",
      message: isFailed ? "Automation job failed" : `Job ${job.status.toLowerCase()}`,
      detail: `${job.jobType} — ${job.status}${job.errorMessage ? `: ${job.errorMessage.slice(0, 80)}` : ""}`,
      timestamp: job.startedAt || job.createdAt || new Date().toISOString(),
      read: job.status === "COMPLETED",
    });
  });

  if ((dashboard?.pendingModerationCount ?? 0) > 0) {
    notifications.push({
      id: "moderation-pending",
      type: "pack",
      message: "Packs pending review",
      detail: `${dashboard!.pendingModerationCount} pack${dashboard!.pendingModerationCount! > 1 ? "s" : ""} waiting for approval in the moderation queue`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = notifications.filter(n => !n.read && !readSet.has(n.id)).length;

  const markAllRead = () => setReadSet(new Set(notifications.map(n => n.id)));
  const markRead = (id: string) => setReadSet(prev => new Set([...prev, id]));

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-sm">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetchDash()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="px-0 py-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Bell className="w-12 h-12 opacity-20" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-xs">Activity will appear here as orders are placed and jobs run</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((n, i) => {
                  const cfg = typeConfig[n.type];
                  const isRead = n.read || readSet.has(n.id);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => markRead(n.id)}
                      className={`flex items-start gap-4 px-6 py-5 cursor-pointer transition-colors hover:bg-white/3 ${!isRead ? "border-l-2 border-primary" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium text-sm ${!isRead ? "text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.detail}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">{timeAgo(n.timestamp)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
}
