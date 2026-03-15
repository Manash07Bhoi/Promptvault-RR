import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Crown, Mail, Plus, Settings } from "lucide-react";
import { Link } from "wouter";

const MOCK_MEMBERS = [
  { name: "Alex Johnson", email: "alex@acme.com", role: "owner", avatarUrl: null },
  { name: "Sarah Chen", email: "sarah@acme.com", role: "member", avatarUrl: null },
];

export default function TeamPage() {
  const { user } = useAuthStore();
  const plan = (user as any)?.subscriptionPlan || "free";

  if (plan !== "teams") {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-cyan-600 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Teams Workspace</h1>
          <p className="text-muted-foreground mb-6">Upgrade to the Teams plan to invite teammates and share your prompt library across your organisation.</p>
          <Link href="/dashboard/subscription">
            <Button className="gap-2">Upgrade to Teams</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Team Workspace</h1>
            <p className="text-muted-foreground text-sm">Manage your team members and shared library</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Invite Member</Button>
        </div>

        {/* Invite */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Invite by Email</h3>
          <div className="flex gap-2">
            <Input placeholder="colleague@company.com" className="flex-1" />
            <Button>Send Invite</Button>
          </div>
        </div>

        {/* Members */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Team Members (2 / 5 seats)</h3>
          <div className="space-y-3">
            {MOCK_MEMBERS.map(m => (
              <div key={m.email} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={m.avatarUrl || ""} />
                    <AvatarFallback>{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.role === "owner" ? (
                    <Badge className="gap-1"><Crown className="w-3 h-3" /> Owner</Badge>
                  ) : (
                    <Badge variant="secondary">Member</Badge>
                  )}
                  {m.role !== "owner" && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Seat Usage</h3>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-cyan-500 rounded-full" style={{ width: "40%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">2 of 5 seats used · 3 seats available</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
