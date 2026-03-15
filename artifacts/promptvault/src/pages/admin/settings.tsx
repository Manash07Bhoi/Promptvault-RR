import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Settings, Cpu, Mail, Flag, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateAdminSettings();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({ data: form });
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
  };

  const featureFlags = [
    { key: "free_tier_enabled", label: "Free Tier Packs", description: "Allow users to download free packs without payment" },
    { key: "reviews_enabled", label: "Reviews & Ratings", description: "Allow users to leave reviews on packs" },
    { key: "social_share_enabled", label: "Social Sharing", description: "Show share buttons on pack detail pages" },
    { key: "creator_hub_enabled", label: "Creator Hub", description: "Allow creators to submit packs for review" },
    { key: "ai_generation_enabled", label: "AI Auto-Generation", description: "Enable automatic prompt generation via AI" },
  ];

  const aiModels = ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-5-sonnet", "claude-3-haiku"];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">System Settings</h1>
            <p className="text-sm text-muted-foreground">Configure platform behavior and integrations</p>
          </div>
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            <Settings className="w-4 h-4" />
            {isPending ? "Saving..." : "Save All"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="ai">
            <TabsList className="mb-6">
              <TabsTrigger value="ai" className="gap-2"><Cpu className="w-4 h-4" />AI Config</TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2"><Calendar className="w-4 h-4" />Schedule</TabsTrigger>
              <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4" />Email</TabsTrigger>
              <TabsTrigger value="flags" className="gap-2"><Flag className="w-4 h-4" />Feature Flags</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" />AI Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Default AI Model</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={form.defaultModel || "gpt-4o"}
                        onChange={(e) => setForm((p: any) => ({ ...p, defaultModel: e.target.value }))}
                      >
                        {aiModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">OpenAI API Key</label>
                      <div className="flex gap-2">
                        <Input type="password" value={form.openaiApiKey || "••••••••••••••••"} onChange={(e) => setForm((p: any) => ({ ...p, openaiApiKey: e.target.value }))} placeholder="sk-..." className="bg-background flex-1" />
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />Active
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Max Prompts per Pack</label>
                      <Input type="number" value={form.maxPromptsPerPack || 50} onChange={(e) => setForm((p: any) => ({ ...p, maxPromptsPerPack: Number(e.target.value) }))} className="bg-background w-32" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Generation Temperature</label>
                      <Input type="number" step="0.1" min="0" max="2" value={form.generationTemperature || 0.7} onChange={(e) => setForm((p: any) => ({ ...p, generationTemperature: Number(e.target.value) }))} className="bg-background w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Automation Schedule</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: "autoGenEnabled", label: "Auto-generation Jobs", description: "Automatically generate new prompt packs on schedule" },
                    { key: "autoPublishEnabled", label: "Auto-publish Approved Packs", description: "Publish packs immediately after admin approval" },
                    { key: "cleanupEnabled", label: "File Cleanup", description: "Remove orphaned generated files older than 7 days" },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                        <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-medium text-sm">Email service connected</p>
                      <p className="text-xs text-muted-foreground">Using SMTP configuration</p>
                    </div>
                  </div>
                  <div><label className="text-sm font-medium mb-2 block text-muted-foreground">From Name</label><Input value={form.emailFromName || "PromptVault"} onChange={(e) => setForm((p: any) => ({ ...p, emailFromName: e.target.value }))} className="bg-background" /></div>
                  <div><label className="text-sm font-medium mb-2 block text-muted-foreground">From Email</label><Input value={form.emailFromAddress || "noreply@promptvault.ai"} onChange={(e) => setForm((p: any) => ({ ...p, emailFromAddress: e.target.value }))} className="bg-background" /></div>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />Send Test Email
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flags" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="flex items-center gap-2"><Flag className="w-4 h-4 text-primary" />Feature Flags</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {featureFlags.map(({ key, label, description }) => (
                    <div key={key} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                        <input type="checkbox" checked={form[key] !== false} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </AdminLayout>
  );
}
