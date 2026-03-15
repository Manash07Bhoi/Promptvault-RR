import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminListPacks, useAdminUpdatePackStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Package, Plus, Edit, TrendingUp } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  DRAFT: "bg-muted text-muted-foreground border-border",
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default function AdminPacks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data, isLoading, refetch } = useAdminListPacks({
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });
  const { mutateAsync: updateStatus } = useAdminUpdatePackStatus();

  const handleStatusChange = async (packId: number, status: string) => {
    try {
      await updateStatus({ id: packId, data: { status: status as any } });
      toast.success("Status updated");
      refetch();
    } catch { toast.error("Failed to update status"); }
  };

  const packs = (data as any)?.packs || data || [];
  const statuses = ["ALL", "PUBLISHED", "DRAFT", "PENDING_REVIEW", "REJECTED", "ARCHIVED"];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Pack Management</h1>
            <p className="text-sm text-muted-foreground">Manage all prompt packs on the platform</p>
          </div>
          <Link href="/admin/automation">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />New Pack
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search packs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="px-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-shimmer" />)}
              </div>
            ) : !Array.isArray(packs) || packs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No packs found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4">Pack</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-center">Prompts</div>
                  <div className="col-span-1 text-center">Price</div>
                  <div className="col-span-1 text-center hidden xl:block">Downloads</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {packs.map((pack: any, i: number) => (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/3 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {pack.thumbnailUrl ? (
                        <img src={pack.thumbnailUrl} alt={pack.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{pack.title}</p>
                        <p className="text-xs text-muted-foreground">{pack.categoryName}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Select defaultValue={pack.status} onValueChange={(v) => handleStatusChange(pack.id, v)}>
                        <SelectTrigger className="h-8 text-xs bg-transparent border-0 p-0">
                          <Badge className={`text-xs ${statusColors[pack.status] || statusColors.DRAFT}`}>
                            {pack.status?.replace("_", " ")}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"].map(s => (
                            <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 text-center text-sm">{pack.promptCount}</div>
                    <div className="col-span-1 text-center text-sm">{pack.isFree ? "Free" : formatPrice(pack.priceCents)}</div>
                    <div className="col-span-1 text-center text-sm hidden xl:flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      {pack.totalDownloads || 0}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">{formatDate(pack.createdAt)}</div>
                    <div className="col-span-1 flex justify-end">
                      <Link href={`/admin/packs/${pack.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
}
