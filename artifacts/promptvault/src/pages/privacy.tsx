import { PublicLayout } from "@/components/layout/public-layout";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const LAST_UPDATED = "March 13, 2026";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-10 leading-relaxed">
            At PromptVault, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. If you disagree with its terms, please discontinue use of the site.
          </p>

          <div className="space-y-10 prose-like">

            <Section title="1. Information We Collect">
              <p>We collect information you provide directly to us, including:</p>
              <ul>
                <li><strong>Account information:</strong> name, email address, and password when you register.</li>
                <li><strong>Payment information:</strong> billing details processed securely through our payment processor (Stripe). We do not store full card numbers.</li>
                <li><strong>Profile information:</strong> display name, avatar, and bio you choose to add.</li>
                <li><strong>Communication data:</strong> messages or feedback you send to us.</li>
              </ul>
              <p>We also automatically collect certain information when you use the service:</p>
              <ul>
                <li><strong>Log data:</strong> IP address, browser type, operating system, referring URLs, and pages visited.</li>
                <li><strong>Usage data:</strong> features used, purchases made, and interactions with prompt packs.</li>
                <li><strong>Cookies and tracking technologies:</strong> as described in our Cookie Policy section below.</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Create and manage your account and deliver the services you purchase.</li>
                <li>Process transactions and send related information including purchase confirmations and invoices.</li>
                <li>Send transactional emails such as account verification, password resets, and order confirmations.</li>
                <li>Respond to your comments, questions, and customer service requests.</li>
                <li>Send marketing communications (only with your consent, and you may opt out at any time).</li>
                <li>Monitor and analyse usage patterns to improve our platform and user experience.</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </Section>

            <Section title="3. Cookies and Tracking Technologies">
              <p>We use cookies and similar tracking technologies to enhance your experience on PromptVault. Cookies are small data files stored on your device.</p>
              <p>We use the following categories of cookies:</p>
              <ul>
                <li><strong>Strictly Necessary Cookies:</strong> Essential for the site to function (e.g., authentication tokens, session management). These cannot be disabled.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings to personalise your experience.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the site. We use this data to improve performance and content.</li>
                <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements (only with your explicit consent).</li>
              </ul>
              <p>You can control cookie preferences through the consent banner displayed on your first visit, or through your browser settings. Note that disabling certain cookies may affect site functionality.</p>
            </Section>

            <Section title="4. Information Sharing and Disclosure">
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
              <ul>
                <li><strong>Service providers:</strong> We share information with vendors who provide services on our behalf (e.g., Stripe for payment processing, hosting providers). These providers are contractually obligated to protect your data.</li>
                <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or government authority.</li>
                <li><strong>Business transfers:</strong> If we merge, are acquired, or sell assets, your information may be transferred. We will notify you of any such change.</li>
                <li><strong>Protection of rights:</strong> To protect the rights, property, or safety of PromptVault, our users, or others.</li>
              </ul>
            </Section>

            <Section title="5. Data Retention">
              <p>We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain it for legal or contractual obligations.</p>
              <p>Purchase records and transaction history are retained for a minimum of 7 years for tax and accounting purposes.</p>
            </Section>

            <Section title="6. Your Rights">
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
                <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
                <li><strong>Objection:</strong> Object to processing of your data for marketing purposes.</li>
                <li><strong>Withdrawal of consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
              </ul>
              <p>To exercise these rights, contact us at <a href="mailto:privacy@promptvault.com" className="text-primary hover:underline">privacy@promptvault.com</a>. We will respond within 30 days.</p>
            </Section>

            <Section title="7. Security">
              <p>We implement industry-standard security measures to protect your personal information, including:</p>
              <ul>
                <li>TLS/SSL encryption for all data in transit.</li>
                <li>Bcrypt password hashing with high work factors.</li>
                <li>JWT-based authentication with short-lived access tokens.</li>
                <li>Payment data handled exclusively by PCI-DSS compliant processors (Stripe).</li>
                <li>Regular security audits and vulnerability assessments.</li>
              </ul>
              <p>However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>PromptVault is not directed at individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately at <a href="mailto:privacy@promptvault.com" className="text-primary hover:underline">privacy@promptvault.com</a>.</p>
            </Section>

            <Section title="9. Third-Party Links">
              <p>Our platform may contain links to third-party websites. This Privacy Policy does not apply to those sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the service after any changes constitutes your acceptance of the updated policy.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
              <div className="mt-3 p-4 rounded-xl bg-card border border-border text-sm">
                <p className="font-semibold text-foreground">PromptVault</p>
                <p className="text-muted-foreground">Email: <a href="mailto:privacy@promptvault.com" className="text-primary hover:underline">privacy@promptvault.com</a></p>
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
