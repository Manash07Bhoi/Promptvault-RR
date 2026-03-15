import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Copy, Bookmark, Zap, ChevronDown, ChevronUp, Package, ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function PromptViewerCard({ prompt, packId }: { prompt: any; packId: number }) {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prompts/${prompt.id}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bookmarked!", description: "Added to your library." });
      qc.invalidateQueries({ queryKey: ["pack-prompts", packId] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markUsedMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/prompts/${prompt.id}/used`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
  });

  const renderBody = () => {
    if (!prompt.variables?.length) return prompt.body;
    return prompt.body.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => variables[k] ? `[${variables[k]}]` : `{{${k}}}`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(renderBody());
    toast({ title: "Copied!" });
    markUsedMutation.mutate();
  };

  return (
    <div className={cn("rounded-xl border bg-card transition-all duration-200", expanded ? "border-primary/30" : "border-border")}>
      <button
        className="w-full flex items-start gap-4 p-5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-foreground">{prompt.title}</span>
            {prompt.aiTool && <Badge variant="secondary" className="text-xs">{prompt.aiTool}</Badge>}
            {prompt.useCase && <Badge variant="outline" className="text-xs">{prompt.useCase}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{prompt.body}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
          {/* Variables */}
          {prompt.variables?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fill in variables</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {prompt.variables.map((v: string) => (
                  <div key={v}>
                    <label className="text-xs text-muted-foreground">{v}</label>
                    <Input
                      className="mt-0.5 text-sm h-8"
                      placeholder={`Enter ${v}...`}
                      value={variables[v] || ""}
                      onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Body */}
          <Textarea
            readOnly
            value={renderBody()}
            rows={6}
            className="font-mono text-sm resize-none bg-muted/30"
          />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const encoded = encodeURIComponent(renderBody());
                window.open(`https://chat.openai.com/?q=${encoded}`, "_blank");
              }}
              title="Open in ChatGPT"
            >
              <ExternalLink className="w-3.5 h-3.5" /> ChatGPT
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const encoded = encodeURIComponent(renderBody());
                window.open(`https://claude.ai/new?q=${encoded}`, "_blank");
              }}
              title="Open in Claude"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Claude
            </Button>
            <Button
              size="sm"
              variant={prompt.bookmark ? "secondary" : "outline"}
              className="gap-1.5"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending || !!prompt.bookmark}
            >
              <Bookmark className={cn("w-3.5 h-3.5", prompt.bookmark && "fill-current")} />
              {prompt.bookmark ? "Bookmarked" : "Save to Library"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PackPromptsPage() {
  const { packId } = useParams<{ packId: string }>();
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["pack-prompts", packId],
    queryFn: async () => {
      const res = await fetch(`/api/packs/${packId}/prompts/full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Unauthorized"); }
      return res.json();
    },
  });

  const prompts = data?.prompts || [];
  const filtered = search
    ? prompts.filter((p: any) => p.title?.toLowerCase().includes(search.toLowerCase()) || p.body?.toLowerCase().includes(search.toLowerCase()))
    : prompts;

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 text-center text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p>You need to purchase this pack to view its prompts.</p>
          <Link href={`/packs/${packId}`}><Button className="mt-4">View Pack</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/purchases">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Prompt Viewer</h1>
            <p className="text-muted-foreground text-sm">{prompts.length} prompts in this pack</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No prompts found{search ? ` matching "${search}"` : ""}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p: any) => <PromptViewerCard key={p.id} prompt={p} packId={parseInt(packId)} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
