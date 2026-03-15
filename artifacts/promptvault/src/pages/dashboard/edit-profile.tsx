import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CheckCircle, XCircle, Globe, Twitter, Linkedin, Github, Youtube, X, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileVisibility = "public" | "private" | "followers_only";

export default function EditProfilePage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    username: "", displayName: "", bio: "", location: "", websiteUrl: "",
    twitterHandle: "", linkedinUrl: "", githubHandle: "", youtubeUrl: "",
    profileVisibility: "public" as ProfileVisibility,
    specialties: [] as string[],
  });
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(null);

  // Load current profile
  const { data: completion } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile/completion", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: (user as any).username || "",
        displayName: user.displayName || "",
        bio: (user as any).bio || "",
        location: (user as any).location || "",
        websiteUrl: (user as any).websiteUrl || "",
        twitterHandle: (user as any).twitterHandle || "",
        linkedinUrl: (user as any).linkedinUrl || "",
        githubHandle: (user as any).githubHandle || "",
        youtubeUrl: (user as any).youtubeUrl || "",
        profileVisibility: (user as any).profileVisibility || "public",
        specialties: (user as any).specialties || [],
      });
    }
  }, [user]);

  const checkUsername = (value: string) => {
    if (usernameTimer) clearTimeout(usernameTimer);
    if (!value || value.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/username/check?username=${value}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 400);
    setUsernameTimer(timer);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/profile/extended", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      qc.invalidateQueries({ queryKey: ["profile-completion"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSpecialty = () => {
    const val = specialtyInput.trim();
    if (val && form.specialties.length < 10 && !form.specialties.includes(val)) {
      setForm(f => ({ ...f, specialties: [...f.specialties, val] }));
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (s: string) => setForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Edit Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">Update your public profile information</p>
          </div>
          {form.username && (
            <Link href={`/u/${form.username}`}>
              <Button variant="outline" size="sm">Preview Profile</Button>
            </Link>
          )}
        </div>

        {/* Profile Completion */}
        {completion && completion.percentage < 100 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Profile Strength</h3>
              <span className="text-2xl font-bold text-primary">{completion.percentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {completion.checks.filter((c: any) => !c.done).map((c: any) => (
                <li key={c.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs font-mono font-bold text-primary">+{c.points}pts</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="username"
                className="pl-8 pr-10"
                placeholder="yourname"
                value={form.username}
                onChange={e => {
                  setForm(f => ({ ...f, username: e.target.value }));
                  checkUsername(e.target.value);
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "available" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-red-500" />}
                {usernameStatus === "checking" && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">3–30 characters, letters, numbers, and underscores only. Can only be changed once per 30 days.</p>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" className="mt-1.5" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} maxLength={100} />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              className="mt-1.5 resize-none"
              rows={4}
              placeholder="Tell the community about yourself..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/500</p>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" className="mt-1.5" placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} maxLength={100} />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website URL</Label>
            <div className="relative mt-1.5">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="website" className="pl-9" placeholder="https://yoursite.com" value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label>Social Links</Label>
            {[
              { icon: Twitter, key: "twitterHandle", placeholder: "twitter_username", prefix: "@" },
              { icon: Linkedin, key: "linkedinUrl", placeholder: "linkedin.com/in/...", prefix: "" },
              { icon: Github, key: "githubHandle", placeholder: "github_username", prefix: "@" },
              { icon: Youtube, key: "youtubeUrl", placeholder: "youtube.com/...", prefix: "" },
            ].map(({ icon: Icon, key, placeholder, prefix }) => (
              <div key={key} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
                <Input
                  className={cn("pl-9", prefix && "pl-12")}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {/* Specialties */}
          <div>
            <Label>Specialties ({form.specialties.length}/10)</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="e.g. ChatGPT, Marketing..."
                value={specialtyInput}
                onChange={e => setSpecialtyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSpecialty} disabled={form.specialties.length >= 10}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.specialties.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {form.specialties.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button onClick={() => removeSpecialty(s)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Profile Visibility */}
          <div>
            <Label>Profile Visibility</Label>
            <div className="grid grid-cols-3 gap-3 mt-1.5">
              {(["public", "private", "followers_only"] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, profileVisibility: v }))}
                  className={cn(
                    "rounded-lg border p-3 text-sm font-medium transition-all",
                    form.profileVisibility === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {v === "followers_only" ? "Followers Only" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border -mx-4 px-4 py-4 flex gap-3">
          <Button
            className="flex-1"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || usernameStatus === "taken"}
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          {form.username && (
            <Link href={`/u/${form.username}`}>
              <Button variant="outline">View Profile</Button>
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
