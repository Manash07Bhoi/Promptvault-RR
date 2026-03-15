import { PublicLayout } from "@/components/layout/public-layout";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackCard } from "@/components/shared/pack-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, useInView } from "framer-motion";
import {
  Globe, Twitter, Linkedin, Github, Youtube,
  MapPin, CheckCircle, Users, Package, Download, Star,
  Share2, Edit, UserPlus, UserMinus, Calendar
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

function StatChip({ label, value }: { label: string; value: number | string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numVal = typeof value === "number" ? value : 0;

  useEffect(() => {
    if (!inView || typeof value !== "number") return;
    const start = performance.now();
    const duration = 1500;
    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numVal));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [inView, numVal]);

  return (
    <div ref={ref} className="text-center px-4 sm:px-6 py-3 border-r last:border-r-0 border-border">
      <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
        {typeof value === "number" ? count.toLocaleString() : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
  });

  const { data: packsData } = useQuery({
    queryKey: ["user-packs", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/packs`);
      return res.json();
    },
    enabled: !!username,
  });

  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      const res = await fetch(`/api/user/${username}/follow`, {
        method: action === "follow" ? "POST" : "DELETE",
        headers: { "Authorization": `Bearer ${useAuthStore.getState().accessToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", username] });
    },
  });

  if (isLoading) return (
    <PublicLayout>
      <div className="animate-pulse space-y-4 max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-80" />
      </div>
    </PublicLayout>
  );

  if (error || !data) return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">User Not Found</h1>
        <p className="text-muted-foreground">@{username} doesn't exist or their profile is private.</p>
        <Link href="/creators"><Button className="mt-6">Discover Creators</Button></Link>
      </div>
    </PublicLayout>
  );

  const profile = data;
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Cover Banner */}
        <div className="relative h-40 sm:h-56 rounded-b-3xl overflow-hidden bg-gradient-to-br from-primary/40 via-violet-600/30 to-secondary/40 -mx-4 sm:mx-0">
          {profile.coverImageUrl && (
            <img src={profile.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Header */}
        <div className="relative px-2 sm:px-6">
          <div className="-mt-16 sm:-mt-20 flex items-end justify-between flex-wrap gap-4 mb-6">
            <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-background ring-2 ring-primary/40 shadow-2xl">
              <AvatarImage src={profile.avatarUrl || ""} />
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-violet-600 text-white">
                {profile.displayName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-3 pb-2">
              {isOwnProfile ? (
                <Link href="/dashboard/profile/edit">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" /> Edit Profile
                  </Button>
                </Link>
              ) : isAuthenticated ? (
                <Button
                  size="sm"
                  variant={profile.isFollowing ? "outline" : "default"}
                  className="gap-2"
                  onClick={() => followMutation.mutate(profile.isFollowing ? "unfollow" : "follow")}
                  disabled={followMutation.isPending}
                >
                  {profile.isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                </Button>
              ) : null}
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Name & Info */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground">{profile.displayName}</h1>
                {profile.isVerified && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 fill-blue-500" aria-label="Verified creator" />}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">@{profile.username}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location}</span>}
              {profile.createdAt && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Joined {formatDate(profile.createdAt)}</span>}
            </div>

            {profile.bio && (
              <p className="text-foreground text-sm sm:text-base max-w-2xl leading-relaxed">{profile.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-3 flex-wrap">
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {profile.twitterHandle && (
                <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {profile.githubHandle && (
                <a href={`https://github.com/${profile.githubHandle}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile.youtubeUrl && (
                <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Specialties */}
            {profile.specialties?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {profile.specialties.map((s: string) => (
                  <Link key={s} href={`/search?q=${encodeURIComponent(s)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">{s}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-xl border border-border bg-card/50 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border"
          >
            <StatChip label="Packs Published" value={profile.publicPackCount || 0} />
            <StatChip label="Total Downloads" value={profile.totalDownloadsAllPacks || 0} />
            <Link href={`/u/${username}/followers`} className="contents">
              <StatChip label="Followers" value={profile.followerCount || 0} />
            </Link>
            <Link href={`/u/${username}/following`} className="contents">
              <StatChip label="Following" value={profile.followingCount || 0} />
            </Link>
          </motion.div>

          {/* Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="packs">
              <TabsList className="mb-6">
                <TabsTrigger value="packs">Packs ({packsData?.packs?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="packs">
                {!packsData?.packs?.length ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No published packs yet.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packsData.packs.map((pack: any) => (
                      <PackCard key={pack.id} pack={pack} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
