import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Flag, CheckCircle, Trash2, AlertTriangle, MessageSquare, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminModerationPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: flaggedComments } = useQuery({
    queryKey: ["admin-flagged-comments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/comments/flagged", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { comments: [] };
      return res.json();
    },
  });

  const { data: pendingPacks } = useQuery({
    queryKey: ["admin-pending-packs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/packs?status=PENDING_REVIEW", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { packs: [] };
      return res.json();
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Moderation Queue</h1>
          <p className="text-muted-foreground text-sm">Review flagged content and pending submissions</p>
        </div>

        <Tabs defaultValue="packs">
          <TabsList>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="w-4 h-4" /> Pending Packs
              {pendingPacks?.packs?.length > 0 && <Badge className="bg-amber-500 text-white text-xs">{pendingPacks.packs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Flagged Comments
              {flaggedComments?.comments?.length > 0 && <Badge className="bg-red-500 text-white text-xs">{flaggedComments.comments.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packs" className="mt-6">
            {!pendingPacks?.packs?.length ? (
              <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No packs pending review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPacks.packs.map((pack: any) => (
                  <div key={pack.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{pack.title}</p>
                      <p className="text-sm text-muted-foreground">{pack.creatorEmail} · Submitted {formatDate(pack.updatedAt)}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{pack.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/admin/packs/${pack.id}/edit`}>Review</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            {!flaggedComments?.comments?.length ? (
              <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No flagged comments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedComments.comments.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Flag className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs text-red-500 font-medium">Flagged</span>
                        </div>
                        <p className="text-sm text-foreground">{c.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">by {c.authorUsername}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">Clear Flag</Button>
                        <Button size="sm" variant="destructive" className="text-xs gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
