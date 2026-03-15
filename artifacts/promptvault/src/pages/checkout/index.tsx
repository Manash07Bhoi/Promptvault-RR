import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetPackBySlug, useCreateCheckoutSession, useValidateCoupon, useClaimFreePack } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import {
  ShoppingCart, Lock, Tag, ChevronRight, CheckCircle2,
  Sparkles, AlertCircle, X, Loader2, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuthStore();

  const params = new URLSearchParams(window.location.search);
  const packSlug = params.get("pack") || "";

  const { data: pack, isLoading } = useGetPackBySlug(packSlug, { query: { enabled: !!packSlug } as any });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string } | null>(null);
  const [couponError, setCouponError] = useState("");

  const { mutate: validateCoupon, isPending: isValidating } = useValidateCoupon({
    mutation: {
      onSuccess: (data: any) => {
        if (data.valid) {
          setAppliedCoupon({ code: couponInput.toUpperCase(), discount: data.discountValue, type: data.discountType });
          setCouponError("");
        } else {
          setCouponError(data.reason || "Invalid coupon code");
        }
      },
      onError: () => {
        setCouponError("Invalid or expired coupon code");
      },
    },
  });

  const { mutate: checkout, isPending: isCheckingOut } = useCreateCheckoutSession({
    mutation: {
      onSuccess: (res: any) => {
        if (res.sessionUrl) {
          window.location.href = res.sessionUrl;
        } else {
          setLocation(`/checkout/success?orderId=${res.orderId}`, { replace: true });
        }
      },
      onError: () => {
        setCouponError("Checkout failed. Please try again.");
      },
    },
  });

  const { mutate: claimFree, isPending: isClaimingFree } = useClaimFreePack({
    mutation: {
      onSuccess: (res: any) => {
        setLocation(`/checkout/success?orderId=${res.id}`, { replace: true });
      },
    },
  });

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCouponInput(code);
    validateCoupon({ data: { code } });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handlePay = () => {
    if (!isAuthenticated) {
      setLocation(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!pack) return;

    if (pack.isFree || pack.priceCents === 0) {
      claimFree({ data: { packId: pack.id } });
      return;
    }

    checkout({
      data: {
        packIds: [pack.id],
        couponCode: appliedCoupon?.code,
      },
    });
  };

  const subtotal = pack?.priceCents || 0;
  const discountCents = appliedCoupon
    ? appliedCoupon.type === "PERCENT"
      ? Math.floor(subtotal * appliedCoupon.discount / 100)
      : Math.min(appliedCoupon.discount * 100, subtotal)
    : 0;
  const total = Math.max(0, subtotal - discountCents);
  const isFree = !pack || pack.isFree || pack.priceCents === 0;

  if (!packSlug) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h1 className="text-2xl font-bold mb-2">No Item Selected</h1>
          <p className="text-muted-foreground mb-6">Head back to the marketplace to find a prompt pack.</p>
          <Link href="/explore"><Button>Browse Packs</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!pack) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4 opacity-60" />
          <h1 className="text-2xl font-bold mb-2">Pack Not Found</h1>
          <p className="text-muted-foreground mb-6">The pack you're trying to purchase could not be found.</p>
          <Link href="/explore"><Button>Browse Packs</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Back Button */}
        <Link href={`/packs/${pack.slug}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Pack
          </Button>
        </Link>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/packs/${pack.slug}`} className="hover:text-foreground transition-colors">{pack.title}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Checkout</span>
        </nav>

        <h1 className="text-3xl font-display font-bold mb-10">Complete Your Purchase</h1>

        <div className="grid lg:grid-cols-5 gap-10">

          {/* Left: Order Summary */}
          <div className="lg:col-span-3 space-y-6">

            {/* Pack Item */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Order Summary
              </h2>

              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 shrink-0 border border-border">
                  <img
                    src={pack.thumbnailUrl || `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&q=80&fit=crop`}
                    alt={pack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{pack.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{pack.shortDescription}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(pack as any).aiToolTargets?.slice(0, 3).map((tool: string) => (
                      <Badge key={tool} variant="outline" className="text-[10px] py-0">{tool}</Badge>
                    ))}
                    <Badge variant="secondary" className="text-[10px] py-0">{pack.promptCount} prompts</Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {pack.comparePriceCents && (
                    <p className="text-xs text-muted-foreground line-through mb-0.5">{formatPrice(pack.comparePriceCents)}</p>
                  )}
                  <p className="text-lg font-bold text-foreground">{isFree ? "Free" : formatPrice(pack.priceCents)}</p>
                </div>
              </div>
            </motion.div>

            {/* What You Get */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> What's Included
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  `${pack.promptCount} expertly crafted prompts`,
                  "Instant access after purchase",
                  "PDF download available",
                  "Lifetime access — no subscription",
                  "Commercial use licence",
                  "Copy-paste ready format",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Coupon — only for paid packs */}
            {!isFree && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Coupon Code
                </h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{appliedCoupon.code}</span>
                        <span className="text-xs text-emerald-400/80 ml-2">
                          {appliedCoupon.type === "PERCENT"
                            ? `${appliedCoupon.discount}% off`
                            : `$${appliedCoupon.discount} off`}
                        </span>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="font-mono uppercase"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponInput.trim() || isValidating} className="shrink-0">
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Right: Payment Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-6">
              <h2 className="font-bold text-foreground mb-6">Payment Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{isFree ? "Free" : formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && discountCents > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>−{formatPrice(discountCents)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border flex justify-between font-bold text-lg">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{isFree ? "Free" : formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-bold gap-2 mb-4"
                onClick={handlePay}
                isLoading={isCheckingOut || isClaimingFree}
                disabled={isCheckingOut || isClaimingFree}
              >
                {isFree ? (
                  <><Sparkles className="w-5 h-5" /> Get Free Pack</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay {formatPrice(total)} Securely</>
                )}
              </Button>

              {!isFree && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                  <Lock className="w-3 h-3" />
                  <span>Secured by Stripe — 256-bit SSL</span>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                <p>By completing this purchase you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
                <p>Instant access after purchase. Lifetime access to your prompts.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </PublicLayout>
  );
}
