import { PublicLayout } from "@/components/layout/public-layout";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Code2, Copy, Check, ChevronRight, Zap, Shield, BookOpen, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { id: "intro", label: "Introduction" },
  { id: "auth", label: "Authentication" },
  { id: "packs", label: "Packs" },
  { id: "categories", label: "Categories" },
  { id: "search", label: "Search" },
  { id: "users", label: "Users" },
  { id: "errors", label: "Error Codes" },
  { id: "rate-limits", label: "Rate Limits" },
];

const ENDPOINTS = [
  {
    section: "packs",
    items: [
      { method: "GET", path: "/v1/packs", desc: "List all published packs", params: "?limit=20&offset=0&sort=popular&category=coding" },
      { method: "GET", path: "/v1/packs/:slug", desc: "Get a single pack by slug" },
      { method: "GET", path: "/v1/packs/:id/prompts", desc: "List prompts in a pack (requires purchase)" },
      { method: "POST", path: "/v1/packs/:id/reviews", desc: "Post a review on a pack" },
    ],
  },
  {
    section: "categories",
    items: [
      { method: "GET", path: "/v1/categories", desc: "List all categories" },
      { method: "GET", path: "/v1/categories/:slug/packs", desc: "List packs in a category" },
    ],
  },
  {
    section: "search",
    items: [
      { method: "GET", path: "/v1/search", desc: "Full-text search over packs and prompts", params: "?q=marketing+emails&type=packs" },
    ],
  },
  {
    section: "users",
    items: [
      { method: "GET", path: "/v1/users/me", desc: "Get the authenticated user profile" },
      { method: "GET", path: "/v1/users/me/purchases", desc: "List packs purchased by the authenticated user" },
      { method: "GET", path: "/v1/users/:username", desc: "Get a public user profile" },
    ],
  },
];

const ERROR_CODES = [
  { code: 400, name: "Bad Request", desc: "The request body or query params are invalid." },
  { code: 401, name: "Unauthorized", desc: "No API key provided or the key is invalid." },
  { code: 403, name: "Forbidden", desc: "You don't have permission to access this resource." },
  { code: 404, name: "Not Found", desc: "The requested resource does not exist." },
  { code: 429, name: "Rate Limited", desc: "You've exceeded the rate limit. Retry after the Retry-After header." },
  { code: 500, name: "Server Error", desc: "An unexpected error occurred. Contact support if it persists." },
];

export default function ApiDocsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("intro");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
    toast({ title: "Copied!" });
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Code2 className="w-3.5 h-3.5" /> API Reference
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-3">PromptVault API</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            The PromptVault REST API gives you programmatic access to our prompt pack marketplace.
            Build integrations, automate workflows, and embed prompts directly in your product.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <Badge variant="outline" className="text-xs py-1 px-3">
              Base URL: <code className="font-mono ml-1">https://api.promptvault.ai/v1</code>
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-xs py-1 px-3">v1 — Stable</Badge>
          </div>
        </motion.div>

        <div className="flex gap-10">
          {/* Sidebar Nav */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-6 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</p>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-all ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">
            {/* Introduction */}
            <section id="intro">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Introduction</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>
                  The PromptVault API lets you browse packs, access purchased prompts, manage users,
                  and more. All requests use standard HTTP methods and return JSON.
                </p>
                <p>To use the API, you need an API key. Generate one from the <Link href="/developer"><span className="text-primary hover:underline">Developer Dashboard</span></Link>.</p>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Globe, title: "RESTful", desc: "Standard HTTP verbs and JSON responses" },
                  { icon: Shield, title: "Secure", desc: "API key authentication over HTTPS" },
                  { icon: Zap, title: "Fast", desc: "Global CDN, <50ms median latency" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-border bg-card">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Authentication */}
            <section id="auth">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Authentication</h2>
              <p className="text-muted-foreground text-sm mb-4">
                All API requests must include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs">Authorization</code> header:
              </p>
              <CodeBlock
                id="auth-example"
                code={`Authorization: Bearer YOUR_API_KEY`}
                copiedSnippet={copiedSnippet}
                onCopy={copySnippet}
              />
              <p className="text-muted-foreground text-sm mt-4">Example curl request:</p>
              <CodeBlock
                id="curl-example"
                code={`curl https://api.promptvault.ai/v1/packs \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                copiedSnippet={copiedSnippet}
                onCopy={copySnippet}
              />
            </section>

            {/* Endpoints */}
            {ENDPOINTS.map(({ section, items }) => (
              <section key={section} id={section}>
                <h2 className="text-2xl font-display font-bold text-foreground mb-6 capitalize">{section}</h2>
                <div className="space-y-4">
                  {items.map((ep) => (
                    <div key={ep.path} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="flex items-center gap-3 p-4 border-b border-border/50">
                        <Badge
                          className={`text-xs font-mono shrink-0 ${
                            ep.method === "GET" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 border" :
                            ep.method === "POST" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20 border"
                          }`}
                        >
                          {ep.method}
                        </Badge>
                        <code className="text-sm font-mono text-foreground">{ep.path}</code>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">{ep.desc}</p>
                        {ep.params && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1.5">Query Parameters:</p>
                            <code className="text-xs bg-muted/50 px-2 py-1 rounded text-primary">{ep.params}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Error Codes */}
            <section id="errors">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Error Codes</h2>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Code</th>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Name</th>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {ERROR_CODES.map(({ code, name, desc }) => (
                      <tr key={code} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <code className={`text-xs font-mono font-bold ${code >= 500 ? "text-destructive" : code >= 400 ? "text-amber-500" : "text-emerald-500"}`}>
                            {code}
                          </code>
                        </td>
                        <td className="p-4 font-medium text-foreground text-xs">{name}</td>
                        <td className="p-4 text-muted-foreground text-xs">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Rate Limits</h2>
              <p className="text-muted-foreground text-sm mb-5">
                API requests are rate limited per API key. Limits vary by plan:
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Plan</th>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Requests/Hour</th>
                      <th className="text-left p-4 font-semibold text-foreground text-xs">Requests/Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { plan: "Free", hour: "100", day: "1,000" },
                      { plan: "Pro", hour: "1,000", day: "10,000" },
                      { plan: "Business", hour: "5,000", day: "100,000" },
                      { plan: "Enterprise", hour: "Unlimited", day: "Unlimited" },
                    ].map(({ plan, hour, day }) => (
                      <tr key={plan} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium text-foreground text-xs">{plan}</td>
                        <td className="p-4 text-muted-foreground text-xs font-mono">{hour}</td>
                        <td className="p-4 text-muted-foreground text-xs font-mono">{day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                When rate limited, you'll receive a <code className="bg-muted px-1 py-0.5 rounded">429</code> response
                with a <code className="bg-muted px-1 py-0.5 rounded">Retry-After</code> header.
              </p>
            </section>

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-border p-8 text-center">
              <BookOpen className="w-7 h-7 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Ready to Build?</h3>
              <p className="text-muted-foreground text-sm mb-5">Generate your API key and start integrating PromptVault in minutes.</p>
              <Link href="/developer">
                <Button className="glow-primary">
                  Get Your API Key <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function CodeBlock({ id, code, copiedSnippet, onCopy }: {
  id: string;
  code: string;
  copiedSnippet: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="relative group rounded-xl bg-[#0d1117] border border-border overflow-hidden">
      <button
        onClick={() => onCopy(id, code)}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copiedSnippet === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      <pre className="p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto">{code}</pre>
    </div>
  );
}
