import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Users, Crown, Star, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Star,
    color: "from-muted to-muted/50",
    features: ["Browse all packs", "Purchase individual packs", "Basic prompt access", "5 bookmarks"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 1499,
    icon: Zap,
    color: "from-primary to-violet-600",
    features: ["Everything in Free", "10 monthly credits (packs)", "Unlimited bookmarks", "Personal prompt library", "Early access to new packs", "Priority support"],
  },
  {
    id: "teams",
    name: "Teams",
    price: 4999,
    icon: Users,
    color: "from-secondary to-cyan-600",
    features: ["Everything in Pro", "5 team seats", "Shared workspace", "Team prompt library", "Bulk download", "Dedicated account manager"],
  },
];

export default function SubscriptionPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ plan }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: () => toast({ title: "Error", description: "Failed to start checkout", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      toast({ title: "Subscription cancelled", description: "Your plan will remain active until the end of the billing period." });
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const currentPlan = data?.currentPlan || "free";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Subscription</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your PromptVault subscription and credits</p>
        </div>

        {/* Current Subscription */}
        {data?.subscription && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
            <Crown className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground capitalize">{currentPlan} Plan</p>
                {data.subscription.cancelAtPeriodEnd && (
                  <Badge variant="destructive" className="text-xs">Cancels at period end</Badge>
                )}
              </div>
              {data.subscription.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {data.subscription.cancelAtPeriodEnd ? "Expires" : "Renews"} {formatDate(data.subscription.currentPeriodEnd)}
                </p>
              )}
              {data.credits && (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.credits.creditsAvailable} credits remaining this month
                </p>
              )}
            </div>
            {!data.subscription.cancelAtPeriodEnd && currentPlan !== "free" && (
              <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                Cancel Plan
              </Button>
            )}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl border p-6 flex flex-col transition-all",
                  isCurrent ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4", plan.color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                  {isCurrent && <Badge className="text-xs">Current</Badge>}
                </div>
                <p className="text-3xl font-mono font-bold text-foreground mb-4">
                  {plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.price > 0 && (
                  <Button
                    className="w-full"
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    disabled={upgradeMutation.isPending}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
                {isCurrent && <div className="text-center text-sm text-primary font-medium">✓ Active Plan</div>}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Common Questions</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div><strong className="text-foreground">What are credits?</strong> Each monthly credit lets you download one paid pack for free (up to the credit value).</div>
            <div><strong className="text-foreground">Can I cancel anytime?</strong> Yes. If you cancel, your plan stays active until the end of the billing period.</div>
            <div><strong className="text-foreground">What happens to my packs if I downgrade?</strong> You keep all packs you've downloaded — forever.</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
