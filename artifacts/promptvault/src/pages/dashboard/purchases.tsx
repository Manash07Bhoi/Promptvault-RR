import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetUserPurchases } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Download, Eye, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DashboardPurchases() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetUserPurchases();
  const orders = data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">My Purchases</h1>
          <p className="text-muted-foreground">All your orders and purchased prompt packs</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold mb-2">No purchases yet</h3>
            <p className="text-muted-foreground mb-6">Browse our marketplace and find your first prompt pack</p>
            <Link href="/explore"><Button>Browse Packs</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors"
              >
                {/* Order header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">Order #{order.id}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.status === "COMPLETED" ? "default" : "outline"}>
                      {order.status}
                    </Badge>
                    <span className="font-bold text-lg text-foreground">{formatPrice(order.totalCents)}</span>
                  </div>
                </div>

                {/* Order items */}
                <div className="p-5">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">📦</div>
                        <span className="text-sm text-foreground font-medium">{item.titleSnapshot || "Prompt Pack"}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatPrice(item.priceCents)}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                    {order.status === "COMPLETED" && (
                      <Link href="/dashboard/downloads">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button size="sm" variant="ghost" className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
