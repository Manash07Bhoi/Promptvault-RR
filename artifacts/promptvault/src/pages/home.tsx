import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Search, Sparkles, Zap, Code, PenTool, Database,
  Users, Package, Star, Download, CheckCircle2, TrendingUp,
  Briefcase, Bot, Image, BookOpen, Play, ChevronRight
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useListPacks, useGetSiteStats, useGetFeaturedPacks, useGetBestsellerPacks, useGetTrendingPacks, useListCategories } from "@workspace/api-client-react";
import { PackCard } from "@/components/shared/pack-card";
import { useRef, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

// Animated counter hook
function useCountUp(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [target, duration, started]);
  return count;
}

const AI_TOOLS = [
  { name: "ChatGPT", color: "#10a37f", icon: "🤖" },
  { name: "Claude", color: "#e67e22", icon: "⚡" },
  { name: "Midjourney", color: "#5865f2", icon: "🎨" },
  { name: "DALL-E 3", color: "#00a67e", icon: "🖼️" },
  { name: "Gemini", color: "#4285f4", icon: "✨" },
  { name: "Runway", color: "#ff3366", icon: "🎬" },
  { name: "Sora", color: "#7c3aed", icon: "🌊" },
  { name: "Stable Diffusion", color: "#ec4899", icon: "🎯" },
  { name: "Llama 3", color: "#f59e0b", icon: "🦙" },
  { name: "Perplexity", color: "#20c6a0", icon: "🔍" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse & Discover",
    description: "Explore our curated library of prompt packs across 10+ categories. Filter by AI tool, use case, or budget.",
    icon: Search,
    color: "from-primary to-violet-600",
  },
  {
    step: "02",
    title: "Purchase Instantly",
    description: "Secure checkout in seconds. Get immediate access to all prompts the moment your payment is confirmed.",
    icon: Zap,
    color: "from-secondary to-cyan-500",
  },
  {
    step: "03",
    title: "Generate Results",
    description: "Copy, customize, and use prompts immediately. Each pack includes detailed instructions and example outputs.",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  marketing: <TrendingUp className="w-6 h-6" />,
  coding: <Code className="w-6 h-6" />,
  writing: <PenTool className="w-6 h-6" />,
  business: <Briefcase className="w-6 h-6" />,
  design: <Image className="w-6 h-6" />,
  productivity: <Zap className="w-6 h-6" />,
  "ai-agents": <Bot className="w-6 h-6" />,
  "image-generation": <Image className="w-6 h-6" />,
  "video-generation": <Play className="w-6 h-6" />,
  education: <BookOpen className="w-6 h-6" />,
};

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, 2000, inView);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="text-3xl lg:text-4xl font-display font-extrabold text-foreground">
        {count.toLocaleString()}+
      </div>
      <div className="text-sm text-muted-foreground font-medium mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: packsData, isLoading: packsLoading } = useListPacks({ limit: 8, sort: "popular" });
  const { data: featuredData } = useGetFeaturedPacks();
  const { data: bestsellersData } = useGetBestsellerPacks();
  const { data: trendingData } = useGetTrendingPacks();
  const { data: statsData } = useGetSiteStats();
  const { data: categoriesData } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setLocation("/explore");
    }
  };

  const displayPacks = featuredData?.length ? featuredData : packsData?.packs || [];
  const trendingPacks = trendingData?.length ? trendingData.slice(0, 5) : packsData?.packs?.slice(0, 5) || [];
  const bestsellerPacks = bestsellersData?.length ? bestsellersData.slice(0, 6) : packsData?.packs?.slice(0, 6) || [];
  const categories = categoriesData || [];

  const stats = [
    { icon: Package, value: statsData?.totalPacks ?? 0, label: "Prompt Packs", color: "from-primary to-violet-700" },
    { icon: Sparkles, value: statsData?.totalPrompts ?? 0, label: "Total Prompts", color: "from-secondary to-cyan-600" },
    { icon: Users, value: statsData?.totalUsers ?? 0, label: "Active Users", color: "from-amber-500 to-orange-600" },
    { icon: Star, value: (statsData as any)?.totalReviews ?? 0, label: "5-Star Reviews", color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <PublicLayout>
      <SEO
        canonical="/"
        title="Premium AI Prompt Packs"
        description="Discover and purchase curated AI prompt packs for ChatGPT, Claude, Midjourney and more. Unlock your AI potential with professional prompts."
        keywords="AI prompts, ChatGPT prompts, Claude prompts, Midjourney prompts, prompt engineering"
      />
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-1/3 left-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[80px] animate-pulse [animation-delay:4s]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236C47FF%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 text-primary text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>The #1 AI Prompt Marketplace</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-6 leading-[1.05]">
              Premium Prompts for
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-400 to-secondary bg-clip-text text-transparent">
                Every AI Tool
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover expertly engineered prompt packs for ChatGPT, Claude, Midjourney, and more.
              Stop wasting hours crafting prompts — start creating results.
            </p>

            {/* Hero Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
              <div className="flex gap-3 p-2 bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-primary/10">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 'SaaS marketing', 'code review', 'Midjourney'..."
                    className="w-full h-13 pl-12 pr-4 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-base"
                  />
                </div>
                <Button type="submit" size="lg" className="h-13 rounded-xl px-8 shrink-0">
                  Search
                </Button>
              </div>
            </form>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {[
                { icon: CheckCircle2, label: "Expert-Engineered Prompts" },
                { icon: Zap, label: "Instant Download" },
                { icon: Star, label: "4.8★ Average Rating" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating Pack Cards */}
          <div className="hidden xl:block">
            {displayPacks.slice(0, 2).map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, x: i === 0 ? -40 : 40, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.7 }}
                className={`absolute top-1/3 ${i === 0 ? "left-4 xl:left-8 2xl:left-24 -rotate-3" : "right-4 xl:right-8 2xl:right-24 rotate-3"} w-56 glass-panel rounded-2xl p-4 shadow-2xl border border-border/50`}
              >
                <div className="w-full h-28 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-3 flex items-center justify-center text-3xl">
                  {i === 0 ? "🤖" : "✍️"}
                </div>
                <div className="text-xs font-semibold text-foreground line-clamp-1">{pack.title}</div>
                <div className="text-xs text-primary font-bold mt-1">{formatPrice(pack.priceCents)}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 rounded-full bg-muted-foreground animate-pulse" />
        </motion.div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="py-16 border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED PACKS ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
                <Sparkles className="w-4 h-4" /> Featured Packs
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Hand-Picked Collections</h2>
              <p className="text-muted-foreground text-lg mt-2">Our team's top picks for maximum impact</p>
            </div>
            <Link href="/explore" aria-label="View all prompt packs">
              <Button variant="outline" className="hidden md:flex items-center gap-2" tabIndex={-1} aria-hidden="true">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {packsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card h-[360px] animate-pulse">
                  <div className="h-44 bg-muted rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayPacks.slice(0, 8).map((pack, index) => (
                <PackCard key={pack.id} pack={pack} index={index} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link href="/explore">
              <Button variant="outline">View All Packs <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section className="py-24 bg-card/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
              <Package className="w-4 h-4" /> Browse Categories
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Every Use Case Covered</h2>
            <p className="text-muted-foreground text-lg">From marketing copy to AI agents — find the exact prompts your workflow needs.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat: any, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/categories/${cat.slug}`}>
                  <div
                    className="group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden text-center"
                    style={{ "--cat-color": cat.color } as any}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at center, ${cat.color}, transparent 70%)` }}
                    />
                    <div className="text-3xl mb-3">{cat.icon || "📦"}</div>
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{cat.packCount || 0} packs</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRENDING THIS WEEK ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-secondary text-sm font-semibold mb-3">
                <TrendingUp className="w-4 h-4" /> Trending This Week
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                What's Hot Right Now
              </h2>
              <p className="text-muted-foreground text-lg mb-10">
                The most popular prompt packs this week, ranked by downloads and ratings.
              </p>

              <div className="space-y-3">
                {trendingPacks.slice(0, 5).map((pack, i) => (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/packs/${pack.slug}`}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                          i === 0 ? "bg-amber-500/20 text-amber-400" :
                          i === 1 ? "bg-slate-500/20 text-slate-400" :
                          i === 2 ? "bg-orange-800/20 text-orange-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{pack.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{pack.categoryName} · {pack.totalDownloads} downloads</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            {pack.avgRating?.toFixed(1) || "New"}
                          </div>
                          <span className="font-bold text-foreground text-sm">{formatPrice(pack.priceCents)}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <Link href="/trending">
                <Button variant="outline" className="mt-8">
                  See All Trending <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {bestsellerPacks.slice(0, 3).map((pack, i) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <Link href={`/packs/${pack.slug}`}>
                    <div className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 group cursor-pointer">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl shrink-0">
                        {i === 0 ? "🏆" : i === 1 ? "⭐" : "🎯"}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Bestseller</Badge>
                          <span className="text-xs text-amber-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> {pack.avgRating?.toFixed(1) || "4.9"}
                          </span>
                        </div>
                        <div className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{pack.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">{pack.shortDescription}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-bold text-primary">{formatPrice(pack.priceCents)}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Download className="w-3 h-3" /> {pack.totalDownloads} sales
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 bg-card/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
              <Play className="w-4 h-4" /> How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              From Zero to Results in Minutes
            </h2>
            <p className="text-muted-foreground text-lg">
              Get your first AI-powered results in under 5 minutes. No expertise required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px bg-gradient-to-r from-primary via-secondary to-amber-500 opacity-40" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-mono font-bold text-muted-foreground mb-3 tracking-wider">STEP {step.step}</div>
                <h3 className="text-xl font-display font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AI TOOLS MARQUEE ═══════════ */}
      <section className="py-16 border-b border-border/50 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">Works with all leading AI platforms</p>
        </div>
        <div className="relative">
          <div className="flex gap-6 animate-marquee">
            {[...AI_TOOLS, ...AI_TOOLS, ...AI_TOOLS].map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border bg-card/50 whitespace-nowrap shrink-0"
              >
                <span className="text-xl">{tool.icon}</span>
                <span className="font-semibold text-sm text-foreground">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SIGNUP CTA BANNER ═══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-secondary p-12 text-center shadow-2xl shadow-primary/30"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" /> Join Our AI Power Users
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-5">
                Start Generating Better
                <br />AI Outputs Today
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Get access to expertly crafted prompt packs and stop spending hours on prompt engineering. Start creating better AI outputs from day one.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/explore">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 h-14 px-10 text-lg font-semibold rounded-xl shadow-lg">
                    Browse Packs <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-14 px-10 text-lg rounded-xl">
                    Create Free Account
                  </Button>
                </Link>
              </div>
              <p className="text-white/60 text-sm mt-6">No credit card required to browse. Coupon: WELCOME20 for 20% off your first purchase.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
