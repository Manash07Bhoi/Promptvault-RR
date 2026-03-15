import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Download, Package, Star, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export default function AdminCreatorsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: applications } = useQuery({
    queryKey: ["admin-creator-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/creators/applications", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const { data: creators } = useQuery({
    queryKey: ["admin-creators"],
    queryFn: async () => {
      const res = await fetch("/api/admin/creators", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/creators/${userId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Creator approved!" });
      qc.invalidateQueries({ queryKey: ["admin-creator-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-creators"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const res = await fetch(`/api/admin/creators/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Application rejected" });
      setRejectDialog(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-creator-applications"] });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Creator Management</h1>
          <p className="text-muted-foreground text-sm">Review applications and manage existing creators</p>
        </div>

        <Tabs defaultValue="applications">
          <TabsList>
            <TabsTrigger value="applications">
              Applications
              {applications?.applications?.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white text-xs">{applications.applications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="creators">All Creators ({creators?.creators?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            {!applications?.applications?.length ? (
              <div className="rounded-xl border border-border p-10 text-center text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No pending applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.applications.map((app: any) => (
                  <div key={app.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={app.applicantAvatar} />
                          <AvatarFallback>{app.applicantName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{app.applicantName}</p>
                          <p className="text-sm text-muted-foreground">{app.applicantEmail}</p>
                          <p className="text-xs text-muted-foreground mt-1">Applied {formatDate(app.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(app.userId)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => setRejectDialog({ id: app.userId, name: app.applicantName })}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                    {app.bio && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm text-foreground">{app.bio}</p>
                      </div>
                    )}
                    {app.specialties?.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {app.specialties.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="creators" className="mt-6">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Creator</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Packs</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Downloads</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(creators?.creators || []).map((c: any) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={c.avatarUrl} />
                              <AvatarFallback className="text-xs">{c.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{c.displayName}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{c.publicPackCount || 0}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{(c.totalDownloadsAllPacks || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="outline">{c.commissionRate || 70}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              You're rejecting {rejectDialog?.name}'s creator application. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ userId: rejectDialog!.id, reason: rejectReason })}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
