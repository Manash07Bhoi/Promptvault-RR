import { useGetAdminDashboard } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Package, Activity, AlertCircle, ShoppingCart, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const kpis = [
    { title: "Total Revenue", value: formatPrice(dashboard?.totalRevenueCents || 0), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/15" },
    { title: "Total Orders", value: dashboard?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-400/15" },
    { title: "Total Users", value: dashboard?.totalUsers || 0, icon: Users, color: "text-purple-400", bg: "bg-purple-400/15" },
    { title: "Published Packs", value: dashboard?.publishedPacks || 0, icon: Package, color: "text-orange-400", bg: "bg-orange-400/15" },
    { title: "Active Jobs", value: dashboard?.activeJobsCount || 0, icon: Activity, color: "text-secondary", bg: "bg-secondary/15" },
    { title: "Pending Review", value: dashboard?.pendingModerationCount || 0, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/15" },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Overview</h1>
            <p className="text-sm text-muted-foreground">PromptVault admin dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-sm text-muted-foreground">System <span className="text-emerald-400 font-semibold">Operational</span></span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">{kpi.title}</p>
                  <h3 className="text-xl font-bold">{kpi.value}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Revenue (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard?.revenueByDay || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 100}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatPrice(value), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenueCents" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-border/40">
                {dashboard?.recentOrders?.slice(0, 6).map(order => (
                  <div key={order.id} className="flex justify-between items-center px-6 py-3 hover:bg-white/3 transition-colors">
                    <div>
                      <p className="font-medium text-sm">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">User {order.userId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-400">{formatPrice(order.totalCents)}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{order.status}</Badge>
                    </div>
                  </div>
                ))}
                {(!dashboard?.recentOrders || dashboard.recentOrders.length === 0) && (
                  <div className="px-6 py-10 text-center text-sm text-muted-foreground">No recent orders.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
