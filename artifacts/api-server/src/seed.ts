import { db } from "@workspace/db";
import {
  usersTable, categoriesTable, packsTable, promptsTable,
  reviewsTable, tagsTable, systemSettingsTable, newsletterSubscribersTable
} from "@workspace/db";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

if (process.env.NODE_ENV === "production") {
  console.error("❌ Seed script must not be run in production. Exiting.");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting database seed...");

  const adminHash = await bcrypt.hash("Admin@PromptVault2026", 12);
  const creatorHash = await bcrypt.hash("Creator@2026!", 12);
  const buyerHash = await bcrypt.hash("Buyer@2026!", 12);

  const [admin] = await db.insert(usersTable).values({
    email: "admin@promptvault.com",
    passwordHash: adminHash,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    displayName: "PromptVault Admin",
    username: "pvadmin",
    bio: "Platform administrator and curator of premium AI prompts.",
    isCreator: true,
    isVerified: true,
    trustScore: 100,
    referralCode: "ADMIN001",
    subscriptionPlan: "enterprise",
    emailVerifiedAt: new Date(),
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { role: "SUPER_ADMIN", status: "ACTIVE", passwordHash: adminHash, emailVerifiedAt: new Date() },
  }).returning();
  console.log("✅ Admin user:", admin.id);

  const [creator] = await db.insert(usersTable).values({
    email: "creator@promptvault.com",
    passwordHash: creatorHash,
    role: "CREATOR",
    status: "ACTIVE",
    displayName: "Alex Chen",
    username: "alexchen",
    bio: "AI prompt engineer specializing in marketing, coding, and creative writing. 5+ years in AI/ML.",
    isCreator: true,
    isVerified: true,
    trustScore: 95,
    referralCode: "ALEX001",
    subscriptionPlan: "pro",
    twitterHandle: "alexchenai",
    githubHandle: "alexchen-dev",
    websiteUrl: "https://alexchen.dev",
    specialties: ["ChatGPT", "Midjourney", "Marketing", "Coding"],
    emailVerifiedAt: new Date(),
    followerCount: 234,
    publicPackCount: 5,
    totalDownloadsAllPacks: 3600,
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { role: "CREATOR", status: "ACTIVE", emailVerifiedAt: new Date() },
  }).returning();
  console.log("✅ Creator user:", creator.id);

  const [buyer] = await db.insert(usersTable).values({
    email: "buyer@promptvault.com",
    passwordHash: buyerHash,
    role: "BUYER",
    status: "ACTIVE",
    displayName: "Sarah Johnson",
    username: "sarahj",
    bio: "Marketing professional exploring AI tools to 10x my productivity.",
    trustScore: 70,
    referralCode: "SARAH001",
    emailVerifiedAt: new Date(),
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { status: "ACTIVE", emailVerifiedAt: new Date() },
  }).returning();
  console.log("✅ Buyer user:", buyer.id);

  const catData = [
    { name: "Marketing", slug: "marketing", description: "Prompts for marketers, copywriters, and growth hackers", icon: "📢", color: "#FF6B6B", sortOrder: 1 },
    { name: "Coding & Development", slug: "coding", description: "Developer tools, code generation, and debugging prompts", icon: "💻", color: "#4ECDC4", sortOrder: 2 },
    { name: "Creative Writing", slug: "creative-writing", description: "Story ideas, scripts, poetry, and creative content", icon: "✍️", color: "#45B7D1", sortOrder: 3 },
    { name: "Business & Strategy", slug: "business", description: "Business plans, strategy, and productivity prompts", icon: "📊", color: "#96CEB4", sortOrder: 4 },
    { name: "Midjourney & Image AI", slug: "midjourney", description: "Visual AI prompts for stunning image generation", icon: "🎨", color: "#FFEAA7", sortOrder: 5 },
    { name: "Education & Learning", slug: "education", description: "Teaching, tutoring, and learning acceleration prompts", icon: "🎓", color: "#DDA0DD", sortOrder: 6 },
    { name: "Sales & CRM", slug: "sales", description: "Sales scripts, cold outreach, and negotiation prompts", icon: "🤝", color: "#F0A500", sortOrder: 7 },
    { name: "SEO & Content", slug: "seo", description: "SEO optimization, content strategy, and blogging prompts", icon: "🔍", color: "#7B68EE", sortOrder: 8 },
  ];

  const catIds: Record<string, number> = {};
  for (const c of catData) {
    const [cat] = await db.insert(categoriesTable).values({ ...c, isFeatured: true, packCount: 0 })
      .onConflictDoUpdate({ target: [categoriesTable.slug], set: { name: c.name } }).returning();
    catIds[c.slug] = cat.id;
  }
  console.log("✅ Categories:", Object.keys(catIds).length);

  const settingsData = [
    { key: "enable_creator_marketplace", value: JSON.stringify(true) },
    { key: "enable_subscriptions", value: JSON.stringify(true) },
    { key: "enable_affiliate_program", value: JSON.stringify(true) },
    { key: "enable_gifting", value: JSON.stringify(true) },
    { key: "enable_bundles", value: JSON.stringify(true) },
    { key: "enable_cart", value: JSON.stringify(true) },
    { key: "enable_social_features", value: JSON.stringify(true) },
    { key: "enable_comments", value: JSON.stringify(true) },
    { key: "enable_community_prompts", value: JSON.stringify(true) },
    { key: "enable_semantic_search", value: JSON.stringify(false) },
    { key: "maintenance_mode", value: JSON.stringify(false) },
    { key: "new_user_registration", value: JSON.stringify(true) },
    { key: "site_name", value: JSON.stringify("PromptVault") },
    { key: "site_tagline", value: JSON.stringify("The #1 AI Prompt Marketplace") },
    { key: "commission_rate_standard", value: JSON.stringify(70) },
    { key: "commission_rate_pro", value: JSON.stringify(80) },
  ];
  for (const s of settingsData) {
    await db.insert(systemSettingsTable).values(s).onConflictDoUpdate({ target: [systemSettingsTable.key], set: { value: s.value as any } });
  }
  console.log("✅ System settings");

  const packData = [
    {
      title: "Ultimate ChatGPT Marketing Pack",
      slug: "ultimate-chatgpt-marketing-pack",
      description: "Transform your marketing campaigns with 50 expertly crafted ChatGPT prompts. From viral social media content to high-converting email sequences, this pack covers every marketing need. Each prompt includes variable placeholders for instant customization.",
      shortDescription: "50 battle-tested ChatGPT prompts for marketers. Covers social media, email, ads, and more.",
      categoryId: catIds["marketing"],
      aiToolTargets: ["ChatGPT", "Claude"],
      priceCents: 2999, comparePriceCents: 4999, isFeatured: true, isBestseller: true,
      tags: ["marketing", "social media", "email", "ChatGPT", "copywriting"],
      creatorId: creator.id, totalDownloads: 847, avgRating: "4.8", reviewCount: 124,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop",
      viewCount: 3400, appreciationCount: 67,
    },
    {
      title: "Midjourney Photorealistic Portraits",
      slug: "midjourney-photorealistic-portraits",
      description: "Master the art of photorealistic portrait generation with Midjourney. This pack contains 30 carefully engineered prompts that produce stunning, lifelike portraits. Includes professional lighting techniques and composition formulas.",
      shortDescription: "30 Midjourney prompts for stunning photorealistic portraits with pro lighting techniques.",
      categoryId: catIds["midjourney"],
      aiToolTargets: ["Midjourney"],
      priceCents: 1999, comparePriceCents: 3499, isFeatured: true, isBestseller: false,
      tags: ["midjourney", "portrait", "photography", "image generation"],
      creatorId: admin.id, totalDownloads: 1243, avgRating: "4.9", reviewCount: 89,
      thumbnailUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop",
      viewCount: 5200, appreciationCount: 134,
    },
    {
      title: "Full-Stack Developer Assistant Pack",
      slug: "fullstack-developer-assistant",
      description: "The only coding prompt pack you'll ever need. 40 advanced prompts for full-stack developers covering React, Node.js, Python, database design, code review, debugging, architecture decisions, and technical documentation.",
      shortDescription: "40 pro coding prompts for full-stack devs. Covers React, Node.js, Python, and architecture.",
      categoryId: catIds["coding"],
      aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
      priceCents: 3499, comparePriceCents: 5999, isFeatured: true, isBestseller: true,
      tags: ["coding", "development", "React", "Node.js", "Python"],
      creatorId: creator.id, totalDownloads: 2156, avgRating: "4.9", reviewCount: 201,
      thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
      viewCount: 8900, appreciationCount: 198,
    },
    {
      title: "Viral YouTube Script Generator",
      slug: "viral-youtube-script-generator",
      description: "Create compelling YouTube content that keeps viewers watching. 25 script templates for tutorials, vlogs, product reviews, listicles, and explainers. Engineered to maximize watch time and CTR.",
      shortDescription: "25 YouTube script templates for high watch time and maximum engagement.",
      categoryId: catIds["creative-writing"],
      aiToolTargets: ["ChatGPT", "Claude"],
      priceCents: 1499, isFeatured: false, isBestseller: false,
      tags: ["YouTube", "video", "script", "content creation"],
      creatorId: admin.id, totalDownloads: 432, avgRating: "4.6", reviewCount: 67,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
      viewCount: 1800, appreciationCount: 45,
    },
    {
      title: "Sales Cold Email Masterclass",
      slug: "sales-cold-email-masterclass",
      description: "Stop getting ignored. 35 battle-tested cold email prompts with 40%+ open rates. Includes subject line formulas, follow-up sequences, and personalization frameworks used by top B2B sales teams.",
      shortDescription: "35 cold email prompts with high open rates. Includes subject lines and follow-up sequences.",
      categoryId: catIds["sales"],
      aiToolTargets: ["ChatGPT", "Claude"],
      priceCents: 2499, comparePriceCents: 3999, isFeatured: false, isBestseller: true,
      tags: ["sales", "cold email", "B2B", "outreach", "lead generation"],
      creatorId: creator.id, totalDownloads: 923, avgRating: "4.7", reviewCount: 145,
      thumbnailUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop",
      viewCount: 3900, appreciationCount: 89,
    },
    {
      title: "SEO Blog Content Engine",
      slug: "seo-blog-content-engine",
      description: "Rank higher with AI-powered SEO content. 30 prompts for creating keyword-rich blog posts, meta descriptions, title tags, and internal linking strategies. Includes content briefs and competitor analysis.",
      shortDescription: "30 SEO prompts for ranking blog content. Covers keyword research and optimization.",
      categoryId: catIds["seo"],
      aiToolTargets: ["ChatGPT", "Claude", "Gemini"],
      priceCents: 1999, isFeatured: false, isBestseller: false,
      tags: ["SEO", "blogging", "content marketing", "keyword research"],
      creatorId: admin.id, totalDownloads: 678, avgRating: "4.5", reviewCount: 92,
      thumbnailUrl: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=300&fit=crop",
      viewCount: 2800, appreciationCount: 56,
    },
    {
      title: "Business Plan & Strategy Kit",
      slug: "business-plan-strategy-kit",
      description: "From idea to investor deck. Covers market analysis, competitive positioning, financial projections, SWOT analysis, go-to-market strategy, and pitch deck creation. Used by 500+ startup founders.",
      shortDescription: "Complete startup toolkit: market analysis, strategy, financials, and pitch deck prompts.",
      categoryId: catIds["business"],
      aiToolTargets: ["ChatGPT", "Claude"],
      priceCents: 3999, comparePriceCents: 6999, isFeatured: true, isBestseller: false,
      tags: ["business", "startup", "strategy", "pitch deck", "market analysis"],
      creatorId: creator.id, totalDownloads: 567, avgRating: "4.8", reviewCount: 78,
      thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
      viewCount: 2400, appreciationCount: 67,
    },
    {
      title: "Online Course Creator Pack",
      slug: "online-course-creator-pack",
      description: "Launch your online course with AI-powered curriculum design. 28 prompts for course outlines, lesson scripts, quiz generation, student engagement strategies, and marketing copy for landing pages.",
      shortDescription: "28 prompts for course creators: curriculum design, lesson scripts, and marketing copy.",
      categoryId: catIds["education"],
      aiToolTargets: ["ChatGPT", "Claude"],
      priceCents: 2499, isFeatured: false, isBestseller: false,
      tags: ["education", "e-learning", "course creation", "curriculum"],
      creatorId: admin.id, totalDownloads: 345, avgRating: "4.6", reviewCount: 54,
      thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
      viewCount: 1500, appreciationCount: 34,
    },
  ];

  const packIds: number[] = [];
  for (const p of packData) {
    const [pack] = await db.insert(packsTable).values({
      title: p.title, slug: p.slug, description: p.description,
      shortDescription: p.shortDescription, categoryId: p.categoryId,
      status: "PUBLISHED", aiToolTargets: p.aiToolTargets,
      priceCents: p.priceCents, comparePriceCents: p.comparePriceCents || null,
      isFeatured: p.isFeatured, isBestseller: p.isBestseller,
      tags: p.tags, creatorId: p.creatorId,
      totalDownloads: p.totalDownloads, avgRating: p.avgRating,
      reviewCount: p.reviewCount, publishedAt: new Date(),
      packType: "single", licenseType: "standard",
      viewCount: p.viewCount, appreciationCount: p.appreciationCount,
      thumbnailUrl: p.thumbnailUrl, promptCount: 5, qualityScore: 92,
    } as any).onConflictDoUpdate({
      target: [packsTable.slug],
      set: { title: p.title, updatedAt: new Date() },
    } as any).returning();
    packIds.push(pack.id);
    await db.execute(sql`UPDATE categories SET pack_count = pack_count + 1 WHERE id = ${p.categoryId}`);
  }
  console.log("✅ Packs:", packIds.length);

  const marketingPrompts = [
    { title: "Viral Social Media Hook Generator", body: "Write 10 attention-grabbing hooks for a social media post about [YOUR PRODUCT/SERVICE]. Use different psychological triggers: curiosity, FOMO, social proof, controversy, surprise. Target audience: [TARGET AUDIENCE]. Platform: [PLATFORM]. Under 15 words each.", description: "Generate irresistible social media opening lines", useCase: "Social Media", aiTool: "ChatGPT", sortOrder: 1 },
    { title: "Email Subject Line A/B Test Generator", body: "Create 5 pairs of A/B test email subject lines for this campaign: [CAMPAIGN GOAL]. Variant A: straightforward benefit-focused. Variant B: curiosity or pattern interrupt. Email list: [AUDIENCE]. Include preview text for each pair.", description: "Generate high-converting email subject lines for A/B testing", useCase: "Email Marketing", aiTool: "ChatGPT", sortOrder: 2 },
    { title: "Customer Persona Deep Dive", body: "Create a detailed customer persona for [BUSINESS TYPE] targeting [DEMOGRAPHIC]. Include: name, age, job title, income range, daily routine, top 5 pain points, top 3 goals, buying objections, preferred channels, and emotional transformation sought.", description: "Build comprehensive customer personas", useCase: "Market Research", aiTool: "Claude", sortOrder: 3 },
    { title: "Facebook Ad Copy Variations", body: "Write 3 Facebook ad variations for [PRODUCT/SERVICE] targeting [AUDIENCE]. Each: primary text (125 chars), headline (27 chars), description (27 chars). Variation 1: Problem-Agitate-Solution. Variation 2: Social proof. Variation 3: Direct response with urgency.", description: "Create multiple Facebook ad variations", useCase: "Paid Advertising", aiTool: "ChatGPT", sortOrder: 4 },
    { title: "Brand Voice & Tone Guide Creator", body: "Analyze these content samples and create a brand voice guide: [PASTE 2-3 EXAMPLES]. Define: 5 personality adjectives, tone for different scenarios (social/email/support/sales), words to use/avoid, and 5 example rewrites demonstrating correct brand voice.", description: "Define your brand voice for consistent content", useCase: "Brand Strategy", aiTool: "Claude", sortOrder: 5 },
  ];

  for (const pr of marketingPrompts) {
    await db.insert(promptsTable).values({ packId: packIds[0], ...pr, variables: [] }).onConflictDoNothing();
  }
  await db.execute(sql`UPDATE packs SET prompt_count = 5 WHERE id = ${packIds[0]}`);

  const codingPrompts = [
    { title: "Code Review Expert", body: "Act as a senior engineer reviewing this [LANGUAGE] code for: 1) Security vulnerabilities, 2) Performance issues, 3) Readability, 4) Best practice violations, 5) Unhandled edge cases. Provide line-by-line feedback with severity (Critical/Major/Minor). Code: [PASTE CODE]", description: "Expert code review with security and performance analysis", useCase: "Code Review", aiTool: "Claude", sortOrder: 1 },
    { title: "React Component Architect", body: "Design a React component for [COMPONENT DESCRIPTION]. Requirements: [LIST]. Generate: 1) Full TypeScript component with types, 2) Custom hook if needed, 3) React Testing Library unit tests, 4) Storybook story, 5) JSDoc documentation. Use modern patterns and WCAG accessibility.", description: "Build production-ready React components with full coverage", useCase: "Frontend Dev", aiTool: "ChatGPT", sortOrder: 2 },
    { title: "Database Schema Designer", body: "Design a PostgreSQL schema for [APPLICATION TYPE]. Include: 1) CREATE TABLE with constraints, 2) Query-pattern indexes, 3) Foreign key relationships, 4) 10 rows of seed data per table, 5) Design decision explanations. Optimize for normalization and scalability.", description: "Get optimized PostgreSQL schema designs", useCase: "Database", aiTool: "Claude", sortOrder: 3 },
    { title: "REST API Endpoint Designer", body: "Design a REST API for [FEATURE]. Provide: 1) OpenAPI 3.0 YAML spec, 2) Request/response examples, 3) Error responses with status codes, 4) Auth requirements, 5) Rate limiting recommendations. Follow REST best practices and semantic versioning.", description: "Design production-ready REST APIs", useCase: "API Design", aiTool: "ChatGPT", sortOrder: 4 },
    { title: "Bug Hunter & Debugger", body: "Bug in my [LANGUAGE/FRAMEWORK] app. Error: [ERROR MESSAGE]. Code: [CODE]. Expected: [EXPECTED BEHAVIOR]. Tried: [ATTEMPTED FIXES]. Please: 1) Identify root cause, 2) Explain why it occurs, 3) Provide corrected code, 4) Suggest prevention strategies.", description: "Systematic bug identification and resolution", useCase: "Debugging", aiTool: "Claude", sortOrder: 5 },
  ];

  for (const pr of codingPrompts) {
    await db.insert(promptsTable).values({ packId: packIds[2], ...pr, variables: [] }).onConflictDoNothing();
  }
  await db.execute(sql`UPDATE packs SET prompt_count = 5 WHERE id = ${packIds[2]}`);

  const reviewData = [
    { packId: packIds[0], userId: buyer.id, rating: 5, title: "Absolute game changer!", body: "Elevated my marketing output 10x. The social media prompts alone are worth 10x the price. Every marketing professional needs this.", helpfulVoteCount: 23 },
    { packId: packIds[2], userId: buyer.id, rating: 5, title: "Every developer needs this", body: "The React component prompts produce production-ready code. The code review prompts found 3 security issues in my existing codebase. Pure gold.", helpfulVoteCount: 45 },
    { packId: packIds[1], userId: buyer.id, rating: 5, title: "Jaw-dropping results", body: "Generated portfolio-quality portraits for a client project in an afternoon. My clients thought they were shot by a real photographer.", helpfulVoteCount: 18 },
    { packId: packIds[4], userId: admin.id, rating: 5, title: "Massive ROI on cold outreach", body: "Used these templates for 3 months and tripled my response rate. The follow-up sequences are particularly valuable.", helpfulVoteCount: 67 },
  ];

  for (const r of reviewData) {
    await db.insert(reviewsTable).values({ ...r, isVerifiedPurchase: true, isApproved: true } as any).onConflictDoNothing();
  }

  const tagData = ["ChatGPT", "Claude", "Midjourney", "Gemini", "marketing", "coding", "creative", "business", "SEO", "email", "sales", "education"];
  for (const t of tagData) {
    await db.insert(tagsTable).values({ name: t, slug: t.toLowerCase().replace(/\s+/g, "-"), usageCount: Math.floor(Math.random() * 100) + 10 }).onConflictDoNothing();
  }

  await db.insert(newsletterSubscribersTable).values({
    email: "newsletter@test.com", name: "Newsletter Test", isActive: true, unsubscribeToken: "tok_newsletter_test",
  }).onConflictDoNothing();

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("  Super Admin: admin@promptvault.com / Admin@PromptVault2026");
  console.log("  Creator:     creator@promptvault.com / Creator@2026!");
  console.log("  Buyer:       buyer@promptvault.com / Buyer@2026!");
  console.log("\n🔑 Admin Login URL: /pvx-admin");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
