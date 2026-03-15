import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Code2, Key, Plus, Trash2, Copy, Check, Eye, EyeOff,
  ExternalLink, Zap, Shield, BookOpen, AlertTriangle, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function DeveloperPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/developer/keys", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: usage } = useQuery({
    queryKey: ["api-usage"],
    queryFn: async () => {
      const res = await fetch("/api/developer/usage", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKeyName("");
      toast({ title: "API Key Created", description: "Your new API key is ready. Copy it now — it won't be shown in full again." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create API key.", variant: "destructive" }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/developer/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key Deleted", description: "The API key has been revoked." });
    },
  });

  const handleCopy = (id: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied!", description: "API key copied to clipboard." });
  };

  const maskKey = (key: string) => key.slice(0, 8) + "••••••••••••••••" + key.slice(-4);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" /> Developer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your API keys and monitor API usage.</p>
          </div>
          <Link href="/docs/api">
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> API Documentation <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Usage Stats */}
        {usage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Requests Today", value: (usage.requestsToday || 0).toLocaleString(), icon: Zap },
              { label: "Requests This Month", value: (usage.requestsMonth || 0).toLocaleString(), icon: RefreshCw },
              { label: "Rate Limit", value: `${usage.rateLimit || 1000}/hr`, icon: Shield },
              { label: "Active Keys", value: (apiKeys || []).length, icon: Key },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <Icon className="w-4 h-4 text-primary mb-2" />
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* API Keys */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> API Keys
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Use these keys to authenticate API requests.</p>
            </div>
          </div>

          {/* Create Key Form */}
          <div className="flex gap-3 mb-6 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex-1">
              <Label htmlFor="key-name" className="text-xs mb-1.5 block">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production, My App, Testing..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newKeyName.trim() && createKeyMutation.mutate(newKeyName.trim())}
              />
            </div>
            <div className="self-end">
              <Button
                onClick={() => newKeyName.trim() && createKeyMutation.mutate(newKeyName.trim())}
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Key
              </Button>
            </div>
          </div>

          {/* Keys List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (apiKeys || []).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No API keys yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(apiKeys || []).map((key: any, i: number) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background"
                >
                  <Key className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{key.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {key.lastUsed ? `Last used ${formatDate(key.lastUsed)}` : "Never used"}
                      </Badge>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground">
                      {showKey[key.id] ? key.key : maskKey(key.key || "pk_live_xxxxxxxxxxxxxxxx")}
                    </code>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowKey((prev) => ({ ...prev, [key.id]: !prev[key.id] }))}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      title={showKey[key.id] ? "Hide key" : "Show key"}
                    >
                      {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(key.id, key.key)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      title="Copy key"
                    >
                      {copiedId === key.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this API key? This action cannot be undone.")) deleteKeyMutation.mutate(key.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-500 mb-0.5">Keep your keys secret</p>
            <p className="text-muted-foreground">
              Never share your API keys publicly or commit them to version control. If a key is compromised, delete it immediately and create a new one.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Quick Start
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Make your first API request with curl:</p>
          <pre className="bg-muted/50 rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto">
{`curl https://api.promptvault.ai/v1/packs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          </pre>
          <div className="mt-4">
            <Link href="/docs/api">
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" /> View Full API Reference
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
