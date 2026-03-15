import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetUserPurchases } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Download, FileText, ExternalLink, Package, Loader2, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/use-auth-store";
import { useState } from "react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function DownloadButton({ slug, title }: { slug: string; title: string }) {
  const { accessToken } = useAuthStore();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`${BASE}/api/packs/${slug}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        toast.error(err.error || "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-promptvault.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded "${title}" successfully!`);
    } catch (e) {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button size="sm" className="gap-1.5" onClick={handleDownload} disabled={downloading}>
      {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
      {downloading ? "Downloading..." : "Download"}
    </Button>
  );
}

export default function DashboardDownloads() {
  const { data, isLoading } = useGetUserPurchases();
  // API returns an array of orders with nested items; flatten to a deduplicated list of packs
  const orders = (data || []) as any[];
  const seenSlugs = new Set<string>();
  const packs = orders
    .flatMap((o: any) => (o.items || []))
    .filter((item: any) => {
      if (!item.packSlug || seenSlugs.has(item.packSlug)) return false;
      seenSlugs.add(item.packSlug);
      return true;
    })
    .map((item: any) => ({
      id: item.packId,
      slug: item.packSlug,
      title: item.titleSnapshot || "Prompt Pack",
      priceCents: item.priceCents,
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">My Downloads</h1>
          <p className="text-muted-foreground">All prompt packs you've purchased, ready to download as professionally branded PDF documents</p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-0.5">Secure PDF Downloads</p>
            <p className="text-muted-foreground">Downloads are authenticated and protected. Each file is a professionally branded PDF with a cover page, table of contents, usage guide, and all prompts — ready for professional use.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border">
            <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold mb-2">No downloads yet</h3>
            <p className="text-muted-foreground mb-6">Purchase a prompt pack to get instant access and download your prompts as a beautifully formatted document.</p>
            <Link href="/explore"><Button className="gap-2"><Sparkles className="w-4 h-4" /> Browse Packs</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {packs.map((pack: any, i: number) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-5 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-foreground mb-1 line-clamp-1">{pack.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium">{formatPrice(pack.priceCents)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/packs/${pack.slug}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Button>
                  </Link>
                  <DownloadButton slug={pack.slug} title={pack.title} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {packs.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-4">
            <Lock className="w-3 h-3 inline mr-1" />
            Downloads are protected and authenticated. Files are watermarked with PromptVault branding.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
