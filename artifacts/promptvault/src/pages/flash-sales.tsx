import { PublicLayout } from "@/components/layout/public-layout";
import { useQuery } from "@tanstack/react-query";
import { PackCard } from "@/components/shared/pack-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Clock, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Countdown({ endDate }: { endDate?: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = endDate ? new Date(endDate).getTime() : Date.now() + 24 * 60 * 60 * 1000;

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <span className="bg-card border border-border rounded px-2 py-0.5 text-foreground font-bold">{pad(timeLeft.h)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-card border border-border rounded px-2 py-0.5 text-foreground font-bold">{pad(timeLeft.m)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-card border border-border rounded px-2 py-0.5 text-foreground font-bold">{pad(timeLeft.s)}</span>
    </div>
  );
}

function SalePackCard({ pack }: { pack: any }) {
  const originalPrice = pack.priceCents;
  const salePrice = pack.salePriceCents || Math.round(pack.priceCents * 0.6);
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-red-500 text-white font-bold text-xs gap-1">
          <Zap className="w-3 h-3" /> -{discount}%
        </Badge>
      </div>
      <Link href={`/packs/${pack.slug}`}>
        <div className="group rounded-2xl border border-red-500/30 bg-card hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 overflow-hidden cursor-pointer">
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-red-500/10 to-orange-500/5">
            {pack.thumbnailUrl ? (
              <img src={pack.thumbnailUrl} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-red-500/40" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors mb-3">
              {pack.title}
            </h3>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-lg font-bold text-red-500">${(salePrice / 100).toFixed(2)}</span>
                <span className="ml-2 text-sm text-muted-foreground line-through">${(originalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FlashSalesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["flash-sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales");
      return res.json();
    },
  });

  // Also load discounted packs (packs with sale price set)
  const { data: trending } = useQuery({
    queryKey: ["trending-for-sales"],
    queryFn: async () => {
      const res = await fetch("/api/packs/trending?limit=6");
      return res.json();
    },
  });

  const salePacks = data?.packs || [];
  const trendingPacks = (trending?.packs || []).slice(0, 6);

  // Use trending as flash sale items if no real sale packs
  const displayPacks = salePacks.length > 0 ? salePacks : trendingPacks;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 border border-red-500/20 p-8 mb-10 overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_50%_50%,_var(--tw-gradient-stops))] from-red-500 to-transparent" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <Badge className="mb-3 bg-red-500/10 text-red-500 border-red-500/30 gap-1.5 text-sm">
                  <Zap className="w-4 h-4" /> Flash Sale — Limited Time
                </Badge>
                <h1 className="text-4xl font-display font-bold text-foreground mb-2">Flash Sales</h1>
                <p className="text-muted-foreground">Massive discounts on premium prompt packs. Sale ends soon!</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Sale ends in
                </p>
                <Countdown />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Zap, label: "Packs on Sale", value: displayPacks.length || "10+" },
            { icon: TrendingDown, label: "Avg. Discount", value: "40%" },
            { icon: Sparkles, label: "Limited Time", value: "24h" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <div className="text-xl font-bold font-mono text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Packs */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : displayPacks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No active sales right now</h2>
            <p className="mb-6">Check back soon — we run flash sales regularly!</p>
            <Link href="/explore">
              <Button>Browse All Packs <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPacks.map((pack: any) => (
              <SalePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}

        {/* CTA */}
        {displayPacks.length > 0 && (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">Don't miss these deals — they expire soon!</p>
            <Link href="/explore">
              <Button variant="outline">Browse More Packs <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
