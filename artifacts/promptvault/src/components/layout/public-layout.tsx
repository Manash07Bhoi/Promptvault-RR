import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { motion, AnimatePresence } from "framer-motion";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-primary-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          className="flex-grow pt-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CookieConsent />
    </div>
  );
}
