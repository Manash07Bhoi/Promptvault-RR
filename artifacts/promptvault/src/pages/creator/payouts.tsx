import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { DollarSign, ExternalLink, CreditCard, Info, TrendingUp, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CreatorPayoutsPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-payouts"],
    queryFn: async () => {
      const res = await fetch("/api/creator/payouts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/creator">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Creator Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground text-sm">Your earnings and payout settings</p>
        </div>

        {/* Balance Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Gross Revenue", value: formatPrice(data?.grossRevenueCents || 0), icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
            { label: `Your Share (${data?.commissionRate || 70}%)`, value: formatPrice(data?.creatorEarningsCents || 0), icon: DollarSign, color: "text-green-500 bg-green-500/10" },
            { label: "Available to Payout", value: formatPrice(0), icon: CreditCard, color: "text-violet-500 bg-violet-500/10" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Stripe Connect */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Payout Method
          </h3>
          {data?.isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">Stripe Connect linked</p>
                <p className="text-xs text-muted-foreground">{data.stripeConnectId}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Manage
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Connect your Stripe account to receive payouts. Payouts are processed every 30 days.</p>
              <Button className="gap-2">
                <ExternalLink className="w-4 h-4" /> Connect Stripe Account
              </Button>
            </div>
          )}
        </div>

        {/* Revenue Share Info */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Your revenue share: {data?.commissionRate || 70}%</strong></p>
            <p>PromptVault retains {100 - (data?.commissionRate || 70)}% to cover payment processing, platform costs, and marketing. Payouts occur monthly, with a minimum threshold of $25.</p>
          </div>
        </div>

        {/* Payout History */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Payout History</h3>
          <div className="rounded-xl border border-border border-dashed p-10 text-center text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No payouts yet. Connect Stripe and start earning!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
