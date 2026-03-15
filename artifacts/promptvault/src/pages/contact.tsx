import { PublicLayout } from "@/components/layout/public-layout";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const TOPICS = [
  "General Enquiry",
  "Purchase Support",
  "Technical Issue",
  "Partnership / Collaboration",
  "Other",
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, issue, or just want to say hello? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-2">For all enquiries and support.</p>
              <a href="mailto:support@promptvault.com" className="text-sm text-primary hover:underline font-medium">
                support@promptvault.com
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Partnerships</h3>
              <p className="text-sm text-muted-foreground mb-2">Business and collaboration opportunities.</p>
              <a href="mailto:partners@promptvault.com" className="text-sm text-primary hover:underline font-medium">
                partners@promptvault.com
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We aim to respond to all enquiries within <span className="text-foreground font-medium">24–48 hours</span> on business days.
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-border bg-card p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h2>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll get back to you within 24–48 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground mb-6">Send a Message</h2>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                      <Input
                        name="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email Address <span className="text-destructive">*</span></label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Topic</label>
                    <select
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
                    <textarea
                      name="message"
                      rows={6}
                      placeholder="Tell us how we can help..."
                      value={form.message}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" isLoading={loading}>
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </PublicLayout>
  );
}
