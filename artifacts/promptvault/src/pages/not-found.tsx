import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-8 border border-destructive/30">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-display font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-10">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/">
          <Button size="lg">Return to Home</Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
