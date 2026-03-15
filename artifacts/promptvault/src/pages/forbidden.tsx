import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Forbidden() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full text-center glass-panel p-10 rounded-3xl"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping opacity-75" />
            <div className="relative w-full h-full bg-destructive/20 border border-destructive/30 rounded-full flex items-center justify-center text-destructive">
              <Lock className="w-10 h-10" />
            </div>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-foreground mb-3">
            Access Denied
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            You don't have permission to access this page. It may require admin privileges or a different account type.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => window.history.back()} className="h-12 px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
            <Link href="/">
              <Button className="h-12 px-8 w-full sm:w-auto">
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
