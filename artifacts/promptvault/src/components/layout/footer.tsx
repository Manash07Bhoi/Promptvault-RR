import { Link } from "wouter";
import { Sparkles, Twitter, Github, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Prompt<span className="text-secondary">Vault</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              The premium marketplace for high-quality, production-ready AI prompts and templates.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/promptvault" target="_blank" rel="noopener noreferrer" aria-label="Follow PromptVault on Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" aria-hidden="true" /></a>
              <a href="https://github.com/promptvault" target="_blank" rel="noopener noreferrer" aria-label="PromptVault on GitHub" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5" aria-hidden="true" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Marketplace</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/explore" className="hover:text-primary transition-colors">Explore Packs</Link></li>
              <li><Link href="/trending" className="hover:text-primary transition-colors">Trending Now</Link></li>
              <li><Link href="/categories/coding" className="hover:text-primary transition-colors">For Developers</Link></li>
              <li><Link href="/categories/marketing" className="hover:text-primary transition-colors">For Marketers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/creators" className="hover:text-primary transition-colors">Become a Creator</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">Get the latest premium prompts delivered to your inbox.</p>
            {status === "success" ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            ) : (
              <form className="flex gap-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  disabled={status === "loading"}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Subscribe"}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="text-xs text-destructive mt-2">{message}</p>
            )}
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PromptVault. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
