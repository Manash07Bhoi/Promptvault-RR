import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { X, Plus, ArrowRight, Loader2, Package, ArrowLeft } from "lucide-react";
import { useListCategories } from "@workspace/api-client-react";

const AI_TOOLS = ["ChatGPT", "Claude", "Gemini", "Midjourney", "DALL-E", "Stable Diffusion", "Perplexity", "Copilot", "Llama", "Mistral"];
const STEP_LABELS = ["Basic Info", "Pricing", "Review"];

export default function CreatorNewPackPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: cats } = useListCategories();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "",
    categoryId: "", priceCents: 999, isFree: false,
    tags: [] as string[], aiToolTargets: [] as string[],
    tagInput: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Pack created!", description: "It's now in review." });
      navigate(`/creator/dashboard`);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addTag = () => {
    const v = form.tagInput.trim().toLowerCase();
    if (v && !form.tags.includes(v) && form.tags.length < 10) {
      setForm(f => ({ ...f, tags: [...f.tags, v], tagInput: "" }));
    }
  };

  const toggleTool = (tool: string) => {
    setForm(f => ({
      ...f,
      aiToolTargets: f.aiToolTargets.includes(tool)
        ? f.aiToolTargets.filter(t => t !== tool)
        : [...f.aiToolTargets, tool],
    }));
  };

  const canProceed = step === 0
    ? form.title.length >= 5 && form.description.length >= 20 && !!form.categoryId
    : step === 1
      ? true
      : true;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-8">
        {/* Steps */}
        <div>
          <Link href="/creator">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Creator Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">Create New Pack</h1>
          <div className="flex items-center gap-2 mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label>Pack Title *</Label>
              <Input className="mt-1.5" placeholder="e.g. 50 ChatGPT Marketing Prompts" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={120} />
              <p className="text-xs text-muted-foreground mt-1">{form.title.length}/120 – Be specific and descriptive</p>
            </div>
            <div>
              <Label>Short Description *</Label>
              <Input className="mt-1.5" placeholder="One-line hook for listing pages" value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} maxLength={160} />
            </div>
            <div>
              <Label>Full Description *</Label>
              <Textarea className="mt-1.5 resize-none" rows={6} placeholder="Describe what's in the pack, who it's for, and why they'll love it..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {(cats || []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>AI Tools Targeted</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {AI_TOOLS.map(tool => (
                  <button key={tool} type="button" onClick={() => toggleTool(tool)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${form.aiToolTargets.includes(tool) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {tool}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tags (up to 10)</Label>
              <div className="flex gap-2 mt-1.5">
                <Input placeholder="Add tag..." value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={form.tags.length >= 10}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 pr-1">{t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <p className="font-medium text-foreground">Free Pack</p>
                <p className="text-sm text-muted-foreground">Make this pack available for free</p>
              </div>
              <Switch checked={form.isFree} onCheckedChange={v => setForm(f => ({ ...f, isFree: v }))} />
            </div>
            {!form.isFree && (
              <div>
                <Label>Price (USD cents) *</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    className="pl-7"
                    min={99}
                    value={(form.priceCents / 100).toFixed(2)}
                    onChange={e => setForm(f => ({ ...f, priceCents: Math.round(parseFloat(e.target.value) * 100) }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum $0.99 — You earn {Math.round(form.priceCents * 0.7) / 100} USD per sale (70% commission)</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground">Review before submitting</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2"><span className="text-muted-foreground w-28">Title:</span><span className="text-foreground font-medium">{form.title}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-28">Price:</span><span className="text-foreground font-medium">{form.isFree ? "Free" : `$${(form.priceCents / 100).toFixed(2)}`}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-28">AI Tools:</span><span className="text-foreground">{form.aiToolTargets.join(", ") || "—"}</span></div>
              <div className="flex gap-2"><span className="text-muted-foreground w-28">Tags:</span><span className="text-foreground">{form.tags.join(", ") || "—"}</span></div>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">Your pack will be reviewed by our team and published within 24–48 hours if it meets our content guidelines.</p>
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < 2 ? (
            <Button className="flex-1 gap-2" disabled={!canProceed} onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="flex-1 gap-2" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Package className="w-4 h-4" /> Submit Pack</>}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
