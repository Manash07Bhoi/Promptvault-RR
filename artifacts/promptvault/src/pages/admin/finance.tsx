import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, Users, ShoppingBag, Download } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const CHART_COLORS = ["hsl(var(--primary))", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function AdminFinancePage() {
  const { accessToken } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["admin-finance"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const ordersByDay = data?.ordersByDay || [];
  const categoryRevenue = data?.categoryRevenue || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Revenue analytics and payout overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: formatPrice(stats.totalRevenueCents || 0), icon: DollarSign, color: "text-green-500 bg-green-500/10" },
            { label: "Total Orders", value: (stats.totalOrders || 0).toLocaleString(), icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10" },
            { label: "Total Users", value: (stats.totalUsers || 0).toLocaleString(), icon: Users, color: "text-violet-500 bg-violet-500/10" },
            { label: "Total Downloads", value: (stats.totalDownloads || 0).toLocaleString(), icon: Download, color: "text-amber-500 bg-amber-500/10" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue Over Time */}
        {ordersByDay.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-6">Daily Revenue (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ordersByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Revenue */}
        {categoryRevenue.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-6">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryRevenue} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                    {categoryRevenue.map((_: any, index: number) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
              <div className="space-y-2">
                {recentOrders.slice(0, 8).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium truncate max-w-[180px]">{o.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{o.status}</p>
                    </div>
                    <span className="font-mono font-medium text-green-500">{formatPrice(o.totalCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!ordersByDay.length && !categoryRevenue.length && (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No financial data yet. Revenue charts will appear here as orders come in.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
