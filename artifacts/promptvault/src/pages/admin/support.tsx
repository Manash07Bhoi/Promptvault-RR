import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  resolved: "bg-green-500/10 text-green-500",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminSupportPage() {
  const { accessToken } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState("open");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/support?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { tickets: [] };
      return res.json();
    },
  });

  const tickets = data?.tickets || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Customer Support</h1>
            <p className="text-muted-foreground text-sm">Manage support tickets and user enquiries</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Open", count: 0, icon: AlertCircle, color: "text-amber-500 bg-amber-500/10" },
            { label: "In Progress", count: 0, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
            { label: "Resolved", count: 0, icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
            { label: "Avg Response", count: "—", icon: Headphones, color: "text-violet-500 bg-violet-500/10" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className={cn("w-8 h-8 rounded-lg mb-2 flex items-center justify-center", s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-mono font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tickets */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Headphones className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No {statusFilter} tickets</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ticket</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">User</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{t.subject}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.body}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.userEmail}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{t.category}</Badge></td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOR[t.status])}>
                          {t.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
