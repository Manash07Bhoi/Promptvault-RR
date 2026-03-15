import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/use-auth-store";
import { Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending, error } = useLogin({
    mutation: {
      onSuccess: (data) => {
        const isAdmin = data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN";
        if (!isAdmin) {
          setLocation("/");
          return;
        }
        setAuth(data.user, data.accessToken, (data as any).refreshToken);
        setLocation("/admin");
      },
    },
  });

  const onSubmit = (data: LoginForm) => {
    login({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="glass-panel p-8 rounded-2xl border border-border">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Restricted Access</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Administrative credentials required
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                {(error as any)?.error === "Invalid email or password"
                  ? "Access denied. Invalid credentials."
                  : "Access denied. Please try again."}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                {...register("email")}
                icon={<Mail className="w-4 h-4" />}
                placeholder="admin@example.com"
                error={errors.email?.message}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                {...register("password")}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isPending}>
              Authenticate
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
