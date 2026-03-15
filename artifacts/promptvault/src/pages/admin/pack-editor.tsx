import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetPack, useAdminUpdatePack } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Package, FileText, CheckCircle, Clock } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface Props { id: string; }

const AI_TOOLS = ["ChatGPT", "Claude", "Midjourney", "DALL-E 3", "Gemini", "Stable Diffusion"];

export default function AdminPackEditor({ id }: Props) {
  const { data: pack, isLoading, refetch } = useAdminGetPack(Number(id));
  const { mutateAsync: updatePack, isPending } = useAdminUpdatePack();
  const [form, setForm] = useState<any>({});
  const savedFormRef = useRef<any>({});
  const isDirty = useRef(false);

  useEffect(() => {
    if (pack) {
      const initial = {
        title: pack.title || "",
        shortDescription: pack.shortDescription || "",
        description: pack.description || "",
        priceCents: pack.priceCents || 0,
        comparePriceCents: pack.comparePriceCents || 0,
        status: pack.status || "DRAFT",
        aiToolTargets: pack.aiToolTargets || [],
        tags: (pack.tags || []).join(", "),
        isFree: pack.isFree || false,
        isFeatured: pack.isFeatured || false,
        isBestseller: pack.isBestseller || false,
      };
      setForm(initial);
      savedFormRef.current = initial;
      isDirty.current = false;
    }
  }, [pack]);

  // Mark dirty when form changes from saved state
  const updateForm = useCallback((updater: (prev: any) => any) => {
    setForm((prev: any) => {
      const next = updater(prev);
      isDirty.current = JSON.stringify(next) !== JSON.stringify(savedFormRef.current);
      return next;
    });
  }, []);

  // Unsaved changes warning on navigation away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleSave = async () => {
    if (isPending) return;
    try {
      await updatePack({
        id: Number(id),
        data: {
          ...form,
          priceCents: Number(form.priceCents),
          comparePriceCents: Number(form.comparePriceCents) || undefined,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        }
      });
      savedFormRef.current = { ...form };
      isDirty.current = false;
      toast.success("Pack saved successfully");
      refetch();
    } catch { toast.error("Failed to save pack"); }
  };

  const toggleAiTool = (tool: string) => {
    updateForm((prev: any) => ({
      ...prev,
      aiToolTargets: prev.aiToolTargets.includes(tool)
        ? prev.aiToolTargets.filter((t: string) => t !== tool)
        : [...prev.aiToolTargets, tool],
    }));
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  if (!pack) {
    return <AdminLayout><div className="text-center py-16"><p className="text-muted-foreground">Pack not found</p><Link href="/admin/packs"><Button variant="outline" className="mt-4">Back to Packs</Button></Link></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin/packs">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold">Edit Pack</h1>
              <p className="text-sm text-muted-foreground">#{pack.id} · {pack.slug}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Metadata */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Pack Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Title</label>
                  <Input value={form.title || ""} onChange={(e) => updateForm((p: any) => ({ ...p, title: e.target.value }))} className="bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Short Description</label>
                  <Input value={form.shortDescription || ""} onChange={(e) => updateForm((p: any) => ({ ...p, shortDescription: e.target.value }))} className="bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Full Description</label>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => updateForm((p: any) => ({ ...p, description: e.target.value }))}
                    rows={6}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Tags (comma-separated)</label>
                  <Input value={form.tags || ""} onChange={(e) => updateForm((p: any) => ({ ...p, tags: e.target.value }))} placeholder="marketing, copywriting, seo..." className="bg-background" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle>AI Tool Targets</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {AI_TOOLS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleAiTool(tool)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${(form.aiToolTargets || []).includes(tool) ? "bg-primary/20 text-primary border-primary/40" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Prompts List */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Prompts ({pack.prompts?.length || pack.promptCount || 0})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(pack as any).prompts?.length ? (
                  (pack as any).prompts.map((prompt: any, i: number) => (
                    <div key={prompt.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                      <span className="text-xs text-muted-foreground mt-0.5 w-5 shrink-0">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{prompt.title || `Prompt ${i + 1}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{prompt.promptBody}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No prompts added yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Settings */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Status & Visibility</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Status</label>
                  <Select value={form.status} onValueChange={(v) => updateForm((p: any) => ({ ...p, status: v }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"].map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "isFree", label: "Free Pack" },
                    { key: "isFeatured", label: "Featured" },
                    { key: "isBestseller", label: "Bestseller" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form[key] || false} onChange={(e) => updateForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Price (cents)</label>
                  <Input type="number" value={form.priceCents || 0} onChange={(e) => updateForm((p: any) => ({ ...p, priceCents: e.target.value }))} className="bg-background" disabled={form.isFree} />
                  <p className="text-xs text-muted-foreground mt-1">{formatPrice(Number(form.priceCents) || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Compare Price (cents)</label>
                  <Input type="number" value={form.comparePriceCents || 0} onChange={(e) => updateForm((p: any) => ({ ...p, comparePriceCents: e.target.value }))} className="bg-background" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Total Downloads", value: pack.totalDownloads || 0 },
                  { label: "Total Revenue", value: formatPrice(pack.totalRevenueCents || 0) },
                  { label: "Avg Rating", value: pack.avgRating ? `${pack.avgRating.toFixed(1)} ★` : "N/A" },
                  { label: "Reviews", value: pack.reviewCount || 0 },
                  { label: "Created", value: formatDate(pack.createdAt) },
                  { label: "Published", value: pack.publishedAt ? formatDate(pack.publishedAt) : "Not yet" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
