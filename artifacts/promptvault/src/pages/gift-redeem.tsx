import { PublicLayout } from "@/components/layout/public-layout";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Gift, CheckCircle, Package, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function GiftRedeemPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["gift", token],
    queryFn: async () => {
      const res = await fetch(`/api/gifts/${token}`);
      if (!res.ok) throw new Error("Invalid gift link");
      return res.json();
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/gifts/${token}/redeem`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Gift redeemed!", description: "Check your downloads." });
      navigate("/dashboard/downloads");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Gift Link</h1>
          <p className="text-muted-foreground">This gift link is invalid or has already been redeemed.</p>
          <Link href="/explore"><Button className="mt-6">Browse Packs</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const { gift } = data;

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
            <Gift className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">You've Got a Gift! 🎁</h1>
          <p className="text-muted-foreground mb-6">Someone sent you a PromptVault pack as a gift.</p>

          {gift.senderMessage && (
            <div className="rounded-xl border border-border bg-card p-5 mb-6 text-left">
              <p className="text-sm text-muted-foreground italic">"{gift.senderMessage}"</p>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Sign in or create an account to claim your gift.</p>
              <Link href={`/login?next=/gift/${token}`}>
                <Button className="w-full gap-2"><Lock className="w-4 h-4" /> Sign In to Claim</Button>
              </Link>
              <Link href={`/signup?next=/gift/${token}`}>
                <Button variant="outline" className="w-full">Create Free Account</Button>
              </Link>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => redeemMutation.mutate()}
              disabled={redeemMutation.isPending}
            >
              {redeemMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</> : <><Gift className="w-4 h-4" /> Claim Gift</>}
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Each gift link can only be redeemed once.
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
