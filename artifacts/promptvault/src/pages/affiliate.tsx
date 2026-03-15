import { PublicLayout } from "@/components/layout/public-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  DollarSign, Users, TrendingUp, Copy, Check, ChevronRight,
  Gift, Zap, Shield, Star, BarChart2, Globe, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HOW_IT_WORKS = [
  { icon: Globe, title: "Share Your Link", desc: "Get a unique referral link and share it anywhere — social media, blog, YouTube." },
  { icon: Users, title: "Friends Sign Up", desc: "When someone clicks your link and joins PromptVault, they're tagged to your account." },
  { icon: DollarSign, title: "Earn Commission", desc: "You earn 20% commission on every purchase they make — forever, not just the first one." },
  { icon: Gift, title: "Get Paid", desc: "Earnings are paid monthly via PayPal or Stripe once you reach the $25 minimum payout." },
];

const TIERS = [
  { name: "Starter", referrals: "0–9", commission: "20%", perks: ["Monthly payouts", "Basic analytics", "Shareable link"], color: "from-slate-500 to-slate-600" },
  { name: "Pro", referrals: "10–49", commission: "25%", perks: ["All Starter perks", "Priority support", "Custom promo banners", "Early access to promos"], color: "from-primary to-violet-700", badge: "Most Popular" },
  { name: "Elite", referrals: "50+", commission: "30%", perks: ["All Pro perks", "Dedicated account manager", "Revenue share on sub-affiliates", "Co-marketing opportunities"], color: "from-amber-500 to-orange-600" },
];

export default function AffiliatePage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: affiliate } = useQuery({
    queryKey: ["affiliate-info"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/my", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/referrals/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to apply");
      return res.json();
    },
    onSuccess: () => toast({ title: "Applied!", description: "You're now enrolled in the PromptVault affiliate program." }),
    onError: () => toast({ title: "Error", description: "Please try again.", variant: "destructive" }),
  });

  const referralLink = affiliate?.referralCode
    ? `${window.location.origin}/r/${affiliate.referralCode}`
    : `${window.location.origin}/r/your-code`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Your referral link is on the clipboard." });
  };

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm">
            Affiliate Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-5">
            Earn up to <span className="text-gradient">30% Commission</span><br />on Every Sale
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of affiliates earning recurring commissions by sharing PromptVault with their audience.
            No cap, no limits — earn as long as your referrals keep buying.
          </p>
          {isAuthenticated ? (
            affiliate ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Check className="w-4 h-4" /> You're enrolled in the affiliate program
              </div>
            ) : (
              <Button size="lg" className="glow-primary" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                <Zap className="w-4 h-4 mr-2" /> Join the Affiliate Program
              </Button>
            )
          ) : (
            <Link href="/register">
              <Button size="lg" className="glow-primary">
                Sign Up & Start Earning <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Referral Link Card (for enrolled affiliates) */}
        {isAuthenticated && affiliate && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-12"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">Your Referral Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Referrals", value: affiliate.totalReferrals || 0, icon: Users },
                { label: "Conversions", value: affiliate.conversions || 0, icon: TrendingUp },
                { label: "Total Earned", value: `$${((affiliate.totalEarned || 0) / 100).toFixed(2)}`, icon: DollarSign },
                { label: "Pending Payout", value: `$${((affiliate.pendingPayout || 0) / 100).toFixed(2)}`, icon: BarChart2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <Icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background">
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground font-mono truncate">{referralLink}</span>
                </div>
                <Button variant="outline" className="shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: "$2.1M+", label: "Paid to Affiliates" },
            { value: "12,000+", label: "Active Affiliates" },
            { value: "30%", label: "Max Commission" },
            { value: "Monthly", label: "Payout Frequency" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-display font-bold text-primary mb-1">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <Icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Commission Tiers */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-3">Commission Tiers</h2>
          <p className="text-muted-foreground text-center mb-10">Earn more as you grow. Tiers upgrade automatically.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border ${tier.badge ? "border-primary/40" : "border-border"} bg-card p-6`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {tier.badge}
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{tier.referrals} conversions / month</p>
                <div className="text-3xl font-display font-bold text-foreground mb-5">{tier.commission}</div>
                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              { q: "When do I get paid?", a: "Payouts are processed on the 1st of each month for the previous month's earnings, as long as you've reached the $25 minimum." },
              { q: "How long do cookies last?", a: "Our tracking cookie lasts 90 days — so you get credit for purchases made up to 3 months after someone clicks your link." },
              { q: "Can I promote on social media?", a: "Absolutely! Share your link on Twitter, YouTube, LinkedIn, blogs, newsletters — anywhere your audience is." },
              { q: "Is there a cap on earnings?", a: "No cap whatsoever. The more you refer, the more you earn. Top affiliates make $5,000+ per month." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-border p-10 text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join the PromptVault affiliate program today. Free to join, instant approval, start earning immediately.
          </p>
          {isAuthenticated ? (
            !affiliate && (
              <Button size="lg" className="glow-primary" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                Join Now — It's Free
              </Button>
            )
          ) : (
            <Link href="/register">
              <Button size="lg" className="glow-primary">
                Create an Account & Join <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
