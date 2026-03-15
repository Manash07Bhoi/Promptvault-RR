import { PublicLayout } from "@/components/layout/public-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Trash2, Package, ArrowRight, Shield, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${accessToken}` } });
      return res.json();
    },
    enabled: !!isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: async (packId: number) => {
      await fetch(`/api/cart/items/${packId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = data?.cart?.items || [];
  const subtotal = data?.cart?.subtotalCents || 0;

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Cart</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your cart.</p>
          <Link href="/login?next=/cart"><Button>Sign In</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/explore">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Your Cart</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="mb-6">Browse our marketplace and add packs you love.</p>
            <Link href="/explore"><Button>Browse Packs</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Items */}
            <div className="md:col-span-2 space-y-3">
              {items.map((item: any, i: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.packThumbnail
                      ? <img src={item.packThumbnail} alt={item.packTitle} className="w-full h-full object-cover" />
                      : <Package className="w-7 h-7 text-muted-foreground/40" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/packs/${item.packSlug}`}>
                      <p className="font-semibold text-foreground truncate hover:text-primary transition-colors">{item.packTitle}</p>
                    </Link>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      {item.packIsFree ? "Free" : formatPrice(item.packSalePriceCents ?? item.packPriceCents)}
                      {item.packSalePriceCents && (
                        <span className="ml-2 text-muted-foreground line-through text-xs font-normal">{formatPrice(item.packPriceCents)}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => removeMutation.mutate(item.packId)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="rounded-xl border border-border bg-card p-6 sticky top-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <Link href="/checkout">
                  <Button className="w-full gap-2 mt-2">
                    Checkout <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
