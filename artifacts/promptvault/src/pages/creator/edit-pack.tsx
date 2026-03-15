import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import {
  X, Plus, Loader2, Package, Save, Eye, ArrowLeft,
  GripVertical, Edit, Trash2, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import { useListCategories } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const AI_TOOLS = ["ChatGPT", "Claude", "Gemini", "Midjourney", "DALL-E", "Stable Diffusion", "Perplexity", "Copilot", "Llama", "Mistral"];

function PromptCard({
  prompt, index, onEdit, onDelete
}: {
  prompt: any; index: number;
  onEdit: (p: any) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-1 text-muted-foreground cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
            <p className="font-medium text-foreground text-sm truncate">{prompt.title || "Untitled Prompt"}</p>
            {prompt.aiTool && <Badge variant="secondary" className="text-xs">{prompt.aiTool}</Badge>}
          </div>
          <p className={cn("text-xs text-muted-foreground", expanded ? "" : "line-clamp-2")}>
            {prompt.body}
          </p>
          {prompt.body?.length > 120 && (
            <button
              className="text-xs text-primary mt-1 flex items-center gap-0.5"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Less" : "More"}
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(prompt)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(prompt.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PromptEditorDialog({
  open, prompt, onClose, onSave
}: {
  open: boolean;
  prompt: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    title: "", body: "", aiTool: "", useCase: "", difficulty: "intermediate",
  });

  useEffect(() => {
    if (prompt) {
      setForm({
        title: prompt.title || "",
        body: prompt.body || "",
        aiTool: prompt.aiTool || "",
        useCase: prompt.useCase || "",
        difficulty: prompt.difficulty || "intermediate",
      });
    } else {
      setForm({ title: "", body: "", aiTool: "", useCase: "", difficulty: "intermediate" });
    }
  }, [prompt, open]);

  const handleSave = () => {
    if (!form.body.trim()) return;
    onSave({ ...form, id: prompt?.id });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{prompt ? "Edit Prompt" : "Add Prompt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. Cold Email Opener"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <Label>Prompt Body *</Label>
            <Textarea
              className="mt-1.5 font-mono text-sm min-h-[160px]"
              placeholder="Write your prompt here. Use {{variable}} for dynamic placeholders."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">{form.body.length} chars · Use {"{{variable}}"} for fillable placeholders</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>AI Tool</Label>
              <Select value={form.aiTool} onValueChange={v => setForm(f => ({ ...f, aiTool: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {AI_TOOLS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Use Case</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. Marketing"
                value={form.useCase}
                onChange={e => setForm(f => ({ ...f, useCase: e.target.value }))}
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.body.trim()}>
              {prompt ? "Save Changes" : "Add Prompt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CreatorEditPackPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: cats } = useListCategories();

  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { data: packData, isLoading } = useQuery({
    queryKey: ["creator-pack", id],
    queryFn: async () => {
      const res = await fetch(`/api/creator/packs/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Pack not found");
      return res.json();
    },
  });

  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "", categoryId: "",
    priceCents: 999, isFree: false, tags: [] as string[], aiToolTargets: [] as string[],
  });

  useEffect(() => {
    if (packData?.pack) {
      const p = packData.pack;
      setForm({
        title: p.title || "",
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        categoryId: String(p.categoryId || ""),
        priceCents: p.priceCents || 999,
        isFree: p.isFree || false,
        tags: p.tags || [],
        aiToolTargets: p.aiToolTargets || [],
      });
    }
  }, [packData]);

  const prompts: any[] = packData?.prompts || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/creator/packs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...form, categoryId: parseInt(form.categoryId) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Pack saved!" });
      qc.invalidateQueries({ queryKey: ["creator-pack", id] });
      qc.invalidateQueries({ queryKey: ["creator-dashboard"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const savePromptMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = data.id ? "PATCH" : "POST";
      const url = data.id
        ? `/api/creator/packs/${id}/prompts/${data.id}`
        : `/api/creator/packs/${id}/prompts`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Prompt saved!" });
      qc.invalidateQueries({ queryKey: ["creator-pack", id] });
      setPromptDialogOpen(false);
      setEditingPrompt(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      const res = await fetch(`/api/creator/packs/${id}/prompts/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Prompt deleted" });
      qc.invalidateQueries({ queryKey: ["creator-pack", id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/creator/packs/${id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted for review!", description: "Your pack will be reviewed within 24–48 hours." });
      navigate("/creator/dashboard");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (v && !form.tags.includes(v) && form.tags.length < 10) {
      setForm(f => ({ ...f, tags: [...f.tags, v] }));
      setTagInput("");
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  const pack = packData?.pack;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/creator/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Edit Pack</h1>
              <p className="text-muted-foreground text-sm">{pack?.title || "Loading..."}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {pack?.slug && (
              <a href={`/packs/${pack.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </Button>
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
            {pack?.status === "DRAFT" || pack?.status === "REJECTED" ? (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || prompts.length === 0}
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Submit for Review
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="mb-6">
            <TabsTrigger value="details">Pack Details</TabsTrigger>
            <TabsTrigger value="prompts">
              Prompts
              <Badge variant="secondary" className="ml-2 text-xs">{prompts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-5">
            <div>
              <Label>Pack Title *</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. 50 ChatGPT Marketing Prompts"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Short Description</Label>
              <Input
                className="mt-1.5"
                placeholder="One-line summary (shown on pack card)"
                value={form.shortDescription}
                onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground mt-1">{form.shortDescription.length}/120</p>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                className="mt-1.5 min-h-[120px]"
                placeholder="Detailed description of what buyers will get..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(cats || []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>AI Tools</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AI_TOOLS.map(tool => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      form.aiToolTargets.includes(tool)
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Prompts ({prompts.length})</h3>
                <p className="text-xs text-muted-foreground">Add at least 5 prompts before submitting</p>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => { setEditingPrompt(null); setPromptDialogOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Add Prompt
              </Button>
            </div>

            {prompts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium text-foreground">No prompts yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first prompt to get started</p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => { setEditingPrompt(null); setPromptDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4" /> Add First Prompt
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {prompts.map((p: any, i: number) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    index={i}
                    onEdit={(prompt) => { setEditingPrompt(prompt); setPromptDialogOpen(true); }}
                    onDelete={(promptId) => deletePromptMutation.mutate(promptId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <Label>Free Pack</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Offer this pack at no cost to build your audience</p>
              </div>
              <Switch
                checked={form.isFree}
                onCheckedChange={v => setForm(f => ({ ...f, isFree: v }))}
              />
            </div>
            {!form.isFree && (
              <div>
                <Label>Price (USD)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    className="pl-7"
                    min={0.99}
                    step={0.01}
                    value={(form.priceCents / 100).toFixed(2)}
                    onChange={e => setForm(f => ({ ...f, priceCents: Math.round(parseFloat(e.target.value) * 100) }))}
                  />
                </div>
                <div className="mt-3 p-4 rounded-xl bg-muted/50 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">List price</span>
                    <span className="font-medium">${(form.priceCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (30%)</span>
                    <span className="text-destructive">-${(form.priceCents * 0.3 / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5 mt-1.5">
                    <span>Your earnings</span>
                    <span className="text-green-500">${(form.priceCents * 0.7 / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Pricing
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <PromptEditorDialog
        open={promptDialogOpen}
        prompt={editingPrompt}
        onClose={() => { setPromptDialogOpen(false); setEditingPrompt(null); }}
        onSave={(data) => savePromptMutation.mutate(data)}
      />
    </DashboardLayout>
  );
}
