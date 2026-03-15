import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, Search, Star, Copy, ExternalLink, Bookmark,
  SlidersHorizontal, Zap, ChevronRight, Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

function PromptCard({ prompt, onUse }: { prompt: any; onUse: (p: any) => void }) {
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.body);
    toast({ title: "Copied!", description: "Prompt copied to clipboard." });
  };

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{prompt.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {prompt.aiTool && <Badge variant="secondary" className="text-xs">{prompt.aiTool}</Badge>}
            {prompt.useCase && <span className="text-xs text-muted-foreground">{prompt.useCase}</span>}
          </div>
        </div>
        {prompt.personalRating && (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-medium">{prompt.personalRating}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-muted/50 rounded-lg p-3">{prompt.body}</p>

      <div className="flex items-center justify-between">
        <Link href={`/packs/${prompt.packSlug}`}>
          <span className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Package className="w-3 h-3" /> {prompt.packTitle}
          </span>
        </Link>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" className="h-7 px-3 gap-1.5" onClick={() => onUse(prompt)}>
            <Zap className="w-3.5 h-3.5" /> Use
          </Button>
        </div>
      </div>
    </div>
  );
}

function PromptViewerModal({ prompt, onClose }: { prompt: any | null; onClose: () => void }) {
  const { accessToken } = useAuthStore();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const useMutation_ = useMutation;

  const markUsedMutation = useMutation_({
    mutationFn: async () => {
      await fetch(`/api/prompts/${prompt.promptId}/used`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-library"] }),
  });

  if (!prompt) return null;

  const renderedBody = prompt.variables?.length
    ? prompt.body.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => variables[key] ? `[${variables[key]}]` : `{{${key}}}`)
    : prompt.body;

  const handleCopyAndUse = async () => {
    await navigator.clipboard.writeText(renderedBody);
    toast({ title: "Copied & marked as used!" });
    markUsedMutation.mutate();
  };

  return (
    <Dialog open={!!prompt} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{prompt.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {prompt.aiTool && <Badge variant="secondary">{prompt.aiTool}</Badge>}
            {prompt.useCase && <Badge variant="outline">{prompt.useCase}</Badge>}
            <Badge variant="outline" className="gap-1"><Zap className="w-3 h-3" /> Used {prompt.usedCount || 0}x</Badge>
          </div>

          {/* Variables */}
          {prompt.variables?.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Fill in variables:</p>
              {prompt.variables.map((v: string) => (
                <div key={v}>
                  <label className="text-xs text-muted-foreground">{v}</label>
                  <Input
                    placeholder={`Enter ${v}...`}
                    value={variables[v] || ""}
                    onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Prompt</label>
            <Textarea
              readOnly
              value={renderedBody}
              rows={10}
              className="mt-1 font-mono text-sm resize-none bg-muted/30"
            />
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 gap-2" onClick={handleCopyAndUse}>
              <Copy className="w-4 h-4" /> Copy & Mark Used
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PromptLibraryPage() {
  const { accessToken } = useAuthStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prompt-library", sort],
    queryFn: async () => {
      const res = await fetch(`/api/user/library?sort=${sort}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const prompts = data?.prompts || [];
  const filtered = prompts.filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.body?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Prompt Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Your bookmarked prompts from purchased packs</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Recently Added</SelectItem>
              <SelectItem value="rating">My Rating</SelectItem>
              <SelectItem value="used">Most Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 rounded-xl border border-border bg-muted animate-pulse" />)}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            {search ? (
              <p>No prompts match "{search}"</p>
            ) : (
              <>
                <p className="font-medium">No bookmarked prompts yet</p>
                <p className="text-sm mt-1">Purchase packs and bookmark prompts you love</p>
                <Link href="/explore"><Button className="mt-4">Browse Packs</Button></Link>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{filtered.length} prompt{filtered.length !== 1 ? "s" : ""}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p: any, i: number) => (
                <PromptCard key={`${p.promptId}-${i}`} prompt={p} onUse={setSelectedPrompt} />
              ))}
            </div>
          </>
        )}
      </div>

      <PromptViewerModal prompt={selectedPrompt} onClose={() => setSelectedPrompt(null)} />
    </DashboardLayout>
  );
}
