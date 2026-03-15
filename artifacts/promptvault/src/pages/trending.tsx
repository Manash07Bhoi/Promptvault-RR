import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { useGetTrendingPacks } from "@workspace/api-client-react";
import { PackCard } from "@/components/shared/pack-card";
import { Flame, Trophy } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Trending() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data: packs, isLoading } = useGetTrendingPacks({
    period,
    category
  });

  const categories = ["All", "Development", "Marketing", "Design", "Writing"];

  return (
    <PublicLayout>
      <SEO
        canonical="/trending"
        title="Trending Prompt Packs"
        description="Discover the hottest and most downloaded AI prompt packs across the marketplace. Updated daily based on real user activity."
        keywords="trending AI prompts, popular prompt packs, best AI prompts"
      />
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Flame className="w-6 h-6" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">Trending Packs</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            The hottest and most downloaded prompt engineering packs across the marketplace.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-12 bg-card p-4 rounded-2xl border border-border">
          {/* Time Filter Tabs */}
          <div className="flex bg-muted rounded-xl p-1">
            <button 
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${period === "24h" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setPeriod("24h")}
            >
              Today
            </button>
            <button 
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${period === "7d" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setPeriod("7d")}
            >
              This Week
            </button>
            <button 
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${period === "30d" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setPeriod("30d")}
            >
              This Month
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground mr-2">Category:</span>
            {categories.map((c) => (
              <Badge 
                key={c}
                variant={category === (c === "All" ? undefined : c) ? "default" : "outline"}
                className={`cursor-pointer text-sm py-1.5 px-4 rounded-full ${category === (c === "All" ? undefined : c) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/10 hover:border-primary/30"}`}
                onClick={() => setCategory(c === "All" ? undefined : c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ranked Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 h-[350px] animate-pulse relative">
                 <div className="absolute -top-4 -left-4 w-10 h-10 bg-muted rounded-full z-10" />
                 <div className="w-full h-40 bg-muted rounded-xl mb-4" />
                 <div className="w-3/4 h-6 bg-muted rounded mb-2" />
              </div>
            ))}
          </div>
        ) : packs && packs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {packs.map((pack, index) => {
              // Determine badge style based on rank
              let rankColor = "bg-muted text-muted-foreground";
              let rankIcon = null;
              
              if (index === 0) {
                rankColor = "bg-amber-400 text-amber-950 ring-4 ring-amber-400/20";
                rankIcon = <Trophy className="w-4 h-4" />;
              } else if (index === 1) {
                rankColor = "bg-zinc-300 text-zinc-900 ring-4 ring-zinc-300/20";
              } else if (index === 2) {
                rankColor = "bg-amber-700 text-amber-100 ring-4 ring-amber-700/20";
              } else {
                rankColor = "bg-card border-2 border-border text-foreground";
              }

              return (
                <div key={pack.id} className="relative">
                  {/* Rank Badge */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg z-20 shadow-lg ${rankColor}`}>
                    {rankIcon || `#${index + 1}`}
                  </div>
                  
                  <div className={`h-full rounded-2xl ${index < 3 ? 'ring-1 ring-primary/20 shadow-xl shadow-primary/5' : ''}`}>
                    <PackCard pack={pack} index={index} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No trending packs found</h3>
            <p className="text-muted-foreground">Try selecting a different time period or category.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
