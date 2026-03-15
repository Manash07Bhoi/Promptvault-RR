import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminListUsers, useAdminUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Users, Shield, User as UserIcon, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@workspace/api-client-react";

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ADMIN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BUYER: "bg-muted text-muted-foreground border-border",
};

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SUSPENDED: "bg-red-500/20 text-red-400 border-red-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETED: "bg-muted text-muted-foreground border-border",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data, isLoading, refetch } = useAdminListUsers({ search: search || undefined });
  const { mutateAsync: updateUser, isPending } = useAdminUpdateUser();

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateUser({ id: userId, data: { role: role as any } });
      toast.success("Role updated");
      refetch();
    } catch { toast.error("Failed to update role"); }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateUser({ id: user.id, data: { status: newStatus as any } });
      toast.success(`User ${newStatus === "ACTIVE" ? "restored" : "suspended"}`);
      refetch();
      setSelectedUser(null);
    } catch { toast.error("Failed to update status"); }
  };

  const users = data?.users || (data as any) || [];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Users</h1>
            <p className="text-sm text-muted-foreground">Manage platform users and permissions</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{Array.isArray(users) ? users.length : 0} total users</span>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
              <div className="space-y-3 px-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : !Array.isArray(users) || users.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {users.map((user: User, i: number) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0">
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${roleBadge[user.role] || roleBadge.BUYER}`}>{user.role}</Badge>
                      <Badge className={`text-xs ${statusBadge[user.status] || statusBadge.PENDING}`}>{user.status}</Badge>
                      <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(user.createdAt)}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>View</Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Sheet */}
        <Sheet open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
          <SheetContent className="bg-card border-border w-96">
            <SheetHeader>
              <SheetTitle>User Detail</SheetTitle>
            </SheetHeader>
            {selectedUser && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedUser.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={statusBadge[selectedUser.status]}>{selectedUser.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Role</span>
                    <Badge className={roleBadge[selectedUser.role]}>{selectedUser.role}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email Verified</span>
                    <span>{selectedUser.emailVerifiedAt ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Change Role</p>
                  <Select defaultValue={selectedUser.role} onValueChange={(v) => handleRoleChange(selectedUser.id, v)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUYER">Buyer</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className={selectedUser.status === "ACTIVE" ? "border-red-500/30 text-red-400 hover:bg-red-500/10 w-full" : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 w-full"}
                  onClick={() => handleStatusToggle(selectedUser)}
                  disabled={isPending}
                >
                  {selectedUser.status === "ACTIVE" ? (
                    <><AlertCircle className="w-4 h-4 mr-2" />Suspend User</>
                  ) : (
                    <><UserIcon className="w-4 h-4 mr-2" />Restore User</>
                  )}
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </motion.div>
    </AdminLayout>
  );
}
