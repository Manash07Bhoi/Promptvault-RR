import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings, Flag, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_FLAGS = [
  { key: "gift_purchases", label: "Gift Purchases", description: "Allow users to purchase packs as gifts", enabled: true },
  { key: "collections", label: "Collections", description: "Allow users to create and share collections", enabled: true },
  { key: "comments", label: "Pack Comments", description: "Allow comments on pack pages", enabled: true },
  { key: "creator_applications", label: "Creator Applications", description: "Allow new creator applications", enabled: true },
  { key: "subscription_plans", label: "Subscription Plans", description: "Show Pro and Teams subscription options", enabled: true },
  { key: "flash_sales", label: "Flash Sales", description: "Show flash sales and promotional prices", enabled: true },
  { key: "direct_messages", label: "Direct Messages", description: "Allow direct messaging between users", enabled: false },
  { key: "ai_recommendations", label: "AI Recommendations", description: "Show AI-powered pack recommendations", enabled: false },
  { key: "team_workspaces", label: "Team Workspaces", description: "Enable team workspace features", enabled: false },
  { key: "affiliate_program", label: "Affiliate Program", description: "Enable the affiliate/partner program", enabled: false },
];

export default function AdminConfigPage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  const toggleFlag = (key: string) => {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const saveFlags = () => {
    toast({ title: "Feature flags saved!", description: "Changes will take effect immediately." });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configuration</h1>
            <p className="text-muted-foreground text-sm">Feature flags and platform settings</p>
          </div>
          <Button className="gap-2" onClick={saveFlags}><Save className="w-4 h-4" /> Save Changes</Button>
        </div>

        {/* Feature Flags */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Flag className="w-4 h-4 text-primary" /> Feature Flags</h3>
          {flags.map(flag => (
            <div key={flag.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <p className="font-medium text-foreground text-sm">{flag.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                <code className="text-xs text-muted-foreground font-mono">{flag.key}</code>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={() => toggleFlag(flag.key)}
              />
            </div>
          ))}
        </div>

        {/* Platform Settings */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Platform Settings</h3>
          {[
            { label: "Platform Commission (%)", defaultValue: "30", hint: "% taken from each sale" },
            { label: "Max Prompts Per Pack", defaultValue: "100", hint: "Maximum prompts allowed per pack" },
            { label: "Min Pack Price (cents)", defaultValue: "99", hint: "Minimum price for paid packs" },
            { label: "Free Trial Duration (days)", defaultValue: "14", hint: "Days for free trial of Pro plan" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
              </div>
              <Input className="w-24 text-right font-mono" defaultValue={s.defaultValue} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
