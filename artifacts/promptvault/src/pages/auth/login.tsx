import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/use-auth-store";
import { Mail, Lock, AlertCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const params = new URLSearchParams(search);
  const nextUrl = params.get("next") || params.get("returnUrl") || "";
  const sessionExpired = params.get("expired") === "1";

  if (isAuthenticated && !sessionExpired) {
    setLocation(nextUrl ? decodeURIComponent(nextUrl) : "/dashboard");
    return null;
  }

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.user, data.accessToken, (data as any).refreshToken);
        qc.invalidateQueries({ queryKey: ["purchasedPacks"] });
        qc.invalidateQueries({ queryKey: ["me"] });
        const isAdmin = data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN";
        const redirect = nextUrl || (isAdmin ? "/admin" : "/dashboard");
        // Use replace to remove /login from browser history so back button doesn't loop
        setLocation(decodeURIComponent(redirect), { replace: true });
      },
      onError: (err: any) => {
        const msg = (err.data as any)?.error || err.message || "Invalid email or password. Please try again.";
        setLoginError(msg);
      },
    }
  });

  const onSubmit = (data: LoginForm) => {
    setLoginError(null);
    login({ data });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 hidden lg:block w-1/2">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Auth Background"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
      </div>

      <div className="w-full lg:w-1/2 ml-auto flex items-center justify-center p-8 z-10 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <Link href="/" className="font-display font-bold text-2xl text-white inline-block mb-8">
              Prompt<span className="text-secondary">Vault</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Log in to your account to access your prompts.</p>
          </div>

          {sessionExpired && (
            <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-600">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">Your session has expired. Please log in again.</p>
            </div>
          )}

          {loginError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                {...register("email")}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                {...register("password")}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                error={errors.password?.message}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base mt-2" isLoading={isPending}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8 text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
