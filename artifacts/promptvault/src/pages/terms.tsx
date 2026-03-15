import { PublicLayout } from "@/components/layout/public-layout";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const LAST_UPDATED = "March 13, 2026";

export default function TermsOfService() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-10 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of PromptVault ("we," "our," or "us"). By accessing or using our services, you agree to be bound by these Terms. If you do not agree, please do not use the service.
          </p>

          <div className="space-y-10">

            <Section title="1. Acceptance of Terms">
              <p>By creating an account or making a purchase on PromptVault, you confirm that you are at least 16 years old, have the legal capacity to enter into this agreement, and accept these Terms in full. If you are using the service on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.</p>
            </Section>

            <Section title="2. Account Registration">
              <ul>
                <li>You must provide accurate, complete, and up-to-date information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must notify us immediately of any unauthorised use of your account.</li>
                <li>We reserve the right to terminate accounts that violate these Terms or that appear to be fraudulent.</li>
                <li>One account per person. Creating multiple accounts to circumvent restrictions is prohibited.</li>
                <li>Temporary, disposable, or alias email addresses are not permitted for registration.</li>
              </ul>
            </Section>

            <Section title="3. Purchases and Payments">
              <p>All purchases on PromptVault are subject to the following terms:</p>
              <ul>
                <li><strong>Pricing:</strong> All prices are displayed in USD and are subject to change. The price you pay is fixed at the time of purchase.</li>
                <li><strong>Payment processing:</strong> Payments are processed securely by Stripe. By making a purchase, you agree to Stripe's Terms of Service.</li>
                <li><strong>Taxes:</strong> You are responsible for any applicable taxes. We may collect and remit taxes where required by law.</li>
                <li><strong>Coupon codes:</strong> Discount coupons are single-use, non-transferable, and subject to expiry dates and minimum purchase requirements as stated.</li>
                <li><strong>Refunds:</strong> All sales are final. Due to the digital nature of our products, we do not offer refunds once access has been granted. If you experience a technical issue preventing access to your purchase, contact us at support@promptvault.com and we will resolve it promptly.</li>
              </ul>
            </Section>

            <Section title="4. License and Intellectual Property">
              <p>Upon purchasing a prompt pack, we grant you a non-exclusive, non-transferable, worldwide licence to use the prompts for your personal and commercial projects, subject to the following restrictions:</p>
              <ul>
                <li>You may use prompts to generate content for yourself or your clients.</li>
                <li>You may not resell, redistribute, or sublicense the raw prompts to third parties.</li>
                <li>You may not use prompts to create a competing prompt marketplace or library.</li>
                <li>You may not claim authorship of the prompts themselves.</li>
                <li>AI-generated outputs produced using our prompts belong to you.</li>
              </ul>
              <p>All content on PromptVault, including prompts, descriptions, designs, and logos, is the intellectual property of PromptVault or its licensors and is protected by copyright law.</p>
            </Section>

            <Section title="5. Prohibited Conduct">
              <p>You agree not to:</p>
              <ul>
                <li>Use the service for any unlawful purpose or in violation of these Terms.</li>
                <li>Attempt to gain unauthorised access to any part of the platform or other users' accounts.</li>
                <li>Upload, transmit, or distribute malicious code, viruses, or harmful content.</li>
                <li>Engage in scraping, crawling, or automated data collection without written permission.</li>
                <li>Attempt to reverse-engineer, decompile, or disassemble any portion of the platform.</li>
                <li>Use the service to generate content that is illegal, defamatory, harassing, or violates third-party rights.</li>
                <li>Misrepresent your identity or create accounts using false information.</li>
                <li>Use disposable or temporary email addresses to circumvent account restrictions.</li>
              </ul>
            </Section>

            <Section title="6. Disclaimer of Warranties">
              <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, PROMPTVAULT DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
              <p>We do not warrant that the service will be uninterrupted, error-free, or that defects will be corrected. AI outputs generated using our prompts may vary and we make no guarantees about specific results.</p>
            </Section>

            <Section title="7. Limitation of Liability">
              <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROMPTVAULT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING LOST PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION.</p>
              <p>Our total liability to you for any claims arising from these Terms or use of the service shall not exceed the amount you paid to us in the 12 months preceding the claim.</p>
            </Section>

            <Section title="8. Indemnification">
              <p>You agree to defend, indemnify, and hold harmless PromptVault and its developer (Roshan) from and against any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the service, your violation of these Terms, or your violation of any third-party rights.</p>
            </Section>

            <Section title="9. Privacy">
              <p>Your use of the service is subject to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which is incorporated by reference into these Terms. By using the service, you consent to the data practices described therein.</p>
            </Section>

            <Section title="10. Modifications to Terms">
              <p>We reserve the right to modify these Terms at any time. We will provide notice of material changes by updating the "Last updated" date and, where appropriate, notifying you by email. Your continued use of the service after such modifications constitutes acceptance of the updated Terms.</p>
            </Section>

            <Section title="11. Termination">
              <p>We may suspend or terminate your account at our discretion if you violate these Terms or engage in conduct that we deem harmful to the platform or other users. Upon termination, your right to use the service immediately ceases. Provisions of these Terms that by their nature should survive termination will continue to apply.</p>
            </Section>

            <Section title="12. Governing Law">
              <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration, except where prohibited by law. You waive any right to participate in class-action lawsuits against PromptVault.</p>
            </Section>

            <Section title="13. Contact">
              <p>For questions about these Terms of Service, please contact us:</p>
              <div className="mt-3 p-4 rounded-xl bg-card border border-border text-sm">
                <p className="font-semibold text-foreground">PromptVault</p>
                <p className="text-muted-foreground">Email: <a href="mailto:legal@promptvault.com" className="text-primary hover:underline">legal@promptvault.com</a></p>
                <p className="text-muted-foreground">Developer: Roshan</p>
              </div>
            </Section>

          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/50">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_strong]:text-foreground [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
