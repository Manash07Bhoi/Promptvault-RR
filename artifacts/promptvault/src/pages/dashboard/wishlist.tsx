import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetUserSavedPacks, useUnsavePack } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Heart, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export default function DashboardWishlist() {
  const { data: packs, refetch, isLoading } = useGetUserSavedPacks();
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const { mutate: removePack } = useUnsavePack({
    mutation: {
      onSuccess: (_: any, vars: { packId: number }) => {
        setRemovingIds(prev => { const next = new Set(prev); next.delete(vars.packId); return next; });
        toast.success("Removed from wishlist");
        refetch();
      },
      onError: (_: any, vars: { packId: number }) => {
        setRemovingIds(prev => { const next = new Set(prev); next.delete(vars.packId); return next; });
        toast.error("Failed to remove from wishlist");
      },
    },
  });

  const handleRemove = useCallback((packId: number) => {
    if (removingIds.has(packId)) return;
    setRemovingIds(prev => new Set(prev).add(packId));
    removePack({ packId });
  }, [removingIds, removePack]);
  const savedPacks = packs || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Saved Packs</h1>
          <p className="text-muted-foreground">{savedPacks.length} packs saved to your wishlist</p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : savedPacks.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold mb-2">No saved packs</h3>
            <p className="text-muted-foreground mb-6">Save packs you're interested in to view them here</p>
            <Link href="/explore"><Button>Explore Packs</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPacks.map((pack: any, i: number) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all group"
              >
                <Link href={`/packs/${pack.slug}`}>
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={pack.thumbnailUrl || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80"}
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-80" />
                  </div>
                </Link>
                <div className="p-4">
                  <Badge variant="outline" className="text-xs mb-2">{pack.categoryName}</Badge>
                  <Link href={`/packs/${pack.slug}`}>
                    <h3 className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">{pack.title}</h3>
                  </Link>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-foreground">{formatPrice(pack.priceCents)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRemove(pack.id)}
                        disabled={removingIds.has(pack.id)}
                        aria-label="Remove from wishlist"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingIds.has(pack.id)
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      <Link href={`/packs/${pack.slug}`}>
                        <Button size="sm" className="h-8 gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" /> Buy
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
