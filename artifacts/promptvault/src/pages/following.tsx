import { PublicLayout } from "@/components/layout/public-layout";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Package, Users, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["following", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/following`);
      return res.json();
    },
  });

  const following = data?.following || [];
  const filtered = search
    ? following.filter((u: any) => u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()))
    : following;

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/u/${username}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to @{username}
          </Button>
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/u/${username}`} className="text-muted-foreground hover:text-foreground transition-colors">@{username}</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-display font-bold text-foreground">Following</h1>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search following..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Not following anyone yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user: any) => (
              <Link key={user.id} href={`/u/${user.username}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatarUrl || ""} />
                    <AvatarFallback className="font-bold bg-gradient-to-br from-primary to-violet-600 text-white">{user.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                      {user.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {user.publicPackCount || 0}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(user.followerCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
