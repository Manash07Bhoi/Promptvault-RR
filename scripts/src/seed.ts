import { db, usersTable, categoriesTable, packsTable, promptsTable, couponsTable, tagsTable, reviewsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const PACK_DATA = [
  {
    categorySlug: "marketing",
    packs: [
      {
        title: "Ultimate Marketing Copywriting Pack",
        slug: "ultimate-marketing-copywriting-pack",
        description: "Transform your marketing with 50 battle-tested prompts used by top copywriters. These prompts help you craft compelling headlines, convert visitors to customers, and build brand authority. Includes prompts for email campaigns, landing pages, social media ads, and brand storytelling.",
        shortDescription: "50 battle-tested prompts for compelling marketing copy that converts",
        priceCents: 2900,
        comparePriceCents: 4900,
        isFeatured: true,
        isBestseller: true,
        aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
        tags: ["marketing", "copywriting", "email", "ads"],
        prompts: [
          { title: "Irresistible Email Subject Lines", body: 'Generate 15 high-converting email subject lines for [product/offer]. Use these proven formulas: urgency ("Last chance:"), curiosity ("You won\'t believe what..."), personalization ("[Name], your exclusive offer"), numbers ("7 ways to..."), and questions ("Are you making this mistake?"). For each subject line, provide: the formula used, why it works psychologically, a 40-character mobile-optimized version, and an A/B test variant. Target audience: [describe audience]. Product/offer: [describe product or offer].', description: "Create 15 high-converting email subject lines with proven formulas", aiTool: "ChatGPT", useCase: "Email Marketing" },
          { title: "Landing Page Hero Copy", body: "Write a complete landing page hero section for [product name]. Include: 1) A magnetic headline that communicates the #1 benefit in under 10 words, 2) A supporting subheadline that addresses the primary pain point, 3) Three bullet points with the top features/benefits (format: emoji + bold feature + 1-sentence explanation), 4) A primary CTA button text (5 words max), 5) A secondary CTA for hesitant visitors, 6) Trust signals to include below the CTA. Product: [describe product]. Target customer: [describe ideal customer]. Main pain point: [describe the problem you solve].", description: "Complete landing page hero copy that converts visitors", aiTool: "Claude", useCase: "Landing Pages" },
          { title: "Social Media Ad Copy Variants", body: "Create 10 high-converting social media ad copy variants for [product]. For each variant provide: a 3-second scroll-stopping hook (first line), the body copy (under 125 chars for mobile), a specific call-to-action, and the emotional trigger being used (FOMO, aspiration, social proof, etc.). Cover these angles: 1) Problem-agitation-solution, 2) Before/after transformation, 3) Social proof angle, 4) Curiosity/intrigue angle, 5) Direct benefit angle. Platform: [Facebook/Instagram/Twitter/LinkedIn]. Product: [describe product]. Target audience: [describe].", description: "10 social media ad variants with emotional triggers", aiTool: "ChatGPT", useCase: "Social Media Ads" },
          { title: "Brand Storytelling Framework", body: "Create a compelling brand story for [company name] using the StoryBrand framework. Structure it as: 1) The Hero (your customer) - their world before your product, 2) The Problem (external, internal, and philosophical), 3) The Guide (your brand) - why you are qualified to help, 4) The Plan - your 3-step process, 5) The Call to Action, 6) The Success vision, 7) The Failure consequence. Write three versions: a 30-second elevator pitch, a 2-minute website about page, and a 5-minute investor narrative. Company: [company name]. Product/service: [describe]. Core customer: [describe].", description: "Full brand story using the StoryBrand framework", aiTool: "Claude", useCase: "Brand Storytelling" },
          { title: "Objection-Crushing FAQ Section", body: "Create a comprehensive FAQ section for [product] that pre-emptively crushes the top 12 buyer objections. For each FAQ: write the question exactly how a skeptical customer would phrase it, provide a confident, evidence-backed answer, include a micro-story or statistic where relevant, and end each answer with a soft CTA nudge. Categories to cover: 1) Price/value objections, 2) Trust/credibility concerns, 3) Implementation/difficulty worries, 4) Results/timeline expectations, 5) Comparison to alternatives, 6) Risk/guarantee questions. Product: [describe]. Price point: [price]. Main differentiator: [what makes you different].", description: "12-question FAQ section that eliminates buyer hesitation", aiTool: "ChatGPT", useCase: "Sales Pages" },
        ]
      },
      {
        title: "Social Media Content Calendar AI Pack",
        slug: "social-media-content-calendar-ai-pack",
        description: "Generate a full month of social media content in minutes. This pack contains 30 prompts for creating engaging posts across Instagram, LinkedIn, Twitter, and TikTok. Includes templates for thought leadership, product showcases, user-generated content, and viral trend-jacking.",
        shortDescription: "30 prompts for a complete month of social media content",
        priceCents: 1900,
        comparePriceCents: 2900,
        isFeatured: false,
        isBestseller: true,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["social-media", "content", "instagram", "linkedin"],
        prompts: [
          { title: "Viral LinkedIn Post Formula", body: "Write a LinkedIn post about [professional insight/lesson] using this viral format: Start with a bold, polarizing or surprising first line (no more than 12 words) that will make people stop scrolling. Then reveal a counterintuitive insight or personal story in 3-5 short paragraphs (max 3 lines each). Use line breaks liberally. Include one specific, concrete example or data point. End with an engaging question that invites comments. Topic: [describe topic or lesson]. Your professional background: [describe]. Target audience: [describe professionals you want to reach].", description: "Viral LinkedIn post with stop-scroll hook", aiTool: "ChatGPT", useCase: "LinkedIn" },
          { title: "Instagram Carousel Series", body: "Create a 10-slide Instagram carousel about [topic] designed to maximize saves and shares. For each slide provide: the visual concept, the headline text (max 8 words), and the body copy (max 3 lines). Structure: Slide 1: Big promise/intriguing question, Slides 2-9: One actionable insight per slide with specific example, Slide 10: Summary + strong CTA to follow/save. Make it highly educational and saveable. Topic: [describe topic]. Audience: [describe]. Tone: [professional/casual/inspirational].", description: "10-slide carousel designed to go viral on Instagram", aiTool: "Claude", useCase: "Instagram" },
          { title: "Twitter Thread That Gets Retweeted", body: "Write a 15-tweet thread about [topic] optimized for maximum retweets and replies. Tweet 1: An attention-grabbing hook that makes a bold claim or asks a provocative question — ends with 'Thread'. Tweets 2-13: Each tweet is one complete insight, tip, or story beat. Tweet 14: Synthesizing tweet — the meta-lesson or framework. Tweet 15: Call to action (retweet + follow + related resource). Rules: No tweet exceeds 270 characters. Use numbers for easy scanning. Include one surprising statistic. Topic: [describe]. Niche: [your niche/industry].", description: "15-tweet thread optimized for virality", aiTool: "ChatGPT", useCase: "Twitter/X" },
          { title: "TikTok Script for Business", body: "Write a TikTok script (60 seconds) for [business type] that is educational AND entertaining. Structure: 0-3 seconds: Pattern interrupt hook. 3-15 seconds: Why this matters / credibility build. 15-45 seconds: The 3-step valuable content. 45-55 seconds: Apply to them directly. 55-60 seconds: CTA with specific reason to follow. Include on-screen text suggestions, B-roll ideas, trending sound notes. Business type: [describe]. Main value: [describe]. Target viewer: [describe].", description: "60-second TikTok script that educates and entertains", aiTool: "ChatGPT", useCase: "TikTok" },
        ]
      },
    ]
  },
  {
    categorySlug: "coding",
    packs: [
      {
        title: "Senior Developer Code Review Pack",
        slug: "senior-developer-code-review-pack",
        description: "Level up your code quality with 40 expert prompts for code review, refactoring, debugging, and architecture decisions. These prompts simulate having a senior engineer on your team 24/7. Covers React, Node.js, Python, Go, and general software engineering best practices.",
        shortDescription: "40 prompts that simulate having a senior engineer reviewing your code",
        priceCents: 3400,
        comparePriceCents: 4900,
        isFeatured: true,
        isBestseller: false,
        aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
        tags: ["coding", "code-review", "refactoring", "debugging"],
        prompts: [
          { title: "Comprehensive Code Review", body: "Act as a senior software engineer with 15+ years of experience. Review this code with the rigor of a FAANG code review. Analyze: 1) Correctness and edge cases, 2) Performance (time/space complexity, bottlenecks), 3) Security vulnerabilities (injection, authentication, data exposure), 4) Code style and readability (naming, comments, structure), 5) Error handling (are all failure modes handled?), 6) Testability, 7) SOLID principles adherence, 8) Potential for bugs as requirements change. For each issue: severity (critical/major/minor), explanation, and a corrected code snippet. Language/framework: [specify]. Code:\n\n```\n[paste your code here]\n```", description: "FAANG-level code review across 8 dimensions", aiTool: "Claude", useCase: "Code Review" },
          { title: "Debug and Fix Any Error", body: "I am getting this error: [paste error message and stack trace]. My code:\n\n```[language]\n[paste relevant code]\n```\n\nPlease: 1) Identify the EXACT root cause (not just the symptom), 2) Explain WHY this error occurs in plain terms, 3) Provide the fixed code with comments explaining the changes, 4) Explain 2-3 ways this could have been prevented, 5) List any other potential issues in the surrounding code. Environment: [Node.js version / Python version / etc.]. Context: [what this code is supposed to do].", description: "Root cause analysis and fix for any error", aiTool: "ChatGPT", useCase: "Debugging" },
          { title: "Refactor to Clean Architecture", body: "Refactor this code to follow clean architecture and SOLID principles. Specifically: 1) Extract all business logic into pure functions/classes (separate from I/O), 2) Apply dependency injection for external services, 3) Create proper interfaces/types for all function parameters and returns, 4) Split the file following single-responsibility principle, 5) Add proper error handling at each boundary, 6) Make it 100% unit-testable without database or HTTP mocks. Provide: the refactored code split into files, an explanation of each architectural decision, and a simple unit test. Original code:\n\n```[language]\n[paste code]\n```", description: "Transform messy code into clean architecture", aiTool: "Claude", useCase: "Refactoring" },
          { title: "Write Production-Grade Tests", body: "Write a comprehensive test suite for this function/module. Include: 1) Happy path tests (normal expected behavior), 2) Edge cases (empty inputs, null values, boundary conditions), 3) Error cases (invalid inputs, network failures, DB errors), 4) Integration scenarios if applicable. For each test: use descriptive test names (it should X when Y), include setup/teardown, use proper assertions, and add a comment explaining WHAT and WHY. Testing framework: [Jest/Pytest/Go test/etc.]. The function/module:\n\n```[language]\n[paste code]\n```\n\nFocus areas: [any specific scenarios you are worried about].", description: "Complete test suite covering all edge cases", aiTool: "ChatGPT", useCase: "Testing" },
          { title: "System Design Architecture Review", body: "Review and improve this system architecture. I am building [describe the system]. Here is my current design: [describe or paste architecture]. Evaluate: 1) Scalability bottlenecks (where will it break at 10x traffic?), 2) Single points of failure, 3) Data consistency and race conditions, 4) Database design efficiency (N+1 queries, missing indexes), 5) API design best practices (versioning, pagination), 6) Security architecture, 7) Observability (logging, metrics, tracing). Provide an improved architecture diagram in ASCII, explain each change, and give a phased implementation plan.", description: "System architecture review with scalability improvements", aiTool: "Claude", useCase: "Architecture" },
        ]
      },
      {
        title: "Full-Stack Developer Productivity Pack",
        slug: "full-stack-developer-productivity-pack",
        description: "25 prompts to supercharge your development workflow. From generating boilerplate code and API schemas to writing documentation and creating database schemas. Covers React, Node.js, TypeScript, SQL, and DevOps. These prompts save an average of 3 hours per week.",
        shortDescription: "25 prompts that save 3+ hours per week of development work",
        priceCents: 1900,
        comparePriceCents: null,
        isFeatured: false,
        isBestseller: false,
        aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
        tags: ["coding", "react", "nodejs", "typescript", "productivity"],
        prompts: [
          { title: "Generate TypeScript API Schema", body: "Generate a complete TypeScript type definition for a REST API response from this JSON data:\n\n```json\n[paste JSON]\n```\n\nInclude: 1) Strict TypeScript interfaces with proper null handling, 2) Zod validation schema that mirrors the TypeScript types, 3) An example fetch function using these types, 4) JSDoc comments for each field explaining its purpose. Use z.infer<typeof Schema> pattern to avoid duplicating types. Handle optional fields with ?. notation. Nested objects should be separate named interfaces.", description: "TypeScript interfaces + Zod schemas from JSON", aiTool: "ChatGPT", useCase: "TypeScript" },
          { title: "React Component with Full Implementation", body: "Build a complete, production-ready React component for [component description]. Requirements: 1) TypeScript with strict types for all props, 2) Responsive design using Tailwind CSS, 3) Proper loading, error, and empty states, 4) Accessibility (ARIA labels, keyboard navigation, focus management), 5) Custom hook if the component has complex state logic, 6) Storybook story file, 7) Unit test with React Testing Library. The component should: [describe the component, its purpose, and key behaviors]. Design system: [Material UI/shadcn/custom]. API integration: [describe API calls if needed].", description: "Production-ready React component with tests and Storybook", aiTool: "Claude", useCase: "React" },
          { title: "SQL Query Optimizer", body: "Analyze this SQL query for performance issues and rewrite it to be optimal:\n\n```sql\n[paste your query]\n```\n\nTable schemas:\n```sql\n[paste relevant CREATE TABLE statements]\n```\n\nCurrent performance: [describe: slow on X rows, taking Y seconds, etc.]\n\nProvide: 1) Analysis of why the current query is slow, 2) The optimized query with detailed comments, 3) Which indexes to add and why, 4) EXPLAIN plan interpretation, 5) Alternative approaches (CTEs, window functions, denormalization) if relevant, 6) Expected performance improvement.", description: "SQL query optimization with index recommendations", aiTool: "ChatGPT", useCase: "Database" },
        ]
      },
    ]
  },
  {
    categorySlug: "writing",
    packs: [
      {
        title: "Professional Content Writer's Toolkit",
        slug: "professional-content-writers-toolkit",
        description: "45 prompts for professional content creators, bloggers, and writers. Generate SEO-optimized blog posts, compelling white papers, engaging newsletters, and viral long-form content. Each prompt is engineered to produce publication-ready first drafts that require minimal editing.",
        shortDescription: "45 prompts for publication-ready content across all formats",
        priceCents: 2400,
        comparePriceCents: 3900,
        isFeatured: true,
        isBestseller: true,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["writing", "content", "blogging", "SEO"],
        prompts: [
          { title: "SEO Blog Post Generator", body: "Write a comprehensive, SEO-optimized blog post targeting the keyword [target keyword]. Structure: 1) Title with keyword in first 60 characters, 2) Meta description (155 chars, includes keyword naturally), 3) Introduction (hook readers in first 2 sentences, include keyword naturally), 4) H2 sections (6-8 sections each targeting a related long-tail keyword), 5) Each section: 150-250 words, includes practical example, addresses a specific reader question, 6) FAQ section answering 5 People Also Ask questions, 7) Conclusion with clear CTA. Target word count: 1800-2200 words. Reader expertise level: [beginner/intermediate/advanced]. Publication: [blog name/industry].", description: "Complete SEO blog post with schema structure", aiTool: "ChatGPT", useCase: "Blog Writing" },
          { title: "Newsletter That Gets Opened", body: "Write a weekly newsletter edition for [newsletter name/niche]. Format: 1) Subject line (A/B test: curiosity-gap version + direct benefit version), 2) Preview text (optimize for mobile), 3) Personal intro hook (2-3 sentences, conversational), 4) Main content section: 3-5 curated insights each with a bold headline, 3-4 sentences of insight/synthesis, and one actionable takeaway, 5) Quick hits section: 3 brief items (links/tools/quotes), 6) Closing that builds community and anticipation. Niche: [describe]. Reader type: [describe]. This week's theme: [describe]. Tone: [professional-casual/authoritative/friendly].", description: "Engaging newsletter that readers look forward to", aiTool: "Claude", useCase: "Newsletter" },
          { title: "White Paper Executive Summary", body: "Write a professional white paper about [topic] targeted at [audience]. Structure: 1) Executive Summary (250 words — problem, solution, key findings), 2) Introduction (context, why this matters now, scope), 3) Problem Analysis (3-4 key challenges with statistics), 4) Solution Framework (your methodology or approach), 5) Case Studies (2-3 brief examples), 6) Implementation Guide (5-step process), 7) ROI Analysis (tangible business impact), 8) Conclusion + Call to Action. Topic: [describe]. Organization: [company/research org]. Key argument: [main thesis].", description: "Research-backed white paper for thought leadership", aiTool: "Claude", useCase: "White Papers" },
          { title: "Book Chapter Outline and Draft", body: "Help me write a chapter for my book on [book topic]. Chapter title: [chapter title]. My readers are: [describe audience]. What they know already: [describe]. What this chapter needs to achieve: [describe]. Please provide: 1) A complete chapter outline with H2 and H3 headings, 2) An opening hook paragraph (the reader cannot put it down), 3) Full draft of the first section (1000-1500 words), 4) Transition sentences connecting each section, 5) A memorable closing that sets up the next chapter. Writing style reference: [author you admire]. Book format: [nonfiction/self-help/business/narrative].", description: "Complete book chapter outline and opening draft", aiTool: "Claude", useCase: "Book Writing" },
        ]
      },
    ]
  },
  {
    categorySlug: "business",
    packs: [
      {
        title: "Business Strategy & Operations Pack",
        slug: "business-strategy-operations-pack",
        description: "35 prompts for founders, executives, and business consultants. Generate strategic plans, financial models, investor presentations, and operational frameworks. Developed from real McKinsey, BCG, and startup playbook methodologies.",
        shortDescription: "35 strategic prompts from real McKinsey and startup playbooks",
        priceCents: 4900,
        comparePriceCents: 7900,
        isFeatured: true,
        isBestseller: true,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["business", "strategy", "startup", "consulting"],
        prompts: [
          { title: "Complete Business Plan Generator", body: "Create a comprehensive business plan for [business name/idea]. Cover all sections: 1) Executive Summary (problem, solution, market opportunity, traction, ask), 2) Problem Statement (quantified market pain, current alternatives and their failures), 3) Solution (product/service description, key differentiators, IP/moat), 4) Market Analysis (TAM/SAM/SOM with calculations, customer segments, market trends), 5) Business Model (revenue streams, pricing strategy, unit economics — CAC, LTV, payback period), 6) Go-to-Market Strategy (channels, partnerships, launch plan), 7) Competitive Analysis (2x2 matrix, competitor weaknesses), 8) Team (key roles, gaps to fill), 9) Financial Projections (3-year P&L), 10) Funding Ask (use of funds, milestones). Business: [describe]. Stage: [idea/MVP/revenue]. Industry: [describe].", description: "Complete investor-grade business plan", aiTool: "Claude", useCase: "Business Planning" },
          { title: "Competitive Strategy Analysis", body: "Conduct a strategic competitive analysis for [company] competing in [market]. Deliverables: 1) Porter's Five Forces analysis with specific examples, 2) Competitor profiles (top 5): strengths, weaknesses, positioning, pricing, customer reviews analysis, 3) Market positioning map (2x2 matrix with the two most important axes), 4) Our competitive advantages (features that genuinely differentiate), 5) Competitive threats (what competitors could do in the next 12 months), 6) Strategic response plan (how to defend our position and attack their weaknesses), 7) Blue Ocean opportunities (uncontested market spaces). Company: [describe]. Main competitors: [list]. Our current position: [describe].", description: "Porter's Five Forces + full competitive positioning", aiTool: "ChatGPT", useCase: "Competitive Analysis" },
          { title: "Investor Pitch Deck Narrative", body: "Create a compelling investor pitch narrative for [company] raising a [funding amount] [round type]. Write the speaker notes for each slide: Slide 1 (Cover): Opening statement that frames the entire pitch in one sentence. Slide 2 (Problem): Tell the problem as a story about a real customer. Slide 3 (Solution): The aha moment description. Slide 4 (Market): Why this market, why now. Slide 5 (Traction): Lead with the most impressive metric. Slide 6 (Business Model): How you make money and why unit economics work. Slide 7 (Team): Why specifically you and this team will win. Slide 8 (Ask): What you will do with the money and what milestones it buys. Company: [describe]. Key metrics: [list].", description: "Speaker notes for a compelling 8-slide investor pitch", aiTool: "Claude", useCase: "Investor Relations" },
          { title: "OKR Setting Workshop", body: "Help me set powerful OKRs (Objectives and Key Results) for [company/team/individual] for [time period]. First, analyze my current situation: Current state: [describe where you are]. Target state: [describe where you want to be]. Key challenges: [describe top 3 obstacles]. Strategic priorities: [list]. Then create: 3-5 Objectives (ambitious, qualitative, inspiring — each should make someone excited), For each Objective: 3-5 Key Results (quantitative, measurable, leading indicators of success). Include: health metrics (things that should not decline), a scoring rubric (0.0-1.0 OKR grading system), and a bi-weekly check-in template. Team size: [number]. Time horizon: [quarterly/annual].", description: "Complete OKR framework for company, team, or individual", aiTool: "ChatGPT", useCase: "Goal Setting" },
        ]
      },
    ]
  },
  {
    categorySlug: "ai-agents",
    packs: [
      {
        title: "AI Agent Builder Masterclass Pack",
        slug: "ai-agent-builder-masterclass-pack",
        description: "The ultimate collection of 60 prompts for building sophisticated AI agents. Includes system prompts for autonomous research agents, coding agents, sales agents, and multi-step reasoning chains. These prompts implement ReAct, Chain-of-Thought, and Tree-of-Thought architectures.",
        shortDescription: "60 prompts for building sophisticated AI agents with ReAct and CoT",
        priceCents: 4900,
        comparePriceCents: 7900,
        isFeatured: true,
        isBestseller: true,
        aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
        tags: ["ai-agents", "llm", "prompting", "automation"],
        prompts: [
          { title: "Autonomous Research Agent System Prompt", body: "You are ResearchBot, an autonomous research agent. Your goal is to thoroughly research [research question] and produce a comprehensive, well-cited report.\n\nYou have access to these tools:\n- search(query): Search the web for information\n- read_page(url): Read the content of a webpage\n- summarize(text): Summarize long content\n\nYour research process:\n1. PLAN: Break down the research question into 5-7 sub-questions\n2. SEARCH: For each sub-question, perform 2-3 targeted searches\n3. EVALUATE: Assess source credibility (publication date, authority, bias)\n4. SYNTHESIZE: Connect findings across sources, note contradictions\n5. REPORT: Write a structured report with citations\n\nAlways reason step by step. Show your work. When uncertain, say so.\n\nResearch question: [YOUR QUESTION]\nDepth required: [surface/standard/deep]\nOutput format: [bullet points/prose/academic]", description: "Complete system prompt for a web research AI agent", aiTool: "ChatGPT", useCase: "AI Agents" },
          { title: "Chain-of-Thought Problem Solver", body: "Solve this complex problem using explicit chain-of-thought reasoning:\n\nProblem: [describe the complex problem]\n\nUse this exact reasoning format:\n\n**Step 1: Problem Decomposition**\nBreak this into sub-problems.\n\n**Step 2: Information Gathering**\nWhat do I know for certain? What are my assumptions? What am I uncertain about?\n\n**Step 3: Analysis**\nFor each sub-problem, work through the logic step by step. Show all reasoning.\n\n**Step 4: Integration**\nHow do the solutions to each sub-problem combine?\n\n**Step 5: Validation**\nDoes this solution make sense? What could go wrong?\n\n**Step 6: Final Answer**\nConcise, actionable conclusion.\n\nProblem complexity level: [simple/medium/expert]\nDomain: [specify field/industry]", description: "Structured chain-of-thought reasoning for complex problems", aiTool: "Claude", useCase: "Reasoning" },
          { title: "Multi-Agent Orchestration Prompt", body: "You are an orchestrator AI managing a team of specialized sub-agents. Your task is to coordinate them to complete: [describe complex task]\n\nYour team:\n- Researcher: Finds and synthesizes information\n- Writer: Creates polished content\n- Critic: Reviews and improves output\n- Fact-Checker: Verifies claims\n- Editor: Formats final output\n\nOrchestration protocol:\n1. Analyze the task and create a detailed brief\n2. Assign tasks to agents in optimal order\n3. Review each output before passing to next agent\n4. If quality is insufficient, return to the agent with specific feedback\n5. Synthesize final output that meets all requirements\n\nTask: [YOUR TASK]\nQuality requirements: [describe standards]", description: "Orchestrate multiple AI agents on complex tasks", aiTool: "ChatGPT", useCase: "Multi-Agent" },
          { title: "ReAct Agent Implementation", body: "Implement a ReAct (Reasoning + Acting) agent for [task]. Use this exact format for every response:\n\nThought: [Reason about what to do next. Be explicit about your reasoning.]\nAction: [The specific action to take from your available tools]\nObservation: [The result of the action]\n... (repeat Thought/Action/Observation until done)\nFinal Answer: [The complete answer to the original question]\n\nAvailable tools:\n[List your tools here]\n\nImportant rules:\n- Always think before acting\n- Verify information before presenting it\n- If you are stuck, try a different approach\n- Be explicit when you are uncertain\n\nInitial question: [QUESTION]\nContext: [RELEVANT CONTEXT]", description: "ReAct agent with structured reasoning and action loops", aiTool: "ChatGPT", useCase: "ReAct Pattern" },
        ]
      },
    ]
  },
  {
    categorySlug: "design",
    packs: [
      {
        title: "UI/UX Design Specification Pack",
        slug: "ui-ux-design-specification-pack",
        description: "30 prompts for UI/UX designers to generate design specifications, user research guides, and interface copy. Generate complete design briefs, interaction specifications, accessibility audits, and user testing scripts that align with modern design systems.",
        shortDescription: "30 prompts for design specs, user research, and interface copy",
        priceCents: 2400,
        comparePriceCents: 3400,
        isFeatured: false,
        isBestseller: false,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["design", "ux", "ui", "figma"],
        prompts: [
          { title: "Complete UX Research Plan", body: "Create a comprehensive UX research plan for [product/feature]. Include: 1) Research objectives (3-5 specific questions you need answered), 2) Research methods (choose 2-3 appropriate methods: user interviews, usability testing, surveys, card sorting, tree testing) with rationale for each, 3) Participant recruitment criteria (demographics, behaviors, experience level, n= recommendation), 4) Interview guide (12-15 questions with follow-up probes), 5) Usability test tasks (5-7 realistic scenario-based tasks), 6) Success metrics for each method, 7) Analysis approach and deliverables, 8) Timeline and stakeholder communication plan. Product: [describe]. Current user problem: [describe]. Decisions this research will inform: [list].", description: "Complete UX research plan with interview guide", aiTool: "Claude", useCase: "UX Research" },
          { title: "Design System Component Spec", body: "Write a complete design specification for a [component name] component. Include: 1) Component overview and usage guidelines, 2) Variants (list all visual variants with when to use each), 3) States (default, hover, focus, active, disabled, loading, error) — describe the visual change for each state, 4) Props/configuration options with type and default value, 5) Accessibility requirements (ARIA attributes, keyboard interactions, focus management), 6) Responsive behavior, 7) Content guidelines (character limits, required vs optional content, do's and don'ts), 8) Implementation notes for developers. Component: [name]. Use case: [describe when it's used]. Design system: [Material/Tailwind/custom].", description: "Complete component spec for design system teams", aiTool: "ChatGPT", useCase: "Design Systems" },
          { title: "UX Copy and Microcopy Generator", body: "Write all the UX copy for [feature/flow]. For each screen/state, provide: 1) Headline (clear, benefit-focused, max 8 words), 2) Body text (explains what to do and why, plain language, max 2 sentences), 3) Button/CTA labels (action verbs, specific, max 4 words), 4) Error messages (friendly, specific, tell the user what to do), 5) Empty states (encouraging, actionable), 6) Success messages (congratulatory, what happens next), 7) Tooltip copy (helpful, not obvious). Tone: [friendly/professional/playful]. Brand voice guidelines: [describe]. Users are: [describe user type and expertise level].", description: "Complete UX copy for any feature or user flow", aiTool: "ChatGPT", useCase: "UX Copy" },
        ]
      },
    ]
  },
  {
    categorySlug: "image-generation",
    packs: [
      {
        title: "Midjourney Mastery Pro Pack",
        slug: "midjourney-mastery-pro-pack",
        description: "100 advanced Midjourney prompts for professional-grade AI art creation. Covers portrait photography, product visualization, architectural renders, digital art styles, and commercial illustration. Each prompt includes style parameters, lighting setup, and composition guidance for consistent, stunning results.",
        shortDescription: "100 advanced Midjourney prompts for professional AI art creation",
        priceCents: 3400,
        comparePriceCents: 5900,
        isFeatured: true,
        isBestseller: true,
        aiToolTargets: ["Midjourney", "DALL-E 3", "Stable Diffusion"],
        tags: ["image-generation", "midjourney", "ai-art", "design"],
        prompts: [
          { title: "Cinematic Portrait Photography", body: "/imagine prompt: [subject description], cinematic portrait photography, shot on Hasselblad H6D with 85mm f/1.4 lens, golden hour lighting from 45-degree angle, shallow depth of field with bokeh background, professional color grading in warm tones, skin texture detail, editorial magazine style, inspired by Annie Leibovitz composition, 8K resolution, photorealistic --ar 2:3 --v 6 --q 2 --style raw\n\nCustomize:\n- Subject: [person description, age, appearance]\n- Setting: [location or background]\n- Mood: [joyful/contemplative/powerful/vulnerable]\n- Color palette: [warm/cool/muted/vivid]\n- Additional style: [high fashion/natural/dramatic]", description: "Professional cinematic portrait with lighting and camera specs", aiTool: "Midjourney", useCase: "Portrait Photography" },
          { title: "Product Visualization Pack", body: "/imagine prompt: [product name] product photography, floating on pure white background, studio lighting with three-point setup, sharp focus with subtle drop shadow, minimalist composition, 45-degree hero shot angle, Apple-style product photography aesthetic, high contrast, perfect reflections on glossy surfaces, advertising quality --ar 1:1 --v 6 --q 2 --style raw\n\nFor different angles, modify:\n- Shot type: [hero/flat lay/lifestyle/detail close-up]\n- Background: [white/gradient/lifestyle context]\n- Lighting mood: [studio clean/dramatic/natural]\n- Product type: [tech/beauty/food/apparel]", description: "Apple-quality product photography for any item", aiTool: "Midjourney", useCase: "Product Photography" },
          { title: "Architectural Visualization", body: "/imagine prompt: [building type] exterior architectural visualization, photorealistic rendering, contemporary architecture, natural stone and glass facade, surrounded by mature landscaping, golden hour lighting casting long dramatic shadows, ultra-wide angle perspective, architectural photography style, rendered in Chaos V-Ray quality, hyper-detailed textures, atmospheric depth --ar 16:9 --v 6 --q 2\n\nAdapt for:\n- Building type: [residential/commercial/cultural/hospitality]\n- Style: [modernist/brutalist/biophilic/traditional-contemporary]\n- Season: [spring bloom/summer green/autumn color/winter snow]\n- Time of day: [golden hour/blue hour/night with interior lighting]", description: "Photorealistic architectural renders with professional lighting", aiTool: "Midjourney", useCase: "Architecture" },
          { title: "Brand Identity Illustration Style", body: "/imagine prompt: minimalist vector illustration of [subject], clean geometric shapes, flat design with subtle gradients, modern brand identity style, limited color palette of [primary color] and [accent color], on white background, scalable design suitable for logo use, inspired by Pentagram and Studio Dumbar design aesthetic, professional corporate illustration, no text, smooth edges, perfect symmetry --ar 1:1 --v 6 --style raw --no text, watermark, noise\n\nFor brand assets, also generate:\n- Same illustration on dark background (replace white with #0a0a0a)\n- Monochrome version (grayscale)\n- Pattern version (repeated tile)", description: "Scalable brand identity illustrations for logos and assets", aiTool: "Midjourney", useCase: "Brand Design" },
        ]
      },
    ]
  },
  {
    categorySlug: "productivity",
    packs: [
      {
        title: "Personal Productivity System Builder",
        slug: "personal-productivity-system-builder",
        description: "20 prompts for building your ultimate personal productivity system. Generate custom workflows, habit trackers, goal-setting frameworks, and time-blocking schedules tailored to your specific work style and goals. Used by 500+ executives and high-performers.",
        shortDescription: "20 prompts for your ultimate personal productivity system",
        priceCents: 1400,
        comparePriceCents: null,
        isFeatured: false,
        isBestseller: false,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["productivity", "habits", "goals", "systems"],
        prompts: [
          { title: "Custom Daily Schedule Builder", body: "Design my ideal daily schedule based on my personal profile. My information: Work type: [remote/office/hybrid]. Work hours: [start and end time]. Key responsibilities: [list 3-5 main work duties]. Energy pattern: [morning person/night owl/consistent]. Exercise habit: [when and how long]. Other commitments: [family, side projects, etc.]. Goals for this schedule: [what do you want to achieve?]. Build me: 1) Ideal daily schedule with time blocks (include buffer time), 2) Morning routine (15-minute, 30-minute, and 60-minute versions), 3) Evening shutdown ritual, 4) Weekly review template, 5) Adjustment protocol for when the schedule breaks down. Based on chronobiology, deep work principles, and recovery science.", description: "AI-designed daily schedule based on your personal profile", aiTool: "ChatGPT", useCase: "Time Management" },
          { title: "90-Day Goal Achievement Plan", body: "Create a detailed 90-day plan to achieve: [your goal]. First, challenge my goal with these questions: Is it specific enough? Is 90 days realistic? What would make this 10x better? Then design: 1) Goal refinement: crystal-clear success metrics, 2) Week-by-week milestones (12 weeks of specific targets), 3) Daily minimum viable actions, 4) Weekly key results (3 measurable outcomes per week), 5) Accountability system, 6) Obstacle anticipation (top 5 things that will go wrong and contingency plans), 7) Support system (who to involve, what resources to acquire), 8) Celebration protocol. Goal: [describe precisely]. Available time: [hours per week].", description: "Week-by-week 90-day plan with accountability system", aiTool: "Claude", useCase: "Goal Setting" },
        ]
      },
    ]
  },
  {
    categorySlug: "education",
    packs: [
      {
        title: "Educator's AI Teaching Toolkit",
        slug: "educators-ai-teaching-toolkit",
        description: "25 prompts for teachers, professors, and instructional designers. Create lesson plans, rubrics, differentiated learning materials, and assessments in minutes. Aligned with Bloom's Taxonomy and Universal Design for Learning principles.",
        shortDescription: "25 prompts for lesson plans, rubrics, and differentiated materials",
        priceCents: 1900,
        comparePriceCents: 2900,
        isFeatured: false,
        isBestseller: false,
        aiToolTargets: ["ChatGPT", "Claude"],
        tags: ["education", "teaching", "learning", "curriculum"],
        prompts: [
          { title: "Complete Lesson Plan Generator", body: "Create a comprehensive lesson plan for teaching [topic] to [grade level/audience]. Using Bloom's Taxonomy, design: 1) Learning objectives (3-5 measurable outcomes using action verbs at appropriate cognitive levels), 2) Prior knowledge activation (5-minute hook activity), 3) Direct instruction section (10-15 minutes) with key concepts and examples, 4) Guided practice activity (students apply with teacher support), 5) Independent practice (students demonstrate mastery), 6) Formative assessment (how you will know if learning occurred), 7) Differentiation strategies (for struggling learners, on-level, and advanced), 8) Closure activity (synthesis and preview of next lesson), 9) Materials/resources needed. Subject: [describe]. Duration: [class length]. Standards alignment: [curriculum/standards].", description: "Complete Bloom's Taxonomy-aligned lesson plan", aiTool: "Claude", useCase: "Lesson Planning" },
          { title: "Rubric Creator for Any Assignment", body: "Create a detailed grading rubric for [assignment type]. Include 5 performance criteria, each with 4 performance levels (Exemplary/Proficient/Developing/Beginning). For each cell in the rubric: write specific, observable behaviors (not vague adjectives like 'good'), include concrete examples, and weight each criterion by importance. Also provide: a student-facing version of the rubric (simple language), a self-assessment checklist for students, and feedback sentence starters for each performance level. Assignment: [describe]. Learning objectives being assessed: [list]. Point values: [total points]. Grade level: [specify]. Subject: [specify].", description: "Detailed rubric with specific observable criteria", aiTool: "ChatGPT", useCase: "Assessment" },
        ]
      },
    ]
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Categories
  console.log("Creating categories...");
  const categoryData = [
    { slug: "marketing", name: "Marketing", description: "Prompts for marketing campaigns, copywriting, and growth", icon: "📢", color: "#FF6B6B", sortOrder: 1, isFeatured: true, packCount: 0 },
    { slug: "coding", name: "Coding", description: "Prompts for software development, debugging, and code review", icon: "💻", color: "#6C47FF", sortOrder: 2, isFeatured: true, packCount: 0 },
    { slug: "writing", name: "Writing", description: "Prompts for content creation, storytelling, and creative writing", icon: "✍️", color: "#00D4FF", sortOrder: 3, isFeatured: true, packCount: 0 },
    { slug: "business", name: "Business", description: "Prompts for strategy, operations, and business development", icon: "💼", color: "#FFB347", sortOrder: 4, isFeatured: true, packCount: 0 },
    { slug: "design", name: "Design", description: "Prompts for UI/UX, branding, and visual design", icon: "🎨", color: "#FF69B4", sortOrder: 5, isFeatured: false, packCount: 0 },
    { slug: "productivity", name: "Productivity", description: "Prompts to boost personal and team productivity", icon: "⚡", color: "#32CD32", sortOrder: 6, isFeatured: false, packCount: 0 },
    { slug: "ai-agents", name: "AI Agents", description: "Prompts for building and directing AI agents", icon: "🤖", color: "#9370DB", sortOrder: 7, isFeatured: true, packCount: 0 },
    { slug: "image-generation", name: "Image Generation", description: "Prompts for Midjourney, DALL-E, and Stable Diffusion", icon: "🖼️", color: "#FF4500", sortOrder: 8, isFeatured: true, packCount: 0 },
    { slug: "video-generation", name: "Video Generation", description: "Prompts for Runway, Sora, and other video AI tools", icon: "🎬", color: "#DC143C", sortOrder: 9, isFeatured: false, packCount: 0 },
    { slug: "education", name: "Education", description: "Prompts for teaching, learning, and curriculum development", icon: "📚", color: "#4169E1", sortOrder: 10, isFeatured: false, packCount: 0 },
  ];

  await db.insert(categoriesTable).values(categoryData).onConflictDoNothing();
  const existingCategories = await db.select().from(categoriesTable);
  const catMap = Object.fromEntries(existingCategories.map(c => [c.slug, c]));
  console.log(`✅ ${existingCategories.length} categories ready`);

  // Admin user
  console.log("Creating admin user...");
  const adminPassword = hashPassword("Admin123!");
  await db.insert(usersTable).values({
    email: "admin@promptvault.com",
    passwordHash: adminPassword,
    displayName: "Roshan",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing();

  // Demo buyer
  const buyerPassword = hashPassword("Demo123!");
  await db.insert(usersTable).values({
    email: "demo@user.com",
    passwordHash: buyerPassword,
    displayName: "Alex Chen",
    role: "BUYER",
    status: "ACTIVE",
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing();

  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.email, "demo@user.com")).limit(1);

  console.log("✅ Admin: admin@promptvault.com / Admin123!");
  console.log("✅ Demo user: demo@user.com / Demo123!");

  // Tags
  const tagData = [
    { name: "Marketing", slug: "marketing" }, { name: "AI Writing", slug: "ai-writing" },
    { name: "ChatGPT", slug: "chatgpt" }, { name: "Claude", slug: "claude" },
    { name: "Productivity", slug: "productivity" }, { name: "Business", slug: "business" },
    { name: "Coding", slug: "coding" }, { name: "Design", slug: "design" },
    { name: "Midjourney", slug: "midjourney" }, { name: "AI Agents", slug: "ai-agents" },
  ];
  await db.insert(tagsTable).values(tagData).onConflictDoNothing();

  // Coupons
  await db.insert(couponsTable).values([
    { code: "WELCOME20", discountType: "PERCENT", discountValue: 20, isActive: true, validFrom: new Date(), maxUses: 1000, usesCount: 0 },
    { code: "SAVE10", discountType: "FIXED", discountValue: 10, isActive: true, validFrom: new Date(), maxUses: 500, usesCount: 0 },
    { code: "HALF50", discountType: "PERCENT", discountValue: 50, isActive: true, validFrom: new Date(), maxUses: 100, usesCount: 0 },
  ]).onConflictDoNothing();

  // Packs and prompts
  console.log("Creating packs and prompts...");
  let totalPacks = 0;
  let totalPrompts = 0;

  for (const categoryGroup of PACK_DATA) {
    const category = catMap[categoryGroup.categorySlug];
    if (!category) { console.warn(`⚠️ Category not found: ${categoryGroup.categorySlug}`); continue; }

    for (const packDef of categoryGroup.packs) {
      const { prompts, ...packMeta } = packDef;
      const existing = await db.select().from(packsTable).where(eq(packsTable.slug, packMeta.slug)).limit(1);
      
      if (existing.length > 0) {
        console.log(`  ↩ Pack already exists: ${packMeta.title}`);
        continue;
      }

      const daysAgo = Math.floor(Math.random() * 90);
      const [pack] = await db.insert(packsTable).values({
        ...packMeta,
        categoryId: category.id,
        status: "PUBLISHED",
        promptCount: prompts.length,
        publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      }).returning();

      totalPacks++;

      for (let i = 0; i < prompts.length; i++) {
        await db.insert(promptsTable).values({
          packId: pack.id,
          ...prompts[i],
          status: "APPROVED",
          sortOrder: i + 1,
          version: 1,
        });
        totalPrompts++;
      }
    }
  }

  // Update pack counts in categories
  for (const cat of existingCategories) {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM packs WHERE category_id = ${cat.id} AND status = 'PUBLISHED'`);
    const count = Number((result.rows[0] as any)?.count || 0);
    await db.update(categoriesTable).set({ packCount: count }).where(eq(categoriesTable.id, cat.id));
  }

  // Add some reviews for packs
  const publishedPacks = await db.select().from(packsTable).where(eq(packsTable.status, "PUBLISHED"));
  const [adminUser] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@promptvault.com")).limit(1);
  
  const reviewMessages = [
    { rating: 5, title: "Absolutely worth every penny", body: "These prompts have transformed my workflow. I've been able to produce content 3x faster and the quality is noticeably better. Highly recommended for anyone serious about AI-powered work." },
    { rating: 5, title: "Game changer for my business", body: "I was skeptical at first but after using these prompts for two weeks, I've saved over 15 hours of work. The business strategy prompts alone have been invaluable for our Series A prep." },
    { rating: 4, title: "Great quality, minor formatting issues", body: "The prompts themselves are excellent and very well thought out. A few could use better formatting for direct copy-paste use, but the content is top-notch." },
    { rating: 5, title: "Best purchase I've made this year", body: "As a freelance copywriter, this pack pays for itself every week. The marketing prompts are especially strong — I've used them on client projects worth 10x the price of this pack." },
    { rating: 5, title: "Incredibly detailed and practical", body: "What sets these prompts apart is how specific and actionable they are. Not just generic placeholders but real engineered prompts with context and nuance built in." },
  ];

  if (adminUser && publishedPacks.length > 0) {
    for (const pack of publishedPacks.slice(0, 8)) {
      const review = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];
      await db.insert(reviewsTable).values({
        packId: pack.id,
        userId: adminUser.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        isVerified: false,
        isFlagged: false,
      }).onConflictDoNothing();
    }
  }

  // Create sample order for demo user
  if (buyer && publishedPacks.length > 0) {
    const firstPack = publishedPacks[0];
    const existingOrder = await db.select().from(ordersTable).where(eq(ordersTable.userId, buyer.id)).limit(1);
    
    if (existingOrder.length === 0) {
      const [order] = await db.insert(ordersTable).values({
        userId: buyer.id,
        status: "COMPLETED",
        subtotalCents: firstPack.priceCents,
        discountCents: 0,
        taxCents: 0,
        totalCents: firstPack.priceCents,
        currency: "usd",
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      }).returning();

      await db.insert(orderItemsTable).values({
        orderId: order.id,
        packId: firstPack.id,
        priceCents: firstPack.priceCents,
        titleSnapshot: firstPack.title,
      });
    }
  }

  console.log(`✅ ${totalPacks} new packs created`);
  console.log(`✅ ${totalPrompts} prompts created`);
  console.log(`✅ Sample coupons: WELCOME20, SAVE10, HALF50`);
  console.log(`\n🎉 Database seeded successfully!`);
  console.log(`   Admin: admin@promptvault.com / Admin123!`);
  console.log(`   Demo:  demo@user.com / Demo123!`);
  console.log(`   Coupons: WELCOME20 (20% off), SAVE10 ($10 off), HALF50 (50% off)`);
}

seed().catch(console.error);
