import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type ConsentState = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "promptvault_cookie_consent";

function getStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {}
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const acceptAll = () => {
    const consent: ConsentState = { necessary: true, functional: true, analytics: true, marketing: true };
    saveConsent(consent);
    setVisible(false);
  };

  const rejectOptional = () => {
    const consent: ConsentState = { necessary: true, functional: false, analytics: false, marketing: false };
    saveConsent(consent);
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(prefs);
    setVisible(false);
  };

  const togglePref = (key: keyof Omit<ConsentState, "necessary">) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-foreground text-sm">Cookie Preferences</span>
              </div>
              <button
                onClick={rejectOptional}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1"
                aria-label="Decline optional cookies"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {!showCustomise ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We use cookies to enhance your experience, analyse traffic, and personalise content. You can choose which cookies to allow or accept all to get the best experience.{" "}
                    <Link href="/privacy" className="text-primary hover:underline">Read our Privacy Policy</Link>.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={acceptAll} className="w-full h-10 text-sm">
                      Accept All Cookies
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={rejectOptional} className="flex-1 h-9 text-sm">
                        Reject Optional
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCustomise(true)} className="flex-1 h-9 text-sm gap-1.5">
                        <Settings className="w-3.5 h-3.5" /> Customise
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {([
                      { key: "necessary", label: "Strictly Necessary", desc: "Required for the site to function. Cannot be disabled.", locked: true },
                      { key: "functional", label: "Functional", desc: "Remember your preferences and settings.", locked: false },
                      { key: "analytics", label: "Analytics", desc: "Help us understand how you use the site.", locked: false },
                      { key: "marketing", label: "Marketing", desc: "Used to show you relevant advertisements.", locked: false },
                    ] as const).map(({ key, label, desc, locked }) => (
                      <div key={key} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {locked ? (
                            <div className="w-9 h-5 rounded-full bg-primary flex items-center justify-end px-0.5">
                              <div className="w-4 h-4 rounded-full bg-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => togglePref(key as any)}
                              className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                                prefs[key as keyof ConsentState] ? "bg-primary justify-end" : "bg-muted justify-start"
                              }`}
                              aria-label={`Toggle ${label}`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow" />
                            </button>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">{label}</span>
                            {locked && <span className="text-[10px] text-muted-foreground">(Always on)</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveCustom} className="flex-1 h-9 text-sm gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Save Preferences
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCustomise(false)} className="h-9 text-sm px-3">
                      Back
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
