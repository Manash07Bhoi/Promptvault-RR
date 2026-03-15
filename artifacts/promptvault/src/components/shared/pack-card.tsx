import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Heart, Star, Download, Sparkles, Lock, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Pack } from "@workspace/api-client-react";
import { useSavePack, useUnsavePack } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/use-auth-store";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

interface PackCardProps {
  pack: Pack;
  index?: number;
  isSaved?: boolean;
  isPurchased?: boolean;
}

const THUMBNAIL_FALLBACKS: Record<string, string> = {
  marketing: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80&fit=crop",
  coding: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80&fit=crop",
  writing: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&fit=crop",
  business: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&fit=crop",
  design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80&fit=crop",
  productivity: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80&fit=crop",
  education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&fit=crop",
  default: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80&fit=crop",
};

const SVG_FALLBACK = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231a1a2e'/%3E%3Ccircle cx='400' cy='200' r='60' fill='%236c47ff' opacity='0.3'/%3E%3Ctext x='400' y='280' text-anchor='middle' fill='%236c47ff' font-size='48' font-family='sans-serif'%3E✦%3C/text%3E%3Ctext x='400' y='340' text-anchor='middle' fill='%23ffffff' opacity='0.4' font-size='18' font-family='sans-serif'%3EPromptVault%3C/text%3E%3C/svg%3E`;

export function usePurchasedPackIds() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { data } = useQuery({
    queryKey: ["purchasedPacks"],
    queryFn: async () => {
      const res = await fetch("/api/orders/purchased-pack-ids", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { packIds: [] };
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  return (data?.packIds || []) as number[];
}

export function PackCard({ pack, index = 0, isSaved = false, isPurchased: isPurchasedProp }: PackCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const purchasedIds = usePurchasedPackIds();
  const isPurchased = isPurchasedProp ?? purchasedIds.includes(pack.id);

  const savePack = useSavePack({
    mutation: {
      onSuccess: () => {
        setSaved(true);
        setSaving(false);
        toast.success("Added to wishlist!");
        queryClient.invalidateQueries({ queryKey: ["savedPacks"] });
      },
      onError: () => { setSaving(false); },
    },
  });

  const unsavePack = useUnsavePack({
    mutation: {
      onSuccess: () => {
        setSaved(false);
        setSaving(false);
        toast.success("Removed from wishlist");
        queryClient.invalidateQueries({ queryKey: ["savedPacks"] });
      },
      onError: () => { setSaving(false); },
    },
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (saving) return;
    setSaving(true);
    if (saved) {
      unsavePack.mutate({ packId: pack.id });
    } else {
      savePack.mutate({ packId: pack.id });
    }
  };

  const catSlug = pack.categorySlug || "default";
  const fallbackUrl = THUMBNAIL_FALLBACKS[catSlug] || THUMBNAIL_FALLBACKS.default;
  const thumbnail = imgError ? SVG_FALLBACK : (pack.thumbnailUrl || fallbackUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.5) }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_10px_40px_-10px_rgba(108,71,255,0.22)] hover:border-primary/40 transition-all duration-300"
    >
      {/* Thumbnail */}
      <Link href={`/packs/${pack.slug}`} className="relative aspect-video w-full overflow-hidden block">
        <img
          src={thumbnail}
          alt={pack.title}
          width={800}
          height={450}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-75" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {pack.isBestseller && (
            <Badge className="bg-amber-500/90 text-white border-0 text-[10px] shadow-md">
              🏆 Bestseller
            </Badge>
          )}
          {pack.isFeatured && !pack.isBestseller && (
            <Badge variant="default" className="flex items-center gap-1 text-[10px] shadow-md">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </Badge>
          )}
          {pack.categoryName && (
            <Badge variant="outline" className="bg-background/50 backdrop-blur-md text-[10px] shadow-md">{pack.categoryName}</Badge>
          )}
        </div>

        {/* Free badge */}
        {pack.isFree && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-emerald-500 text-white border-0 text-[10px] shadow-md">FREE</Badge>
          </div>
        )}

        {/* Purchased badge */}
        {isPurchased && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-primary/90 text-white border-0 text-[10px] shadow-md gap-1">
              <Package className="w-2.5 h-2.5" /> Owned
            </Badge>
          </div>
        )}

        {/* Wishlist Button */}
        {!isPurchased && (
          <button
            onClick={handleWishlist}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all duration-200 ${
              saved
                ? "bg-rose-500/90 border-rose-500/50 text-white shadow-lg"
                : "bg-background/50 border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10"
            } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link href={`/packs/${pack.slug}`} className="flex-grow min-w-0">
            <h3 className="font-display font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {pack.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm font-semibold text-amber-400 shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{pack.avgRating ? Number(pack.avgRating).toFixed(1) : "New"}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow leading-relaxed">
          {pack.shortDescription || "Elevate your AI outputs with this premium prompt collection."}
        </p>

        {/* AI tools */}
        {(pack.aiToolTargets || []).length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {(pack.aiToolTargets || []).slice(0, 3).map((t: string) => (
              <span key={t} className="inline-flex items-center text-[10px] font-medium text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Download className="w-3.5 h-3.5" />
            <span>{pack.totalDownloads?.toLocaleString() || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPurchased ? (
              <Link href={`/dashboard/packs/${pack.id}/prompts`}>
                <span className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <Package className="w-3 h-3" /> View Pack
                </span>
              </Link>
            ) : (
              <>
                {pack.comparePriceCents && pack.comparePriceCents > (pack.priceCents || 0) && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(pack.comparePriceCents)}
                  </span>
                )}
                <span className="font-display font-bold text-base text-foreground">
                  {pack.isFree ? (
                    <span className="text-emerald-500">Free</span>
                  ) : (!pack.priceCents || pack.priceCents === 0) ? (
                    <span className="text-muted-foreground text-sm">Price unavailable</span>
                  ) : formatPrice(pack.priceCents)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
