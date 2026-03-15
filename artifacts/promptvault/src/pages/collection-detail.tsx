import { PublicLayout } from "@/components/layout/public-layout";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { PackCard } from "@/components/shared/pack-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Users, Package, Heart, Share2, Edit, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      const res = await fetch(`/api/collections/${id}/follow`, {
        method: action === "follow" ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection", id] }),
  });

  if (isLoading) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Skeleton className="h-40 rounded-xl mb-6" />
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    </PublicLayout>
  );

  if (error || !data) return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-muted-foreground">
        <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-xl font-semibold text-foreground">Collection not found</p>
        <Link href="/collections"><Button variant="outline" className="mt-4">Browse Collections</Button></Link>
      </div>
    </PublicLayout>
  );

  const { collection, items, isFollowing } = data;
  const isOwner = user?.id === collection.userId;

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back Button */}
        <Link href="/collections">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Collections
          </Button>
        </Link>
        {/* Header */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8">
          {collection.coverImageUrl ? (
            <img src={collection.coverImageUrl} alt={collection.title} className="w-full h-40 object-cover" />
          ) : (
            <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/10" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{collection.title}</h1>
                {collection.description && <p className="text-muted-foreground mt-1">{collection.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {collection.itemCount || 0} packs</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {collection.followerCount || 0} followers</span>
                </div>
                {collection.ownerUsername && (
                  <Link href={`/u/${collection.ownerUsername}`}>
                    <p className="text-sm text-muted-foreground mt-2 hover:text-primary transition-colors">by @{collection.ownerUsername}</p>
                  </Link>
                )}
              </div>
              <div className="flex gap-2">
                {isAuthenticated && !isOwner && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => followMutation.mutate(isFollowing ? "unfollow" : "follow")}
                    disabled={followMutation.isPending}
                  >
                    <Heart className={isFollowing ? "w-4 h-4 fill-current text-red-500" : "w-4 h-4"} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Pack Grid */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No packs in this collection yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <div key={item.id}>
                {/* Render pack card or placeholder */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-foreground">Pack #{item.itemId}</p>
                  <p className="text-xs text-muted-foreground">{item.itemType}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
