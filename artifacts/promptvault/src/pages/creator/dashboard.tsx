import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Package, DollarSign, Download, Star, TrendingUp, Plus,
  Eye, Edit, BarChart2, ArrowRight, Zap
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "bg-green-500/10 text-green-500",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-500",
  DRAFT: "bg-muted text-muted-foreground",
  REJECTED: "bg-red-500/10 text-red-500",
};

export default function CreatorDashboardPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/creator/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
      </div>
    </DashboardLayout>
  );

  const packs = data?.packs || [];
  const revenue = data?.revenue || {};

  const stats = [
    { label: "Total Packs", value: packs.length, icon: Package, color: "from-primary to-violet-600" },
    { label: "This Month", value: formatPrice(revenue.last30DaysCents || 0), icon: DollarSign, color: "from-green-500 to-emerald-600" },
    { label: "Lifetime Revenue", value: formatPrice(revenue.lifetimeCents || 0), icon: TrendingUp, color: "from-amber-500 to-orange-600" },
    { label: "Orders (30d)", value: revenue.last30DaysOrders || 0, icon: Zap, color: "from-secondary to-cyan-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your packs and track revenue</p>
          </div>
          <div className="flex gap-3">
            <Link href="/creator/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart2 className="w-4 h-4" /> Analytics
              </Button>
            </Link>
            <Link href="/creator/packs/new">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> New Pack
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br mb-3 flex items-center justify-center", s.color)}>
                  <s.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Packs Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Packs</h2>
          </div>

          {packs.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-foreground mb-2">No packs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first prompt pack and start earning.</p>
              <Link href="/creator/packs/new"><Button className="gap-2"><Plus className="w-4 h-4" /> Create First Pack</Button></Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pack</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Status</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Views</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Sales</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Revenue</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packs.map((pack: any, i: number) => (
                      <motion.tr
                        key={pack.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {pack.thumbnailUrl && (
                              <img src={pack.thumbnailUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{pack.title}</p>
                              <p className="text-xs text-muted-foreground">{formatPrice(pack.priceCents)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOR[pack.status] || "bg-muted text-muted-foreground")}>
                            {pack.status?.replace("_", " ") || "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{(pack.viewCount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{(pack.totalDownloads || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatPrice(pack.totalRevenueCents || 0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link href={`/packs/${pack.slug}`}>
                              <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                            </Link>
                            <Link href={`/creator/packs/${pack.id}/edit`}>
                              <Button size="icon" variant="ghost" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/creator/analytics">
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Analytics</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/creator/payouts">
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="font-medium text-foreground">Payouts</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/creator/settings">
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-foreground">Creator Settings</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
