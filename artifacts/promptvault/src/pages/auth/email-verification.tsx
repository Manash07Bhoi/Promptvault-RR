import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useVerifyEmail } from "@workspace/api-client-react";
import { useAuthStore } from "@/store/use-auth-store";
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const RESEND_COOLDOWN = 60;

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const { accessToken } = useAuthStore();

  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const { mutate: verify, isPending, isSuccess, isError, error } = useVerifyEmail({
    mutation: {
      onSuccess: () => {
        setTimeout(() => {
          setLocation("/dashboard");
        }, 3000);
      }
    }
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      verify({ data: { token: urlToken } });
    }
  }, [verify]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to resend");
      setResendStatus("sent");
      setResendCountdown(RESEND_COOLDOWN);
    } catch {
      setResendStatus("error");
    }
  }, [resendCountdown, resendStatus, accessToken]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-10 rounded-3xl relative z-10 text-center"
      >
        {!token && (
          <>
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Verification Required</h1>
            <p className="text-muted-foreground mb-8">
              Please check your email for a verification link to access your account.
            </p>

            {resendStatus === "sent" && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm">
                Verification email sent! Check your inbox.
              </div>
            )}
            {resendStatus === "error" && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                Failed to resend. Please try again later.
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleResend}
                disabled={resendCountdown > 0 || resendStatus === "sending"}
              >
                {resendStatus === "sending" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : resendCountdown > 0 ? (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Resend in {resendCountdown}s</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Resend Verification Email</>
                )}
              </Button>
              <Link href="/login">
                <Button className="w-full" variant="ghost">Return to Login</Button>
              </Link>
            </div>
          </>
        )}

        {token && isPending && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Verifying your email</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {token && isSuccess && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold mb-3">Email Verified!</h1>
            <p className="text-muted-foreground mb-8">
              Your email has been successfully verified. Redirecting you to the dashboard...
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </>
        )}

        {token && isError && (
          <>
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">
              {(error?.data as any)?.error || error?.message || "The verification link is invalid or has expired."}
            </p>

            {resendStatus === "sent" && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm">
                New verification email sent! Check your inbox.
              </div>
            )}
            {resendStatus === "error" && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                Failed to resend. Please try again later.
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleResend}
                disabled={resendCountdown > 0 || resendStatus === "sending"}
              >
                {resendStatus === "sending" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : resendCountdown > 0 ? (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Resend in {resendCountdown}s</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Request New Verification Link</>
                )}
              </Button>
              <Link href="/login">
                <Button className="w-full" variant="outline">Return to Login</Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
