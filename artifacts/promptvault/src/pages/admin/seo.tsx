import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Search, Tag } from "lucide-react";

const SEO_PAGES = [
  { path: "/", label: "Homepage" },
  { path: "/explore", label: "Explore Page" },
  { path: "/creators", label: "Creators Directory" },
  { path: "/trending", label: "Trending Page" },
];

export default function AdminSEOPage() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState("/");
  const [seoData, setSeoData] = useState({
    title: "PromptVault — The AI Prompt Pack Marketplace",
    description: "Discover and purchase premium AI prompt packs for ChatGPT, Claude, Midjourney, and more. Curated by expert creators.",
    keywords: "AI prompts, ChatGPT prompts, prompt engineering, Claude prompts, Midjourney prompts",
    ogImage: "",
    canonicalUrl: "",
    noindex: false,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">SEO Management</h1>
            <p className="text-muted-foreground text-sm">Manage metadata and search engine settings per page</p>
          </div>
          <Button className="gap-2" onClick={() => toast({ title: "SEO settings saved!" })}>
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>

        {/* Page Selector */}
        <div className="flex gap-2 flex-wrap">
          {SEO_PAGES.map(p => (
            <button
              key={p.path}
              onClick={() => setSelectedPage(p.path)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${selectedPage === p.path ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* SEO Fields */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> 
            SEO Settings for {SEO_PAGES.find(p => p.path === selectedPage)?.label}
          </h3>

          <div>
            <Label>Page Title</Label>
            <Input className="mt-1.5" value={seoData.title} onChange={e => setSeoData(s => ({ ...s, title: e.target.value }))} maxLength={70} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{seoData.title.length}/70</p>
          </div>

          <div>
            <Label>Meta Description</Label>
            <Textarea className="mt-1.5 resize-none" rows={3} value={seoData.description} onChange={e => setSeoData(s => ({ ...s, description: e.target.value }))} maxLength={160} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{seoData.description.length}/160</p>
          </div>

          <div>
            <Label>Keywords (comma-separated)</Label>
            <Input className="mt-1.5" value={seoData.keywords} onChange={e => setSeoData(s => ({ ...s, keywords: e.target.value }))} />
          </div>

          <div>
            <Label>OG Image URL</Label>
            <Input className="mt-1.5" placeholder="https://..." value={seoData.ogImage} onChange={e => setSeoData(s => ({ ...s, ogImage: e.target.value }))} />
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted/30 p-4 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">SERP Preview</p>
            <p className="text-blue-500 text-base font-medium hover:underline cursor-pointer line-clamp-1">{seoData.title}</p>
            <p className="text-green-600 text-xs">promptvault.app{selectedPage}</p>
            <p className="text-muted-foreground text-sm line-clamp-2">{seoData.description}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
