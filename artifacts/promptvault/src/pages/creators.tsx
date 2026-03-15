import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Sparkles, Zap, DollarSign, Users, Star, BookOpen, Globe,
  CheckCircle2, ArrowRight, Code2, Megaphone, Brain, Briefcase,
} from "lucide-react";
import { useGetSiteStats } from "@workspace/api-client-react";

const benefits = [
  {
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Earn Revenue",
    desc: "Set your own prices and earn every time someone purchases your prompt pack. No caps, no limits.",
  },
  {
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Global Reach",
    desc: "PromptVault connects your work with thousands of AI professionals and enthusiasts worldwide.",
  },
  {
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "Build Reputation",
    desc: "Verified creator badges, ratings, and reviews help establish you as a thought leader in AI.",
  },
  {
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    title: "Instant Publishing",
    desc: "Our AI automation system structures and packages your prompts into professional, branded documents automatically.",
  },
  {
    icon: Users,
    color: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
    title: "Creator Community",
    desc: "Join a growing network of prompt engineers, AI researchers, and creative professionals.",
  },
  {
    icon: BookOpen,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "Analytics Dashboard",
    desc: "Track your pack's performance, downloads, reviews, and revenue from a powerful creator dashboard.",
  },
];

const categories = [
  { icon: Code2, label: "Coding & Dev", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Megaphone, label: "Marketing", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Brain, label: "Research & Analysis", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: Briefcase, label: "Business & Strategy", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Sparkles, label: "Creative Writing", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: Globe, label: "Education", color: "text-cyan-400", bg: "bg-cyan-500/10" },
];

const steps = [
  { num: "01", title: "Apply to Create", desc: "Submit your creator application with sample prompts. We review all applications within 48 hours." },
  { num: "02", title: "Build Your Pack", desc: "Use our intuitive editor to write, organise, and tag your prompt collection. AI tools assist your workflow." },
  { num: "03", title: "Set Your Price", desc: "Choose a price that reflects your work's value. Offer free teaser prompts to attract buyers." },
  { num: "04", title: "Publish & Earn", desc: "Once approved, your pack goes live instantly. Start earning as the community discovers your work." },
];

export default function CreatorsPage() {
  const { data: statsData } = useGetSiteStats();

  return (
    <PublicLayout>
      <SEO
        canonical="/creators"
        title="Top AI Prompt Creators"
        description="Discover top AI prompt creators and their premium prompt packs. Follow creators to stay updated with new releases."
        keywords="AI prompt creators, top prompt makers, buy AI prompts from creators"
      />
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-secondary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Creator Program
            </Badge>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-foreground mb-6 leading-tight">
              Turn Your AI Expertise<br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Into Income
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Publish your prompt packs on PromptVault and reach thousands of professionals who need precisely crafted AI instructions. Your knowledge has value — let's monetise it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8 text-base">
                  <Sparkles className="w-5 h-5" /> Apply to Become a Creator
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  <BookOpen className="w-5 h-5" /> Browse Existing Packs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: statsData?.totalUsers ?? 0, label: "Active Users" },
              { value: statsData?.totalPacks ?? 0, label: "Prompt Packs" },
              { value: statsData?.totalPrompts ?? 0, label: "Total Prompts" },
              { value: "$0", label: "Fee to Join" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why Create on PromptVault?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to turn your prompt engineering skills into a thriving side income.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border p-6 ${bg}`}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-card/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">What Can You Create?</h2>
            <p className="text-muted-foreground">Prompts for every professional use case</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map(({ icon: Icon, label, color, bg }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-full border ${bg} border-border`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From application to earning revenue in four simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="bg-card border border-border rounded-2xl p-6 h-full">
                  <div className="text-4xl font-extrabold text-primary/20 mb-3 font-mono">{num}</div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-primary/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl" />
            <div className="relative">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ready to Share Your Expertise?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join PromptVault's creator community today. Applications are free and we review within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 px-8">
                    <CheckCircle2 className="w-5 h-5" /> Apply Now — It's Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="gap-2 px-8">
                    Have Questions? Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
