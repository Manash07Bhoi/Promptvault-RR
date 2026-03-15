import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Check, X, CheckCircle2, Eye, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useGetModerationQueue } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function moderatePack(packId: number, action: "approve" | "reject", token: string, notes?: string) {
  const res = await fetch(`${BASE}/api/admin/moderation/${packId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchPackDetail(packId: number, token: string) {
  const res = await fetch(`${BASE}/api/admin/packs/${packId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function ApprovalQueuePage() {
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [packDetail, setPackDetail] = useState<any | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const { data: queueResponse, isLoading } = useGetModerationQueue();

  const handleOpenPack = async (pack: any) => {
    setSelectedPack(pack);
    setPackDetail(null);
    setRejectNotes("");
    setLoadingDetail(true);
    try {
      const detail = await fetchPackDetail(pack.id, accessToken || "");
      setPackDetail(detail);
    } catch {
      // Use list data
    } finally {
      setLoadingDetail(false);
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (packId: number) => {
      return moderatePack(packId, "approve", accessToken || "");
    },
    onSuccess: () => {
      toast.success("Pack approved and published to the marketplace!");
      setSelectedPack(null);
      setPackDetail(null);
      queryClient.invalidateQueries({ queryKey: ["moderationQueue"] });
      queryClient.invalidateQueries({ queryKey: ["adminPacks"] });
    },
    onError: (err: any) => {
      toast.error("Failed to approve pack: " + (err.message || "Unknown error"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ packId, notes }: { packId: number; notes: string }) => {
      return moderatePack(packId, "reject", accessToken || "", notes);
    },
    onSuccess: () => {
      toast.success("Pack rejected and moved to rejected queue.");
      setSelectedPack(null);
      setPackDetail(null);
      queryClient.invalidateQueries({ queryKey: ["moderationQueue"] });
    },
    onError: (err: any) => {
      toast.error("Failed to reject pack: " + (err.message || "Unknown error"));
    },
  });

  const packs = queueResponse?.packs || [];
  const displayDetail = packDetail || selectedPack;
  const isActing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Approval Queue</h1>
            <p className="text-muted-foreground mt-1">Review and approve AI-generated prompt packs before they go live</p>
          </div>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-base px-4 py-2">
            {packs.length} Pending
          </Badge>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading approval queue...
            </div>
          ) : packs.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Queue is empty</h3>
              <p className="text-muted-foreground max-w-xs">All caught up! No packs are pending review right now. Trigger new automation jobs to generate more packs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Pack Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Prompts</TableHead>
                  <TableHead>AI Tools</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {packs.map((pack) => (
                    <TableRow key={pack.id} className="border-border group">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{pack.title}</p>
                          {pack.shortDescription && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pack.shortDescription}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pack.categoryName || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">{pack.promptCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(pack.aiToolTargets || []).slice(0, 2).map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(pack.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0"
                            onClick={() => approveMutation.mutate(pack.id)}
                            disabled={isActing}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPack(pack)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            </div>
          )}
        </div>

        {/* Review Sheet */}
        <Sheet open={!!selectedPack} onOpenChange={(o) => { if (!o) { setSelectedPack(null); setPackDetail(null); } }}>
          <SheetContent className="sm:max-w-2xl w-full border-l border-border bg-card overflow-y-auto p-0">
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-5">
              <SheetHeader>
                <SheetTitle className="text-xl font-display">{selectedPack?.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <Badge variant="outline">{selectedPack?.categoryName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedPack?.promptCount} prompts · Created {selectedPack && new Date(selectedPack.createdAt).toLocaleDateString()}
                  </span>
                </SheetDescription>
              </SheetHeader>
            </div>

            {selectedPack && (
              <div className="p-6 space-y-6">

                {/* Pack info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Price</p>
                    <p className="font-bold text-lg">{selectedPack.isFree ? "Free" : `$${((selectedPack.priceCents || 0) / 100).toFixed(2)}`}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">AI Tools</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedPack.aiToolTargets || []).map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{displayDetail?.description || displayDetail?.shortDescription || "No description available."}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Prompts ({loadingDetail ? "..." : (displayDetail?.prompts?.length || displayDetail?.promptCount || 0)})
                  </h4>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading prompts...
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {(displayDetail?.prompts || []).map((p: any, i: number) => (
                        <div key={p.id || i} className="p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-primary font-bold">#{i + 1}</span>
                            <span className="font-semibold text-sm">{p.title}</span>
                            {p.aiTool && <Badge variant="outline" className="text-[10px] py-0">{p.aiTool}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-3">{p.body}</p>
                        </div>
                      ))}
                      {(!displayDetail?.prompts || displayDetail.prompts.length === 0) && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          Prompts will load when you open the full pack view
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Moderation actions */}
                <div className="pt-6 border-t border-border space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Moderation Decision</h4>

                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 font-semibold"
                    onClick={() => approveMutation.mutate(selectedPack.id)}
                    disabled={isActing}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Approve & Publish to Marketplace
                  </Button>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Rejection reason (required)</label>
                    <textarea
                      className="w-full h-24 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                      placeholder="Describe what needs to be improved before approval..."
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      className="w-full h-11"
                      onClick={() => rejectMutation.mutate({ packId: selectedPack.id, notes: rejectNotes })}
                      disabled={!rejectNotes.trim() || isActing}
                    >
                      {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                      Reject — Request Revision
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
