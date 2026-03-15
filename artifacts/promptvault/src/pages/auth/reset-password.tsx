import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPassword } from "@workspace/api-client-react";
import { Lock, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const password = watch("password") || "";

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthColor = () => {
    if (password.length === 0) return "bg-muted";
    if (strength <= 1) return "bg-destructive";
    if (strength === 2) return "bg-amber-400";
    if (strength === 3) return "bg-emerald-400";
    return "bg-primary";
  };

  const { mutate: resetPass, isPending, error } = useResetPassword({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
      }
    }
  });

  const onSubmit = (data: ResetPasswordForm) => {
    if (!token) return;
    resetPass({ 
      data: { 
        token, 
        password: data.password 
      } 
    });
  };

  if (!token && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md glass-panel p-8 rounded-3xl"
        >
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password">
            <Button className="w-full">Request New Link</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl relative z-10"
      >
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful</h1>
            <p className="text-muted-foreground mb-8">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Link href="/login">
              <Button className="w-full h-12">Return to Login</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Create new password</h1>
              <p className="text-muted-foreground">Your new password must be different from previously used passwords.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{(error.data as any)?.error || error.message || "Failed to reset password."}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <Input 
                  type="password"
                  {...register("password")}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••"
                  error={errors.password?.message}
                />
                {password.length > 0 && (
                  <div className="pt-1">
                    <div className="flex gap-1 h-1.5 mb-1">
                      <div className={`flex-1 rounded-full ${password.length > 0 ? getStrengthColor() : "bg-muted"}`} />
                      <div className={`flex-1 rounded-full ${strength >= 2 ? getStrengthColor() : "bg-muted"}`} />
                      <div className={`flex-1 rounded-full ${strength >= 3 ? getStrengthColor() : "bg-muted"}`} />
                      <div className={`flex-1 rounded-full ${strength >= 4 ? getStrengthColor() : "bg-muted"}`} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {strength <= 1 && "Weak"}
                      {strength === 2 && "Fair"}
                      {strength === 3 && "Good"}
                      {strength >= 4 && "Strong"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <Input 
                  type="password"
                  {...register("confirmPassword")}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base mt-4" isLoading={isPending}>
                Reset Password
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
