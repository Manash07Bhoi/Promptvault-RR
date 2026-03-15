import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Users, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: analytics, isLoading, isError, refetch } = useGetAdminAnalytics(
    { period },
    { query: { queryKey: ["adminAnalytics", period] } }
  );

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive opacity-60" />
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const revenueData = analytics?.revenueByDay || [];
  const topPacks = analytics?.topPacks || [];
  const searchTerms = analytics?.searchTerms || [];

  const stats = [
    { title: "Revenue", value: formatPrice(analytics?.totalRevenueCents || 0), icon: TrendingUp, color: "bg-emerald-500/20 text-emerald-400" },
    { title: "Orders", value: analytics?.totalOrders ?? 0, icon: ShoppingCart, color: "bg-blue-500/20 text-blue-400" },
    { title: "Downloads", value: analytics?.totalDownloads ?? 0, icon: Download, color: "bg-purple-500/20 text-purple-400" },
    { title: "New Users", value: analytics?.newUsers ?? 0, icon: Users, color: "bg-orange-500/20 text-orange-400" },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">Platform performance and insights</p>
          </div>
          <div className="flex gap-1 bg-card p-1 rounded-lg border border-border">
            {(["7d", "30d", "90d"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />)
            : stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{s.title}</p>
                      <h3 className="text-xl font-bold">{s.value}</h3>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
          }
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" /> Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[240px] bg-muted/20 rounded-lg animate-pulse" />
              ) : revenueData.length === 0 ? (
                <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No revenue data for this period</p>
                </div>
              ) : (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => String(v).slice(5)} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(Number(v) / 100).toFixed(0)}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [formatPrice(value), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenueCents" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="w-4 h-4 text-secondary" /> Orders Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[240px] bg-muted/20 rounded-lg animate-pulse" />
              ) : revenueData.length === 0 ? (
                <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ShoppingCart className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No order data for this period</p>
                </div>
              ) : (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => String(v).slice(5)} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [value, 'Orders']}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Performing Packs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)}
                </div>
              ) : topPacks.length === 0 ? (
                <div className="py-16 text-center">
                  <Download className="w-8 h-8 text-muted-foreground opacity-30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No published packs yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Pack</TableHead>
                      <TableHead className="text-right">Downloads</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPacks.map((pack: any) => (
                      <TableRow key={pack.id} className="border-border">
                        <TableCell className="font-medium text-sm max-w-[180px] truncate">{pack.title}</TableCell>
                        <TableCell className="text-right text-sm">{pack.totalDownloads}</TableCell>
                        <TableCell className="text-right text-sm text-emerald-400">{formatPrice(pack.totalRevenueCents)}</TableCell>
                        <TableCell className="text-right">
                          {pack.avgRating ? (
                            <Badge variant="outline" className="text-xs">⭐ {Number(pack.avgRating).toFixed(1)}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Search Terms</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />)}
                </div>
              ) : searchTerms.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">No search data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchTerms.map((term: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <span className="text-sm font-medium">{term.term}</span>
                      <Badge variant="secondary" className="text-xs">{term.count} searches</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
