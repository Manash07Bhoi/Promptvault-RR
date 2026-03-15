import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { XCircle, ArrowLeft, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutCancel() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-8"
            >
              <XCircle className="w-12 h-12 text-red-400" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-4xl font-display font-extrabold text-foreground mb-3">Payment Cancelled</h1>
              <p className="text-lg text-muted-foreground mb-8">
                No worries — your cart is saved and no charge was made. You can complete your purchase whenever you're ready.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-border rounded-2xl p-6 mb-8 text-left"
            >
              <h2 className="font-semibold text-foreground mb-3 text-center">What would you like to do?</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <ArrowLeft className="w-4 h-4 text-primary shrink-0" />
                  Go back and try a different payment method
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                  Browse more prompt packs before deciding
                </li>
                <li className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
                  Your free pack wishlist is always available in your dashboard
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/explore">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Sparkles className="w-5 h-5" /> Browse Packs
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <ShoppingCart className="w-5 h-5" /> View Pricing
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back to Home
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
