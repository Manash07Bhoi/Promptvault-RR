import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useSearch } from "wouter";
import { CheckCircle2, Download, Package, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");
  const qc = useQueryClient();

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["purchasedPacks"] });
    qc.invalidateQueries({ queryKey: ["userPurchases"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  }, [qc]);

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
                Payment Successful!
              </h1>
              <p className="text-xl text-muted-foreground mb-3">Your prompts are ready to use right now.</p>
              {orderId && <Badge variant="outline" className="text-sm mb-8">Order #{orderId}</Badge>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 text-left"
            >
              <h2 className="font-bold text-lg text-foreground mb-5 text-center">What happens next</h2>
              <div className="space-y-5">
                {[
                  { icon: CheckCircle2, color: "text-emerald-400", title: "Instant Access", desc: "All purchased prompts are now unlocked. View them on the pack detail page." },
                  { icon: Download, color: "text-primary", title: "Download PDF", desc: "Get a formatted PDF with all prompts from your dashboard downloads." },
                  { icon: Package, color: "text-secondary", title: "View All Purchases", desc: "Track and access all your prompt packs from your dashboard anytime." },
                ].map(({ icon: Icon, color, title, desc }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{title}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/dashboard/downloads">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Download className="w-5 h-5" /> Go to Downloads
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <Sparkles className="w-5 h-5" /> Browse More Packs
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2">
                  <User className="w-5 h-5" /> My Dashboard
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
