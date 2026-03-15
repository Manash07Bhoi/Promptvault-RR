import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/use-auth-store";
import { Mail, Lock, AlertCircle, User as UserIcon, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const signupSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
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

  const { mutate: doRegister, isPending, error } = useRegister({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.user, data.accessToken, (data as any).refreshToken);
        setLocation("/dashboard");
      }
    }
  });

  const onSubmit = (data: SignupForm) => {
    if (!termsAccepted) return;
    doRegister({ data });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Background Image Layer */}
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
          <div className="mb-8">
            <Link href="/" className="font-display font-bold text-2xl text-white inline-block mb-6">
              Prompt<span className="text-secondary">Vault</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create an account</h1>
            <p className="text-muted-foreground">Join the ultimate dark AI prompt marketplace.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{(error.data as any)?.error || error.message || "Failed to register. Please try again."}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input 
                {...register("displayName")}
                icon={<UserIcon className="w-4 h-4" />}
                placeholder="PromptMaster99"
                error={errors.displayName?.message}
              />
            </div>

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
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input 
                type="password"
                {...register("password")}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                error={errors.password?.message}
              />
              {/* Password strength meter */}
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
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input 
                type="password"
                {...register("confirmPassword")}
                icon={<Lock className="w-4 h-4" />}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base mt-2" 
              isLoading={isPending}
              disabled={!termsAccepted}
            >
              Sign Up
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
