import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { useGetPackBySlug, useGetPackReviews, useGetRelatedPacks } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Star, Download, Sparkles, CheckCircle2, Lock, ShoppingCart,
  ChevronRight, ArrowRight, User, FileText, Zap, Eye, Copy, Check, Loader2,
  Heart, Gift, Share2, Twitter, Linkedin, Link2, MessageCircle, ArrowLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/use-auth-store";
import { PackCard } from "@/components/shared/pack-card";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function PromptCard({ prompt, index, isPurchased }: { prompt: any; index: number; isPurchased: boolean }) {
  const [copied, setCopied] = useState(false);
  const isBlurred = !isPurchased && !!prompt.isBlurred;

  const handleCopy = () => {
    if (isBlurred) return;
    navigator.clipboard.writeText(prompt.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`relative rounded-xl border bg-card overflow-hidden ${isBlurred ? "border-border/30" : "border-border hover:border-primary/30"} transition-colors`}
    >
      {/* Blurred overlay */}
      {isBlurred && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Purchase to Unlock</p>
          <p className="text-xs text-muted-foreground">This prompt is included in the pack</p>
        </div>
      )}

      <div className={isBlurred ? "filter blur-sm select-none pointer-events-none" : ""}>
        <div className="flex items-start justify-between p-4 border-b border-border/50">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">{prompt.title}</h4>
            </div>
            <div className="flex items-center gap-2">
              {prompt.aiTool && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">{prompt.aiTool}</Badge>
              )}
              {prompt.useCase && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{prompt.useCase}</Badge>
              )}
            </div>
          </div>
          {!isBlurred && (
            <button
              onClick={handleCopy}
              className="ml-3 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              title="Copy prompt"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">{prompt.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-amber-400 fill-current" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function usePackDownload(slug: string) {
  const { accessToken } = useAuthStore();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`${BASE}/api/packs/${slug}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        toast.error(err.error || "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-promptvault.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return { downloading, handleDownload };
}

export default function PackDetail() {
  const [, params] = useRoute("/packs/:slug");
  const slug = params?.slug || "";
  const { isAuthenticated, accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "prompts" | "reviews" | "comments">("overview");
  const [commentText, setCommentText] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMsg, setGiftMsg] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const qc = useQueryClient();

  const [, setLocation] = useLocation();
  const { downloading, handleDownload } = usePackDownload(slug);

  const { data: pack, isLoading } = useGetPackBySlug(slug, { query: { enabled: !!slug } as any });
  const { data: reviews } = useGetPackReviews(pack?.id ?? 0, undefined, { query: { enabled: !!pack?.id && activeTab === "reviews" } as any });
  const { data: related } = useGetRelatedPacks(slug, { query: { enabled: !!slug } as any });

  const { data: commentsData } = useQuery({
    queryKey: ["pack-comments", pack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/packs/${pack!.id}/comments`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      return res.json();
    },
    enabled: !!pack?.id && activeTab === "comments",
  });

  const postCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/packs/${pack!.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["pack-comments", pack?.id] });
      toast.success("Comment posted!");
    },
    onError: () => toast.error("Failed to post comment. Please try again."),
  });

  const upvoteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await fetch(`/api/comments/${commentId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack-comments", pack?.id] }),
  });

  const { data: appreciateData } = useQuery({
    queryKey: ["pack-appreciate", pack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/packs/${pack!.id}/appreciate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    enabled: isAuthenticated && !!pack?.id,
  });

  const appreciateMutation = useMutation({
    mutationFn: async (appreciated: boolean) => {
      await fetch(`/api/packs/${pack!.id}/appreciate`, {
        method: appreciated ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pack-appreciate", pack?.id] });
      qc.invalidateQueries({ queryKey: ["pack", slug] });
    },
  });

  const giftMutation = useMutation({
    mutationFn: async ({ email, message }: { email: string; message: string }) => {
      const res = await fetch(`/api/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ packId: pack!.id, recipientEmail: email, senderMessage: message }),
      });
      if (!res.ok) throw new Error("Failed to send gift");
      return res.json();
    },
    onSuccess: () => {
      setGiftOpen(false);
      setGiftEmail("");
      setGiftMsg("");
      toast.success("Gift sent! The recipient will receive an email to claim their pack.");
    },
    onError: () => toast.error("Failed to send gift. Please try again."),
  });

  const handleShare = (platform: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const utmUrl = `${baseUrl}?utm_source=${platform}&utm_medium=social&utm_campaign=pack_share`;
    const text = `Check out "${pack?.title}" on PromptVault — premium AI prompt packs!`;
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(utmUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(utmUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(utmUrl)}&title=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + utmUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(utmUrl)}&text=${encodeURIComponent(text)}`,
    };
    if (links[platform]) window.open(links[platform], "_blank");
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      setLocation("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setLocation(`/checkout?pack=${slug}`);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="h-6 bg-muted rounded w-48 mb-10 animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 bg-muted rounded w-3/4 animate-pulse" />
              <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
            </div>
            <div className="h-[480px] bg-card rounded-2xl border border-border animate-pulse" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!pack) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold mb-4">Pack Not Found</h1>
          <p className="text-muted-foreground mb-8">The prompt pack you're looking for doesn't exist or has been removed.</p>
          <Link href="/explore"><Button>Browse All Packs</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const prompts = (pack as any).prompts || [];
  const isPurchased = (pack as any).isPurchased || false;
  const unlockedCount = isPurchased ? prompts.length : prompts.filter((p: any) => !p.isBlurred).length;
  const lockedCount = isPurchased ? 0 : prompts.length - unlockedCount;

  return (
    <PublicLayout>
      <SEO
        title={pack.title}
        description={pack.shortDescription || pack.description?.slice(0, 160) || `${pack.title} — premium AI prompt pack on PromptVault.`}
        ogImage={pack.thumbnailUrl || undefined}
        canonical={`/packs/${pack.slug}`}
        type="product"
        keywords={`${pack.title}, AI prompts, ${(pack.aiToolTargets || []).join(", ")}`}
      />
      <div className="container mx-auto px-4 py-10 max-w-7xl">

        {/* Back Button */}
        <Link href="/explore">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Button>
        </Link>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {pack.categoryName && (
            <>
              <Link href={`/categories/${(pack as any).categorySlug}`} className="hover:text-foreground transition-colors">{pack.categoryName}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">{pack.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* ─── Left/Main Content ─── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {pack.isBestseller && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border">🏆 Bestseller</Badge>}
                {pack.isFeatured && <Badge variant="default" className="glow-primary"><Sparkles className="w-3 h-3 mr-1" />Featured</Badge>}
                {pack.categoryName && <Badge variant="outline">{pack.categoryName}</Badge>}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">{pack.title}</h1>
              <p className="text-lg text-muted-foreground mb-5">{pack.shortDescription}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(pack.avgRating || 0) ? "text-amber-400 fill-current" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{pack.avgRating?.toFixed(1) || "New"}</span>
                  <span>({pack.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>{pack.totalDownloads} sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{pack.promptCount} prompts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>{(pack as any).aiToolTargets?.join(", ") || "Multiple AI Tools"}</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/10 to-secondary/10">
              <img
                src={pack.previewImageUrl || pack.thumbnailUrl || `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&q=80&fit=crop`}
                alt={pack.title}
                className="w-full h-full object-cover"
              />
              {!isPurchased && (
                <div className="absolute bottom-4 right-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 backdrop-blur-md border border-border text-sm font-medium">
                    <Eye className="w-4 h-4 text-primary" />
                    Preview: {unlockedCount} of {prompts.length} prompts
                  </div>
                </div>
              )}
              {isPurchased && (
                <div className="absolute bottom-4 right-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Purchased — Full Access
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div>
              <div className="border-b border-border/50 flex gap-1 mb-8">
                {(["overview", "prompts", "reviews", "comments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-4 text-sm font-semibold capitalize relative transition-colors ${
                      activeTab === tab
                        ? "text-primary border-b-2 border-primary -mb-px"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                    {tab === "reviews" && pack.reviewCount > 0 && (
                      <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{pack.reviewCount}</span>
                    )}
                    {tab === "prompts" && (
                      <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{prompts.length}</span>
                    )}
                    {tab === "comments" && (commentsData?.comments?.length ?? 0) > 0 && (
                      <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{commentsData.comments.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Overview Tab ── */}
              {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-bold text-foreground mb-4">About This Pack</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{pack.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-5">What's Included</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        `${pack.promptCount} expertly crafted prompts`,
                        `Works with ${(pack as any).aiToolTargets?.slice(0, 2).join(" and ")}`,
                        "Copy-paste ready format",
                        "Variable placeholders for customization",
                        "Use case labels for each prompt",
                        "Instant PDF download after purchase",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-5">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {[
                        { q: "What AI tools do these prompts work with?", a: `These prompts are optimized for ${(pack as any).aiToolTargets?.join(", ") || "ChatGPT, Claude"}. Most prompts work across all major LLMs with minimal modifications.` },
                        { q: "Can I use these prompts for client work?", a: "Yes! Once purchased, you have a lifetime commercial license to use the prompts for personal and client projects. You cannot resell the prompts as-is." },
                        { q: "How do I download my prompts?", a: "After purchase, all prompts are immediately unlocked on this page. You can also download the complete pack as a formatted PDF from your dashboard." },
                        { q: "What if the prompts don't work for me?", a: "Contact our support team at support@promptvault.com and we'll do our best to help you get the most out of your purchase." },
                      ].map((faq, i) => (
                        <details key={i} className="group border border-border/50 rounded-xl overflow-hidden">
                          <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-sm text-foreground hover:bg-card/50 transition-colors list-none">
                            <span>{faq.q}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/30">{faq.a}</div>
                        </details>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Prompts Tab ── */}
              {activeTab === "prompts" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {!isPurchased && prompts.length > 1 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">
                          Previewing <strong>{unlockedCount}</strong> of <strong>{prompts.length}</strong> prompts.
                          Purchase to unlock all {lockedCount} remaining.
                        </span>
                      </div>
                      <Button size="sm" onClick={handleBuy} isLoading={false}>
                        Unlock All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}

                  {prompts.map((prompt: any, i: number) => (
                    <PromptCard key={prompt.id} prompt={prompt} index={i} isPurchased={isPurchased} />
                  ))}

                  {!isPurchased && lockedCount > 0 && (
                    <div className="text-center py-10 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
                      <Lock className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                      <p className="font-semibold text-foreground mb-1">{lockedCount} more prompts locked</p>
                      <p className="text-sm text-muted-foreground mb-5">Purchase this pack to unlock all {prompts.length} prompts</p>
                      <Button onClick={handleBuy} isLoading={false}>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now — {formatPrice(pack.priceCents)}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Reviews Tab ── */}
              {activeTab === "reviews" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Aggregate rating */}
                  <div className="flex items-center gap-8 p-6 rounded-2xl bg-card border border-border">
                    <div className="text-center">
                      <div className="text-5xl font-display font-extrabold text-foreground">{pack.avgRating?.toFixed(1) || "—"}</div>
                      <StarRating rating={Math.round(pack.avgRating || 0)} />
                      <div className="text-xs text-muted-foreground mt-1">{pack.reviewCount} reviews</div>
                    </div>
                    <div className="flex-grow space-y-1.5">
                      {[5,4,3,2,1].map(star => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-2">{star}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          <div className="flex-grow h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: star === 5 ? "70%" : star === 4 ? "20%" : "5%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews list */}
                  {((reviews as any)?.reviews || []).length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                      <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="font-semibold text-foreground mb-2">No reviews yet</p>
                      <p className="text-sm text-muted-foreground">Be the first to review this pack after purchasing.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {((reviews as any)?.reviews || []).map((review: any) => (
                        <div key={review.id} className="p-5 rounded-xl border border-border bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-foreground">{review.userName || "Anonymous"}</div>
                                {review.isVerified && (
                                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} />
                              <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                          {review.title && <p className="font-semibold text-sm text-foreground mb-1">{review.title}</p>}
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Comments Tab ── */}
              {activeTab === "comments" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Post Comment Form */}
                  {isAuthenticated ? (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <p className="text-sm font-semibold text-foreground">Add a comment</p>
                      <Textarea
                        placeholder="Share your thoughts about this pack..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={!commentText.trim() || postCommentMutation.isPending}
                          onClick={() => postCommentMutation.mutate(commentText.trim())}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-border bg-card text-center">
                      <p className="text-sm text-muted-foreground mb-2">Sign in to leave a comment</p>
                      <Link href="/login">
                        <Button size="sm" variant="outline">Sign In</Button>
                      </Link>
                    </div>
                  )}

                  {/* Comments List */}
                  {!commentsData ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
                    </div>
                  ) : (commentsData.comments || []).length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="font-semibold text-foreground mb-2">No comments yet</p>
                      <p className="text-sm text-muted-foreground">Be the first to share your thoughts.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(commentsData.comments || []).map((comment: any) => (
                        <div key={comment.id} className="p-4 rounded-xl border border-border bg-card">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {(comment.userName || comment.userUsername || "?")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {comment.userName || comment.userUsername || "Anonymous"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{comment.body}</p>
                              <button
                                className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                onClick={() => upvoteCommentMutation.mutate(comment.id)}
                                disabled={!isAuthenticated || comment.userUpvoted}
                              >
                                <ThumbsUp className={`w-3.5 h-3.5 ${comment.userUpvoted ? "fill-current text-primary" : ""}`} />
                                <span>{comment.upvoteCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* ─── Right / Sticky Purchase Card ─── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/5">
              {/* Price */}
              <div className="flex items-end gap-3 mb-5">
                <div className="text-4xl font-display font-extrabold text-foreground">
                  {pack.isFree ? "Free" : formatPrice(pack.priceCents)}
                </div>
                {pack.comparePriceCents && pack.comparePriceCents > pack.priceCents && (
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-muted-foreground line-through text-lg">{formatPrice(pack.comparePriceCents)}</span>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/30 border text-xs">
                      {Math.round(((pack.comparePriceCents - pack.priceCents) / pack.comparePriceCents) * 100)}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              {isPurchased ? (
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> You own this pack
                  </div>
                  <Button className="w-full" size="lg" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                    {downloading ? "Downloading..." : "Download PDF"}
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full mb-4 text-base h-14 font-semibold glow-primary"
                  onClick={handleBuy}
                  isLoading={false}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {pack.isFree ? "Get for Free" : `Buy Now — ${formatPrice(pack.priceCents)}`}
                </Button>
              )}

              {!isPurchased && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Instant access after purchase</span>
                </div>
              )}

              {/* Pack Details */}
              <div className="space-y-3 text-sm border-t border-border/50 pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Prompts</span>
                  <span className="font-semibold text-foreground">{pack.promptCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="font-semibold text-foreground">{pack.totalDownloads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span className="font-semibold text-foreground">{pack.avgRating?.toFixed(1) || "New"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground shrink-0">AI Tools</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {((pack as any).aiToolTargets || []).map((tool: string) => (
                      <Badge key={tool} variant="outline" className="text-[10px] py-0 px-1.5">{tool}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-semibold text-foreground text-xs">{formatDate((pack as any).publishedAt || pack.createdAt)}</span>
                </div>
              </div>

              {/* Coupon reminder */}
              {!isPurchased && (
                <div className="mt-5 p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
                  <p className="text-xs text-secondary font-medium">
                    🎁 Use code <strong>WELCOME20</strong> for 20% off your first purchase
                  </p>
                </div>
              )}
            </div>

            {/* Gift button (non-owners only) */}
            {!isPurchased && !pack.isFree && (
              <button
                onClick={() => isAuthenticated ? setGiftOpen(true) : setLocation("/login")}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
              >
                <Gift className="w-4 h-4" /> Give as a Gift
              </button>
            )}

            {/* Appreciate + Share row */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (!isAuthenticated) { setLocation("/login"); return; }
                  appreciateMutation.mutate(appreciateData?.appreciated);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm transition-all ${
                  appreciateData?.appreciated
                    ? "border-pink-500/40 bg-pink-500/10 text-pink-400"
                    : "border-border text-muted-foreground hover:border-pink-500/30 hover:text-pink-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${appreciateData?.appreciated ? "fill-current" : ""}`} />
                <span>{(pack as any).appreciationCount || 0}</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Creator info */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Created by Roshan</div>
                <div className="text-xs text-muted-foreground">PromptVault Curator</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
            </div>
          </div>
        </div>

        {/* ─── Related Packs ─── */}
        {related && related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-display font-bold">Related Packs</h2>
              <Link href="/explore"><Button variant="outline" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.slice(0, 4).map((p: any, i: number) => (
                <PackCard key={p.id} pack={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Gift Modal ─── */}
      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Give as a Gift
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send <strong className="text-foreground">"{pack?.title}"</strong> to someone special. They'll receive an email to claim their copy.
          </p>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gift-email">Recipient Email</Label>
              <Input
                id="gift-email"
                type="email"
                placeholder="friend@example.com"
                value={giftEmail}
                onChange={(e) => setGiftEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gift-msg">Personal Message (optional)</Label>
              <textarea
                id="gift-msg"
                className="w-full min-h-[80px] text-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Write a personal note..."
                value={giftMsg}
                onChange={(e) => setGiftMsg(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setGiftOpen(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!giftEmail || giftMutation.isPending}
                onClick={() => giftMutation.mutate({ email: giftEmail, message: giftMsg })}
              >
                {giftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                Send Gift — {pack && formatPrice(pack.priceCents)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Share Modal ─── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Share this Pack
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <button
              onClick={() => handleShare("twitter")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-[#1DA1F2]/40 hover:bg-[#1DA1F2]/5 transition-all text-sm font-medium"
            >
              <Twitter className="w-5 h-5 text-[#1DA1F2]" /> Share on Twitter/X
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5 transition-all text-sm font-medium"
            >
              <Linkedin className="w-5 h-5 text-[#0A66C2]" /> Share on LinkedIn
            </button>
            <button
              onClick={() => handleShare("reddit")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm font-medium"
            >
              <span className="w-5 h-5 text-orange-500 font-bold text-base">r/</span> Share on Reddit
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-green-500/40 hover:bg-green-500/5 transition-all text-sm font-medium"
            >
              <MessageCircle className="w-5 h-5 text-green-500" /> Share on WhatsApp
            </button>
            <button
              onClick={() => handleShare("telegram")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-sky-500/40 hover:bg-sky-500/5 transition-all text-sm font-medium"
            >
              <Send className="w-5 h-5 text-sky-500" /> Share on Telegram
            </button>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">{typeof window !== "undefined" ? window.location.href : ""}</span>
              <button
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  const utmLink = window.location.origin + window.location.pathname + "?utm_source=copy&utm_medium=link&utm_campaign=pack_share";
                  navigator.clipboard.writeText(utmLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
              >
                {linkCopied ? <Check className="w-4 h-4 text-emerald-500" /> : "Copy"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
