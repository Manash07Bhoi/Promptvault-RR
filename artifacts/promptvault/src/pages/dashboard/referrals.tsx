import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, DollarSign, Link as LinkIcon, Twitter, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600" },
  converted: { label: "Converted", color: "bg-emerald-500/10 text-emerald-600" },
  expired: { label: "Expired", color: "bg-red-500/10 text-red-500" },
};

export default function ReferralsPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["referrals-me"],
    enabled: !!accessToken,
    queryFn: async () => {
      const res = await fetch("/api/referrals/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const referralCode = data?.referralCode || (user as any)?.referralCode || `PVREF${user?.id}`;
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  const stats = data?.stats || { totalReferrals: 0, signups: 0, conversions: 0, totalCreditsCents: 0 };
  const referrals = data?.referrals || [];
  const creditBalance = data?.creditBalanceCents || 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };

  const tweetShare = () => {
    const text = encodeURIComponent(`I use PromptVault for my AI prompts — check it out and get 15% off your first pack! ${referralUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Referral Program</h1>
            <p className="text-muted-foreground text-sm">Invite friends and earn $5 credit on their first purchase.</p>
          </div>
          {creditBalance > 0 && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-center">
              <p className="text-xs text-emerald-600 font-medium">Credit Balance</p>
              <p className="text-xl font-bold text-emerald-600">${(creditBalance / 100).toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: LinkIcon, title: "1. Share your link", desc: "Share your unique referral link with friends" },
            { icon: Users, title: "2. They sign up", desc: "They get 15% off their first purchase" },
            { icon: DollarSign, title: "3. You earn $5", desc: "You receive $5 credit on their first purchase" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Your Referral Link</h3>
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <>
              <div className="flex gap-2">
                <Input value={referralUrl} readOnly className="font-mono text-sm" />
                <Button onClick={copyLink} className="gap-2 flex-shrink-0">
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">Your code: <span className="font-mono font-semibold text-primary">{referralCode}</span></p>
                <Button variant="outline" size="sm" onClick={tweetShare} className="gap-2 ml-auto">
                  <Twitter className="w-3.5 h-3.5" /> Share on X
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Link Clicks", value: referrals.reduce((s: number, r: any) => s + (r.clickCount || 0), 0) },
              { label: "Sign Ups", value: stats.signups },
              { label: "Conversions", value: stats.conversions },
              { label: "Credits Earned", value: `$${(stats.totalCreditsCents / 100).toFixed(2)}` },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Referral History */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Referral History</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-10 text-center text-muted-foreground">
              <Gift className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No referrals yet</p>
              <p className="text-sm mt-1">Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r: any) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {r.status === "converted" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Referral #{r.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        {r.clickCount > 0 && ` · ${r.clickCount} clicks`}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                    {r.creditAwardedCents > 0 && (
                      <span className="text-sm font-semibold text-emerald-600">+${(r.creditAwardedCents / 100).toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Program Terms</p>
          <p>• Referrer receives $5 credit when referred user completes their first purchase (minimum $10).</p>
          <p>• Referred user receives 15% off their first purchase automatically.</p>
          <p>• Credits can be used at checkout, no minimum order value.</p>
          <p>• Self-referrals and fraudulent signups will be disqualified.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
