import { PublicLayout } from "@/components/layout/public-layout";
import { motion } from "framer-motion";
import { Sparkles, Code2, ShieldCheck, Zap, Heart, Globe } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const TIMELINE = [
  { year: "2024", event: "PromptVault founded with a mission to make AI accessible through quality prompts." },
  { year: "2024", event: "Launched the first curated marketplace with 10 hand-crafted prompt packs." },
  { year: "2025", event: "Introduced the AI-powered automation engine for prompt generation and curation." },
  { year: "2025", event: "Expanded to 10+ categories including marketing, coding, design, and more." },
  { year: "2026", event: "Serving thousands of prompt engineers, creators, and professionals worldwide." },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Quality First",
    description: "Every prompt pack is tested and refined to deliver real, measurable results. No filler, no fluff.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Our prompts are engineered for immediate use. Copy, paste, and produce professional outputs right away.",
    color: "from-primary to-violet-600",
  },
  {
    icon: Code2,
    title: "Built for Professionals",
    description: "Designed by practitioners for practitioners — from developers to marketers to content creators.",
    color: "from-secondary to-cyan-500",
  },
  {
    icon: Globe,
    title: "Accessible Worldwide",
    description: "Making advanced AI capabilities accessible to everyone, regardless of technical background.",
    color: "from-amber-500 to-orange-500",
  },
];

export default function About() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            About PromptVault
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            Empowering Creators with<br />
            <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Precision Prompts
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PromptVault is the premium marketplace for production-ready AI prompts, built to help professionals unlock the full potential of generative AI.
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-10 mb-20 text-center"
        >
          <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We believe that the quality of your AI output is only as good as the quality of your input. Our mission is to democratize expert-level prompt engineering by providing battle-tested, high-converting prompt packs that save time and deliver consistent results.
          </p>
        </motion.div>

        {/* Values */}
        <div className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-display font-bold text-center mb-12"
          >
            What We Stand For
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Story / Timeline */}
        <div className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-display font-bold text-center mb-12"
          >
            Our Journey
          </motion.h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex gap-6 pl-2"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-1">
                    {item.year.slice(2)}
                  </div>
                  <div className="pt-1.5">
                    <div className="text-xs font-semibold text-primary mb-1">{item.year}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-display font-bold text-center mb-12">Meet the Developer</h2>
          <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 text-3xl font-display font-bold text-white shadow-xl shadow-primary/30">
                R
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-1">Roshan</h3>
              <p className="text-primary font-medium text-sm mb-4">Founder & Lead Developer</p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Roshan is a full-stack developer and AI enthusiast with a passion for making cutting-edge technology accessible to everyone. He built PromptVault to help creators and professionals harness the true power of AI without spending hours crafting the perfect prompt from scratch.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["React", "Node.js", "TypeScript", "PostgreSQL", "AI/ML", "Prompt Engineering"].map((skill) => (
                  <span key={skill} className="px-3 py-1 text-xs rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center rounded-3xl border border-primary/20 bg-primary/5 p-12"
        >
          <h2 className="text-3xl font-display font-bold mb-4">Ready to supercharge your AI workflow?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Browse hundreds of expertly crafted prompt packs and start creating better AI outputs today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/explore">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" /> Explore Packs
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                Get in Touch
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>
    </PublicLayout>
  );
}
