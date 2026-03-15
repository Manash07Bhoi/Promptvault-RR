import { PublicLayout } from "@/components/layout/public-layout";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Search, Users, Download, CheckCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function CreatorCard({ creator, index }: { creator: any; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link href={`/u/${creator.username}`}>
        <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer p-5 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-border group-hover:ring-primary/30 transition-all">
              <AvatarImage src={creator.avatarUrl || ""} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-violet-600 text-white">
                {creator.displayName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-foreground truncate">{creator.displayName}</p>
                {creator.isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">@{creator.username}</p>
            </div>
          </div>
          {creator.bio && <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>}
          {creator.specialties?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {creator.specialties.slice(0, 3).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
              {creator.specialties.length > 3 && <Badge variant="secondary" className="text-xs">+{creator.specialties.length - 3}</Badge>}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {creator.publicPackCount || 0} packs</span>
            <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {(creator.totalDownloadsAllPacks || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(creator.followerCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DiscoverCreatorsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["creators-discover", q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/creators?${params}`);
      return res.json();
    },
  });

  const creators = data?.creators || [];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-foreground mb-3">Discover Creators</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Explore prompt experts specialising in ChatGPT, Claude, Midjourney, and more.</p>
        </div>
        <div className="flex gap-3 max-w-md mx-auto mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search creators..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setQ(search)} />
          </div>
          <Button onClick={() => setQ(search)}>Search</Button>
        </div>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No creators found{q ? ` for "${q}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((c: any, i: number) => <CreatorCard key={c.id} creator={c} index={i} />)}
          </div>
        )}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-border p-10 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Become a Creator</h2>
          <p className="text-muted-foreground mb-5">Share your AI expertise and earn 70% on every sale.</p>
          <Link href="/become-a-creator"><Button size="lg">Apply Now</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
