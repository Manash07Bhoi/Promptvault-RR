import { PublicLayout } from "@/components/layout/public-layout";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Package, Users, Plus } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";

function CollectionCard({ c }: { c: any }) {
  return (
    <Link href={`/collections/${c.id}`}>
      <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/10 relative">
          {c.coverImageUrl && <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />}
          {c.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500/90 text-white text-xs">Featured</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{c.title}</p>
          {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {c.itemCount || 0} packs</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.followerCount || 0} followers</span>
          </div>
          {c.ownerUsername && (
            <p className="text-xs text-muted-foreground mt-2">by @{c.ownerUsername}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CollectionsPage() {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["public-collections"],
    queryFn: async () => {
      const res = await fetch("/api/collections");
      return res.json();
    },
  });

  const collections = data?.collections || [];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Collections</h1>
            <p className="text-muted-foreground text-sm mt-1">Curated sets of AI prompt packs</p>
          </div>
          {isAuthenticated && (
            <Link href="/dashboard/collections/new">
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Collection</Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No public collections yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections.map((c: any) => <CollectionCard key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
