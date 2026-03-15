import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/use-auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile, useUpdatePassword } from "@workspace/api-client-react";
import { User, Lock, AlertCircle, CheckCircle2, Mail, Shield, Bell, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Valid email required"),
  bio: z.string().max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "Password must be 8+ characters"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

const NOTIF_ITEMS = [
  { key: "newPacks", label: "New pack releases", desc: "Get notified when new packs are added in your favorite categories", defaultOn: true },
  { key: "orderUpdates", label: "Order updates", desc: "Receive updates about your orders and downloads", defaultOn: true },
  { key: "promotionalEmails", label: "Promotional emails", desc: "Discounts, coupons, and special offers from PromptVault", defaultOn: false },
  { key: "weeklyDigest", label: "Weekly digest", desc: "A weekly roundup of trending packs and creator news", defaultOn: false },
] as const;

function NotificationPreferences() {
  const accessToken = useAuthStore(s => s.accessToken);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/notifications/preferences`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.preferences) setPrefs(data.preferences);
        else {
          // Initialize from defaults
          const defaults: Record<string, boolean> = {};
          NOTIF_ITEMS.forEach(i => { defaults[i.key] = i.defaultOn; });
          setPrefs(defaults);
        }
      })
      .catch(() => {});
  }, [accessToken]);

  async function savePrefs() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notifications/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" /> Notification Preferences
      </h2>
      <div className="space-y-4">
        {NOTIF_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start justify-between py-4 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={prefs[item.key] ?? item.defaultOn}
                onChange={(e) => setPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 mt-4">
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved!</span>}
        <Button onClick={savePrefs} isLoading={saving}>Save Preferences</Button>
      </div>
    </motion.div>
  );
}

export default function DashboardSettings() {
  const { user, updateUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: (user as any)?.bio || "",
      websiteUrl: (user as any)?.websiteUrl || "",
    }
  });

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile({
    mutation: {
      onSuccess: (data: any) => {
        updateUser(data);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    }
  });

  const { mutate: changePassword, isPending: changingPassword } = useUpdatePassword({
    mutation: {
      onSuccess: () => {
        setPasswordSuccess(true);
        resetPassword();
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    }
  });

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, security, and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-card border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>

          <div className="lg:col-span-3 space-y-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Profile Information
                </h2>

                {profileSuccess && (
                  <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                  </div>
                )}

                <form onSubmit={handleProfile((data) => updateProfile({ data: data as any }))} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {user?.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">{user?.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Display Name</label>
                      <Input {...regProfile("displayName")} icon={<User className="w-4 h-4" />} error={profileErrors.displayName?.message} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Email Address</label>
                      <Input {...regProfile("email")} icon={<Mail className="w-4 h-4" />} type="email" error={profileErrors.email?.message} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
                    <textarea
                      {...regProfile("bio")}
                      placeholder="Tell us a bit about yourself..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Website URL</label>
                    <Input {...regProfile("websiteUrl")} placeholder="https://yoursite.com" error={(profileErrors.websiteUrl as any)?.message} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" isLoading={updatingProfile}>Save Changes</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Change Password
                </h2>

                {passwordSuccess && (
                  <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Password changed successfully!
                  </div>
                )}

                <form onSubmit={handlePassword((data: any) => changePassword({ data }))} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Current Password</label>
                    <Input {...regPassword("currentPassword")} type="password" icon={<Lock className="w-4 h-4" />} error={passwordErrors.currentPassword?.message as string | undefined} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
                    <Input {...regPassword("newPassword")} type="password" icon={<Lock className="w-4 h-4" />} error={passwordErrors.newPassword?.message as string | undefined} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
                    <Input {...regPassword("confirmPassword")} type="password" icon={<Lock className="w-4 h-4" />} error={passwordErrors.confirmPassword?.message as string | undefined} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" isLoading={changingPassword}>Change Password</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && <NotificationPreferences />}

            {/* Danger Zone */}
            {activeSection === "danger" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                <h2 className="text-lg font-bold text-destructive mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Danger Zone
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div>
                      <p className="font-medium text-foreground text-sm">Delete Account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 shrink-0 ml-4">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
