import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Sparkles, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  return (
    <PublicLayout>
      <SEO
        canonical="/pricing"
        title="Pricing & Plans"
        description="Choose the right PromptVault plan for you. Access premium AI prompt packs with flexible pricing and subscription options."
        keywords="AI prompts pricing, prompt subscription, PromptVault plans"
      />
      <div className="container mx-auto px-4 py-16">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Simple, transparent pricing</h1>
            <p className="text-xl text-muted-foreground">
              Whether you're a casual creator or a prompt engineering agency, we have a plan for you.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Explorer</h3>
              <p className="text-muted-foreground">Perfect for getting started.</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground">/ forever</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Access to free prompt packs</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Basic search and filtering</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Community support</span></li>
              <li className="flex gap-3 text-muted-foreground"><X className="w-5 h-5 shrink-0" /> <span>Sell your own packs</span></li>
              <li className="flex gap-3 text-muted-foreground"><X className="w-5 h-5 shrink-0" /> <span>API access</span></li>
            </ul>
            <Button variant="outline" className="w-full h-12 text-base rounded-xl">Get Started</Button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-8 flex flex-col relative overflow-hidden bg-card border border-primary/50 shadow-2xl shadow-primary/10 transform md:-translate-y-4"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-3xl pointer-events-none" />
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            
            <div className="mb-6 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold">Pro Creator</h3>
                <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>
              </div>
              <p className="text-muted-foreground">For serious prompt engineers.</p>
            </div>
            <div className="mb-6 relative z-10">
              <span className="text-5xl font-bold text-foreground">$19</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow relative z-10">
              <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Sell unlimited prompt packs</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /> <span>0% marketplace fee</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Premium seller badge</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Advanced analytics</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Priority support</span></li>
            </ul>
            <Button className="w-full h-12 text-base rounded-xl relative z-10">Upgrade to Pro</Button>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-muted-foreground">For teams and businesses.</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> <span>Everything in Pro</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> <span>API Access</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> <span>Dedicated account manager</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> <span>Custom integrations</span></li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-secondary shrink-0" /> <span>Team management</span></li>
            </ul>
            <Button variant="outline" className="w-full h-12 text-base rounded-xl">Contact Sales</Button>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <div className="max-w-5xl mx-auto mb-24 hidden md:block">
          <h2 className="text-3xl font-display font-bold text-center mb-10">Compare Features</h2>
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-6 font-medium text-muted-foreground w-2/5">Features</th>
                  <th className="p-6 font-bold text-center">Explorer</th>
                  <th className="p-6 font-bold text-center text-primary">Pro Creator</th>
                  <th className="p-6 font-bold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-6 font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-muted-foreground"/> Buy Packs</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-emerald-400" /></td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-secondary" /></td>
                </tr>
                <tr>
                  <td className="p-6 font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-muted-foreground"/> Sell Packs</td>
                  <td className="p-6 text-center text-muted-foreground">-</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-secondary" /></td>
                </tr>
                <tr>
                  <td className="p-6 font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground"/> Marketplace Fee</td>
                  <td className="p-6 text-center text-muted-foreground">N/A</td>
                  <td className="p-6 text-center font-bold text-primary">0%</td>
                  <td className="p-6 text-center font-bold text-secondary">Custom</td>
                </tr>
                <tr>
                  <td className="p-6 font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-muted-foreground"/> Analytics</td>
                  <td className="p-6 text-center text-muted-foreground">-</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-secondary" /></td>
                </tr>
                <tr>
                  <td className="p-6 font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-muted-foreground"/> API Access</td>
                  <td className="p-6 text-center text-muted-foreground">-</td>
                  <td className="p-6 text-center text-muted-foreground">-</td>
                  <td className="p-6 text-center"><Check className="w-5 h-5 mx-auto text-secondary" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-10">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="bg-card px-6 rounded-2xl mb-4 border border-border">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">Do I need a Pro plan to buy prompts?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                No, you can buy and download prompts on the free Explorer plan. The Pro plan is primarily designed for creators who want to sell their own prompt packs and access advanced analytics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-card px-6 rounded-2xl mb-4 border border-border">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">How do payouts work for creators?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                We use Stripe Connect for all payouts. Earnings are automatically transferred to your connected bank account on a weekly basis. Pro creators keep 100% of their earnings (excluding standard Stripe processing fees).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-card px-6 rounded-2xl mb-4 border border-border">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">Can I cancel my Pro subscription at any time?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Yes, you can cancel your subscription at any time from your account settings. Your Pro benefits will continue until the end of your current billing cycle.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-card px-6 rounded-2xl mb-4 border border-border">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">What kind of AI tools are supported?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                Our marketplace supports prompts for all major AI models, including ChatGPT, Claude, Midjourney, DALL-E 3, Stable Diffusion, and Gemini. You can filter and categorize packs based on the target tool.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </PublicLayout>
  );
}
