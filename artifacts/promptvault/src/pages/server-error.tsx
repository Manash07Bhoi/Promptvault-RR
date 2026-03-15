import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ServerCrash, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function ServerError() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-32 h-32 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <ServerCrash className="w-16 h-16" />
            <div className="absolute -bottom-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md transform rotate-12">
              500
            </div>
          </div>
          
          <h1 className="text-5xl font-display font-bold mb-4">Server Error</h1>
          
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Something went wrong on our end. Our team has been notified and is working to fix the issue.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto min-w-[160px]"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full min-w-[160px]">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
