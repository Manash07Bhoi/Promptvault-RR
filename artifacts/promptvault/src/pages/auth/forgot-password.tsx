import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const MAX_ATTEMPTS = 3;

export default function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const { mutate: forgotPassword, isPending, error } = useForgotPassword({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onSettled: () => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setRateLimited(true);
        }
      },
    }
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    if (rateLimited) return;
    forgotPassword({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl relative z-10"
      >
        <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-8">
              If an account exists with that email address, we've sent password reset instructions.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => { setIsSuccess(false); setAttempts(0); setRateLimited(false); }}
            >
              Try another email
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset password</h1>
              <p className="text-muted-foreground">Enter your email and we'll send you instructions to reset your password.</p>
            </div>

            {rateLimited && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-600">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Too many attempts. Please wait a few minutes before trying again.</p>
              </div>
            )}

            {!rateLimited && error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{(error.data as any)?.error || error.message || "Something went wrong."}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email address</label>
                <Input
                  {...register("email")}
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  disabled={rateLimited}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                isLoading={isPending}
                disabled={rateLimited || isPending}
              >
                {rateLimited ? "Too many attempts — please wait" : "Send Instructions"}
              </Button>

              {attempts > 0 && !rateLimited && (
                <p className="text-xs text-center text-muted-foreground">
                  {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} remaining
                </p>
              )}
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
