import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Star, Download, Eye, Heart, DollarSign, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatorAnalyticsPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/creator/analytics", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const packs = data?.packs || [];

  const totalViews = packs.reduce((s: number, p: any) => s + (p.viewCount || 0), 0);
  const totalSales = packs.reduce((s: number, p: any) => s + (p.totalDownloads || 0), 0);
  const totalRevenue = packs.reduce((s: number, p: any) => s + (p.totalRevenueCents || 0), 0);
  const avgRating = packs.length ? (packs.reduce((s: number, p: any) => s + (p.avgRating || 0), 0) / packs.length).toFixed(1) : "—";

  const chartData = packs.slice(0, 8).map((p: any) => ({
    name: p.title?.slice(0, 15) + (p.title?.length > 15 ? "…" : ""),
    revenue: (p.totalRevenueCents || 0) / 100,
    downloads: p.totalDownloads || 0,
    views: p.viewCount || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <Link href="/creator">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Creator Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Performance metrics across all your packs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500 bg-blue-500/10" },
            { label: "Total Downloads", value: totalSales.toLocaleString(), icon: Download, color: "text-green-500 bg-green-500/10" },
            { label: "Avg Rating", value: avgRating, icon: Star, color: "text-amber-500 bg-amber-500/10" },
            { label: "Lifetime Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-violet-500 bg-violet-500/10" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className={cn("w-9 h-9 rounded-lg mb-3 flex items-center justify-center", s.color)}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue by Pack */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-6">Revenue by Pack</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pack Performance Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pack</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Views</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Downloads</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Rating</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.status}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(p.viewCount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(p.totalDownloads || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {p.avgRating ? (
                        <span className="flex items-center justify-end gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" /> {Number(p.avgRating).toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatPrice(p.totalRevenueCents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
