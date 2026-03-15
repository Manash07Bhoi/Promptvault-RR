import { PublicLayout } from "@/components/layout/public-layout";

export default function ContentPolicyPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">Content Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              PromptVault is a marketplace for AI prompt packs. This Content Policy outlines what types of content are permitted and prohibited on our platform. All creators and users must comply with these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. Permitted Content</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">✅ Original AI prompts that provide genuine value to users</li>
              <li className="flex items-start gap-2">✅ Prompts for productivity, creative writing, coding, marketing, education</li>
              <li className="flex items-start gap-2">✅ Instructional prompts that help users get better AI outputs</li>
              <li className="flex items-start gap-2">✅ System prompts and role-based prompts for AI assistants</li>
              <li className="flex items-start gap-2">✅ Prompt templates with customizable variables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. Prohibited Content</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">❌ Content designed to generate illegal, harmful, or dangerous outputs</li>
              <li className="flex items-start gap-2">❌ Prompts intended to bypass AI safety measures (jailbreaks)</li>
              <li className="flex items-start gap-2">❌ Content that violates intellectual property rights</li>
              <li className="flex items-start gap-2">❌ Sexually explicit content involving minors</li>
              <li className="flex items-start gap-2">❌ Hate speech, discriminatory, or harassing content</li>
              <li className="flex items-start gap-2">❌ Spam, duplicate, or low-quality filler content</li>
              <li className="flex items-start gap-2">❌ Content designed to deceive, defraud, or manipulate users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. Quality Standards</h2>
            <p className="text-muted-foreground leading-relaxed">
              All packs submitted to PromptVault undergo review. We expect prompts to be well-written, clearly described, and provide demonstrable value. Packs with fewer than 5 prompts or excessive filler content may be rejected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">5. Reporting Violations</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter content that violates this policy, please use the report function on the relevant page or contact us at <a href="mailto:safety@promptvault.app" className="text-primary underline">safety@promptvault.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">6. Enforcement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Violations may result in content removal, suspension of creator privileges, or permanent account termination depending on severity. We reserve the right to remove any content at our discretion.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
