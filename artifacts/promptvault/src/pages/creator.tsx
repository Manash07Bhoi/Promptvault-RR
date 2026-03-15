import { PublicLayout } from "@/components/layout/public-layout";
import { useParams } from "wouter";
import { useListPacks } from "@workspace/api-client-react";
import { PackCard } from "@/components/shared/pack-card";
import { Package } from "lucide-react";
import { motion } from "framer-motion";

export default function CreatorProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username || "creator";

  const displayName = username.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const { data, isLoading } = useListPacks({ limit: 8, sort: "popular" });

  return (
    <PublicLayout>
      {/* Creator Cover & Profile */}
      <div className="relative mb-24">
        <div className="h-64 md:h-80 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 mix-blend-overlay" />
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80&fit=crop"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl -mt-24 md:-mt-32 relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card overflow-hidden bg-muted shrink-0 -mt-16 md:-mt-20 shadow-xl">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=6c47ff`}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 w-full">
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                  {displayName}
                  <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                    Creator
                  </div>
                </h1>
                <p className="text-muted-foreground font-medium">@{username}</p>
              </div>

              <p className="text-muted-foreground text-sm">
                Creator profile details are not yet available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div className="container mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
          <h2 className="text-2xl font-display font-bold">Explore Prompt Packs</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 h-[350px] animate-pulse">
                <div className="w-full h-40 bg-muted rounded-xl mb-4" />
                <div className="w-3/4 h-6 bg-muted rounded mb-2" />
              </div>
            ))}
          </div>
        ) : (data?.packs || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data!.packs.map((pack, index) => (
              <PackCard key={pack.id} pack={pack} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-3xl border border-border">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold mb-2">No packs available</h3>
            <p className="text-muted-foreground">Check back later for new prompt packs.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
