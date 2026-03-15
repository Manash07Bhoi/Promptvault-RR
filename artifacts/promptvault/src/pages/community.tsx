import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, TrendingUp, MessageSquare, Heart, Star,
  Filter, Sparkles, ChevronRight, Globe, Zap, BookOpen,
  ThumbsUp, Plus, Send, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "ChatGPT", "Claude", "Midjourney", "Gemini", "DALL-E", "Coding", "Marketing", "Writing", "Business"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "most-voted", label: "Most Voted" },
];

const AI_TOOLS = ["ChatGPT", "Claude", "Gemini", "Midjourney", "DALL-E", "Stable Diffusion", "Perplexity", "Copilot", "Coding", "Marketing", "Writing", "Business", "Other"];

interface CommunityPrompt {
  id: number;
  body: string;
  aiTool: string | null;
  upvoteCount: number;
  commentCount: number;
  status: "pending" | "approved" | "featured" | "removed";
  createdAt: string;
  userId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  hasVoted: boolean;
}

interface CommunityPromptListResponse {
  prompts: CommunityPrompt[];
  total: number;
  page: number;
  hasMore: boolean;
}

function PromptCard({ prompt, onVote }: { prompt: CommunityPrompt; onVote: (id: number, hasVoted: boolean) => void }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={prompt.avatarUrl} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {prompt.displayName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link href={prompt.username ? `/u/${prompt.username}` : "#"}>
              <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer truncate block">
                {prompt.displayName || "Anonymous"}
              </span>
            </Link>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
            </span>
          </div>
          {prompt.aiTool && (
            <Badge variant="outline" className="ml-auto text-xs flex-shrink-0">
              {prompt.aiTool}
            </Badge>
          )}
          {prompt.status === "featured" && (
            <Badge className="bg-amber-500 text-white text-xs flex-shrink-0">
              <Star className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
        </div>

        {/* Prompt body */}
        <div className="bg-muted/50 rounded-lg p-3 mb-3 border border-border/50">
          <p className="text-sm text-foreground font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {prompt.body}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!isAuthenticated) return;
                onVote(prompt.id, prompt.hasVoted);
              }}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors",
                prompt.hasVoted
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary",
                !isAuthenticated && "opacity-50 cursor-not-allowed"
              )}
              title={!isAuthenticated ? "Log in to vote" : undefined}
            >
              <ThumbsUp className={cn("w-4 h-4", prompt.hasVoted && "fill-current")} />
              {prompt.upvoteCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {prompt.commentCount}
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(prompt.body);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/5"
          >
            Copy prompt
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SubmitPromptDialog({ onSubmitted }: { onSubmitted: () => void }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [aiTool, setAiTool] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body, aiTool: aiTool || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Prompt submitted!", description: "Your prompt is now live in the community feed." });
      setOpen(false);
      setBody("");
      setAiTool("");
      onSubmitted();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login">
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Submit Prompt
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Submit Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share a Community Prompt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="prompt-body">Your Prompt <span className="text-muted-foreground text-xs">(20–2000 chars)</span></Label>
            <Textarea
              id="prompt-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your best AI prompt here. Be specific and descriptive for best results..."
              className="mt-1.5 min-h-[140px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{body.length}/2000</p>
          </div>
          <div>
            <Label htmlFor="ai-tool">AI Tool (optional)</Label>
            <Select value={aiTool} onValueChange={setAiTool}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select the AI tool this prompt is for..." />
              </SelectTrigger>
              <SelectContent>
                {AI_TOOLS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={body.trim().length < 20 || submitMutation.isPending}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit Prompt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<CommunityPromptListResponse>({
    queryKey: ["community-prompts", search, category, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({ q: search, sort, page: String(page) });
      if (category !== "All") params.set("category", category);
      const res = await fetch(`/api/community/prompts?${params}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, hasVoted }: { id: number; hasVoted: boolean }) => {
      const res = await fetch(`/api/community/prompts/${id}/vote`, {
        method: hasVoted ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-prompts"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleVote = (id: number, hasVoted: boolean) => {
    if (!isAuthenticated) { toast({ title: "Please log in to vote" }); return; }
    voteMutation.mutate({ id, hasVoted });
  };

  const prompts = data?.prompts || [];

  return (
    <PublicLayout>
      <SEO
        canonical="/community"
        title="Community Prompts"
        description="Discover, vote on, and share AI prompts with the PromptVault community. Upvote your favourite prompts and submit your own."
        keywords="AI prompt community, share AI prompts, vote on prompts, community prompts"
      />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            <Globe className="w-4 h-4" /> Community Prompts
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Prompts by the <span className="text-gradient">Community</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            A free-to-access feed of AI prompts shared by the PromptVault community. Vote for your favourites, copy and use instantly.
          </p>
          <SubmitPromptDialog onSubmitted={() => qc.invalidateQueries({ queryKey: ["community-prompts"] })} />
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search community prompts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {SORT_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSort(s.value); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  sort === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompts Grid */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-24">
            <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No prompts found. Be the first to share one!</p>
            <div className="mt-4">
              <SubmitPromptDialog onSubmitted={() => qc.invalidateQueries({ queryKey: ["community-prompts"] })} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((p) => (
              <PromptCard key={p.id} prompt={p} onVote={handleVote} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.hasMore && (
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" onClick={() => setPage(p => p + 1)}>
              Load More Prompts
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-border p-10 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Want to earn from your prompts?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Become a creator and publish your best AI prompts as paid packs. Earn 70% revenue share on every sale.
          </p>
          <Link href="/creator/apply">
            <Button size="lg" className="glow-primary">
              Apply to be a Creator <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
