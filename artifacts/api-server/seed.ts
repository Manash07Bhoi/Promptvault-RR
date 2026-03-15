import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Starting database seed...");

    // ─── Admin User ───────────────────────────────────────────────
    const passwordHash = await bcrypt.hash("Admin@PromptVault2026", 12);
    const { rows: [admin] } = await client.query(`
      INSERT INTO users (email, password_hash, role, status, display_name, username, bio, is_creator, is_verified, trust_score, referral_code, subscription_plan)
      VALUES ($1, $2, 'SUPER_ADMIN', 'ACTIVE', 'PromptVault Admin', 'admin', 'Platform administrator and curator of premium AI prompts.', true, true, 100, 'ADMIN001', 'enterprise')
      ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', status = 'ACTIVE'
      RETURNING id
    `, ['admin@promptvault.com', passwordHash]);
    console.log("✅ Admin user created:", admin.id);

    // ─── Creator User ─────────────────────────────────────────────
    const creatorHash = await bcrypt.hash("Creator@2026!", 12);
    const { rows: [creator] } = await client.query(`
      INSERT INTO users (email, password_hash, role, status, display_name, username, bio, is_creator, is_verified, trust_score, referral_code, subscription_plan,
        twitter_handle, github_handle, website_url, specialties)
      VALUES ($1, $2, 'CREATOR', 'ACTIVE', 'Alex Chen', 'alexchen', 'AI prompt engineer specializing in marketing, coding, and creative writing prompts. 5+ years in AI/ML.', true, true, 95, 'ALEX001', 'pro',
        'alexchenai', 'alexchen-dev', 'https://alexchen.dev', ARRAY['ChatGPT','Midjourney','Marketing','Coding'])
      ON CONFLICT (email) DO UPDATE SET role = 'CREATOR', status = 'ACTIVE'
      RETURNING id
    `, ['creator@promptvault.com', creatorHash]);
    console.log("✅ Creator user created:", creator.id);

    // ─── Buyer User ───────────────────────────────────────────────
    const buyerHash = await bcrypt.hash("Buyer@2026!", 12);
    const { rows: [buyer] } = await client.query(`
      INSERT INTO users (email, password_hash, role, status, display_name, username, bio, trust_score, referral_code)
      VALUES ($1, $2, 'BUYER', 'ACTIVE', 'Sarah Johnson', 'sarahj', 'Marketing professional exploring AI tools.', 70, 'SARAH001')
      ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE'
      RETURNING id
    `, ['buyer@promptvault.com', buyerHash]);
    console.log("✅ Buyer user created:", buyer.id);

    // ─── Categories ───────────────────────────────────────────────
    const categories = [
      { name: 'Marketing', slug: 'marketing', description: 'Prompts for marketers, copywriters, and growth hackers', icon: '📢', color: '#FF6B6B', sort_order: 1 },
      { name: 'Coding & Development', slug: 'coding', description: 'Developer tools, code generation, debugging prompts', icon: '💻', color: '#4ECDC4', sort_order: 2 },
      { name: 'Creative Writing', slug: 'creative-writing', description: 'Story ideas, scripts, poetry, and creative content', icon: '✍️', color: '#45B7D1', sort_order: 3 },
      { name: 'Business & Strategy', slug: 'business', description: 'Business plans, strategy, and productivity prompts', icon: '📊', color: '#96CEB4', sort_order: 4 },
      { name: 'Midjourney & Image AI', slug: 'midjourney', description: 'Visual AI prompts for stunning image generation', icon: '🎨', color: '#FFEAA7', sort_order: 5 },
      { name: 'Education & Learning', slug: 'education', description: 'Teaching, tutoring, and learning acceleration prompts', icon: '🎓', color: '#DDA0DD', sort_order: 6 },
      { name: 'Sales & CRM', slug: 'sales', description: 'Sales scripts, cold outreach, and negotiation prompts', icon: '🤝', color: '#F0A500', sort_order: 7 },
      { name: 'SEO & Content', slug: 'seo', description: 'SEO optimization, content strategy, and blogging prompts', icon: '🔍', color: '#7B68EE', sort_order: 8 },
    ];

    const categoryIds: Record<string, number> = {};
    for (const cat of categories) {
      const { rows: [c] } = await client.query(`
        INSERT INTO categories (name, slug, description, icon, color, sort_order, is_featured, pack_count)
        VALUES ($1, $2, $3, $4, $5, $6, true, 0)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [cat.name, cat.slug, cat.description, cat.icon, cat.color, cat.sort_order]);
      categoryIds[cat.slug] = c.id;
    }
    console.log("✅ Categories created:", Object.keys(categoryIds).length);

    // ─── System Settings (Feature Flags) ─────────────────────────
    const settings = [
      { key: 'enable_creator_marketplace', value: true },
      { key: 'enable_subscriptions', value: true },
      { key: 'enable_affiliate_program', value: true },
      { key: 'enable_gifting', value: true },
      { key: 'enable_bundles', value: true },
      { key: 'enable_cart', value: true },
      { key: 'enable_social_features', value: true },
      { key: 'enable_comments', value: true },
      { key: 'enable_community_prompts', value: true },
      { key: 'enable_semantic_search', value: false },
      { key: 'maintenance_mode', value: false },
      { key: 'new_user_registration', value: true },
      { key: 'site_name', value: 'PromptVault' },
      { key: 'site_tagline', value: 'The #1 AI Prompt Marketplace' },
      { key: 'commission_rate_standard', value: 70 },
      { key: 'commission_rate_pro', value: 80 },
    ];
    for (const s of settings) {
      await client.query(`
        INSERT INTO system_settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [s.key, JSON.stringify(s.value)]);
    }
    console.log("✅ System settings configured");

    // ─── Prompt Packs ─────────────────────────────────────────────
    const packs = [
      {
        title: 'Ultimate ChatGPT Marketing Pack',
        slug: 'ultimate-chatgpt-marketing-pack',
        description: 'Transform your marketing campaigns with 50 expertly crafted ChatGPT prompts. From viral social media content to high-converting email sequences, this pack covers every marketing need. Each prompt includes variable placeholders for instant customization.',
        short_description: '50 battle-tested ChatGPT prompts for marketers. Covers social media, email, ads, and more.',
        category_slug: 'marketing',
        ai_tool_targets: ['ChatGPT', 'Claude'],
        price_cents: 2999,
        compare_price_cents: 4999,
        is_featured: true,
        is_bestseller: true,
        tags: ['marketing', 'social media', 'email', 'ChatGPT', 'copywriting'],
        creator_id: creator.id,
        total_downloads: 847,
        avg_rating: 4.8,
        review_count: 124,
        thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=300&fit=crop',
      },
      {
        title: 'Midjourney Photorealistic Portraits',
        slug: 'midjourney-photorealistic-portraits',
        description: 'Master the art of photorealistic portrait generation with Midjourney. This pack contains 30 carefully engineered prompts that produce stunning, lifelike portraits. Includes lighting techniques, style references, and composition formulas used by professional photographers.',
        short_description: '30 Midjourney prompts for stunning photorealistic portraits with pro lighting techniques.',
        category_slug: 'midjourney',
        ai_tool_targets: ['Midjourney'],
        price_cents: 1999,
        compare_price_cents: 3499,
        is_featured: true,
        is_bestseller: false,
        tags: ['midjourney', 'portrait', 'photography', 'image generation'],
        creator_id: admin.id,
        total_downloads: 1243,
        avg_rating: 4.9,
        review_count: 89,
        thumbnail_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
      },
      {
        title: 'Full-Stack Developer Assistant Pack',
        slug: 'fullstack-developer-assistant',
        description: 'The only coding prompt pack you\'ll ever need. 40 advanced prompts for full-stack developers covering React, Node.js, Python, database design, code review, debugging, architecture decisions, and technical documentation. Each prompt is production-tested.',
        short_description: '40 pro coding prompts for full-stack devs. Covers React, Node.js, Python, and architecture.',
        category_slug: 'coding',
        ai_tool_targets: ['ChatGPT', 'Claude', 'Gemini'],
        price_cents: 3499,
        compare_price_cents: 5999,
        is_featured: true,
        is_bestseller: true,
        tags: ['coding', 'development', 'React', 'Node.js', 'Python', 'debugging'],
        creator_id: creator.id,
        total_downloads: 2156,
        avg_rating: 4.9,
        review_count: 201,
        thumbnail_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      },
      {
        title: 'Viral YouTube Script Generator',
        slug: 'viral-youtube-script-generator',
        description: 'Create compelling YouTube content that keeps viewers watching. This pack includes 25 script templates for different video formats: tutorials, vlogs, product reviews, listicles, and explainers. Each template is engineered to maximize watch time and CTR.',
        short_description: '25 YouTube script templates engineered for high watch time and maximum engagement.',
        category_slug: 'creative-writing',
        ai_tool_targets: ['ChatGPT', 'Claude'],
        price_cents: 1499,
        is_featured: false,
        is_bestseller: false,
        tags: ['YouTube', 'video', 'script', 'content creation', 'creative writing'],
        creator_id: admin.id,
        total_downloads: 432,
        avg_rating: 4.6,
        review_count: 67,
        thumbnail_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop',
      },
      {
        title: 'Sales Cold Email Masterclass',
        slug: 'sales-cold-email-masterclass',
        description: 'Stop getting ignored. This pack of 35 battle-tested cold email prompts will help you write outreach that actually gets responses. Includes subject line formulas, follow-up sequences, and personalization frameworks used by top B2B sales teams.',
        short_description: '35 cold email prompts with 40%+ open rates. Includes subject lines and follow-up sequences.',
        category_slug: 'sales',
        ai_tool_targets: ['ChatGPT', 'Claude'],
        price_cents: 2499,
        compare_price_cents: 3999,
        is_featured: false,
        is_bestseller: true,
        tags: ['sales', 'cold email', 'B2B', 'outreach', 'lead generation'],
        creator_id: creator.id,
        total_downloads: 923,
        avg_rating: 4.7,
        review_count: 145,
        thumbnail_url: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop',
      },
      {
        title: 'SEO Blog Content Engine',
        slug: 'seo-blog-content-engine',
        description: 'Rank higher with AI-powered SEO content. This pack contains 30 prompts for creating keyword-rich blog posts, meta descriptions, title tags, and internal linking strategies. Includes prompts for topic clustering, content briefs, and competitor analysis.',
        short_description: '30 SEO prompts for ranking blog content. Covers keyword research, briefs, and optimization.',
        category_slug: 'seo',
        ai_tool_targets: ['ChatGPT', 'Claude', 'Gemini'],
        price_cents: 1999,
        is_featured: false,
        is_bestseller: false,
        tags: ['SEO', 'blogging', 'content marketing', 'keyword research'],
        creator_id: admin.id,
        total_downloads: 678,
        avg_rating: 4.5,
        review_count: 92,
        thumbnail_url: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=300&fit=crop',
      },
      {
        title: 'Business Plan & Strategy Kit',
        slug: 'business-plan-strategy-kit',
        description: 'From idea to investor deck. This comprehensive business prompt pack covers market analysis, competitive positioning, financial projections, SWOT analysis, go-to-market strategy, and pitch deck creation. Used by 500+ startup founders.',
        short_description: 'Complete startup toolkit: market analysis, strategy, financials, and pitch deck prompts.',
        category_slug: 'business',
        ai_tool_targets: ['ChatGPT', 'Claude'],
        price_cents: 3999,
        compare_price_cents: 6999,
        is_featured: true,
        is_bestseller: false,
        tags: ['business', 'startup', 'strategy', 'pitch deck', 'market analysis'],
        creator_id: creator.id,
        total_downloads: 567,
        avg_rating: 4.8,
        review_count: 78,
        thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
      },
      {
        title: 'Online Course Creator Pack',
        slug: 'online-course-creator-pack',
        description: 'Launch your online course with AI-powered curriculum design. This pack includes prompts for course outline creation, lesson script writing, quiz generation, student engagement strategies, and marketing copy for course landing pages.',
        short_description: '28 prompts for course creators: curriculum design, lesson scripts, and marketing copy.',
        category_slug: 'education',
        ai_tool_targets: ['ChatGPT', 'Claude'],
        price_cents: 2499,
        is_featured: false,
        is_bestseller: false,
        tags: ['education', 'e-learning', 'course creation', 'curriculum', 'teaching'],
        creator_id: admin.id,
        total_downloads: 345,
        avg_rating: 4.6,
        review_count: 54,
        thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      },
    ];

    const packIds: number[] = [];
    for (const p of packs) {
      const catId = categoryIds[p.category_slug];
      const { rows: [pack] } = await client.query(`
        INSERT INTO packs (title, slug, description, short_description, category_id, status, ai_tool_targets,
          price_cents, compare_price_cents, is_featured, is_bestseller, tags, creator_id,
          total_downloads, avg_rating, review_count, published_at, pack_type, license_type, view_count, appreciation_count,
          thumbnail_url, prompt_count, quality_score)
        VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, NOW(), 'single', 'standard', $16, $17, $18, 0, 92)
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
        RETURNING id
      `, [
        p.title, p.slug, p.description, p.short_description, catId,
        JSON.stringify(p.ai_tool_targets), p.price_cents, p.compare_price_cents || null,
        p.is_featured, p.is_bestseller, JSON.stringify(p.tags), p.creator_id,
        p.total_downloads, p.avg_rating, p.review_count, p.total_downloads * 3, Math.floor(p.total_downloads * 0.12),
        p.thumbnail_url,
      ]);
      packIds.push(pack.id);

      // Update category pack count
      await client.query(`UPDATE categories SET pack_count = pack_count + 1 WHERE id = $1`, [catId]);
    }
    console.log("✅ Packs created:", packIds.length);

    // ─── Prompts for first pack ───────────────────────────────────
    const marketingPrompts = [
      {
        title: 'Viral Social Media Hook Generator',
        body: 'Write 10 attention-grabbing hooks for a social media post about [YOUR PRODUCT/SERVICE]. Each hook should use a different psychological trigger (curiosity, fear of missing out, social proof, controversy, or surprise). Target audience: [TARGET AUDIENCE]. Platform: [PLATFORM]. Make each hook under 15 words.',
        description: 'Generate irresistible opening lines for social media posts',
        use_case: 'Social Media',
        ai_tool: 'ChatGPT',
        sort_order: 1,
      },
      {
        title: 'Email Subject Line A/B Test Generator',
        body: 'Create 5 pairs of A/B test email subject lines for the following campaign: [CAMPAIGN GOAL]. The A variant should be straightforward and benefit-focused. The B variant should use curiosity, a question, or a pattern interrupt. Email list: [AUDIENCE DESCRIPTION]. Include preview text for each.',
        description: 'Generate high-converting email subject lines for A/B testing',
        use_case: 'Email Marketing',
        ai_tool: 'ChatGPT',
        sort_order: 2,
      },
      {
        title: 'Customer Persona Deep Dive',
        body: 'Create a detailed customer persona for [BUSINESS TYPE] targeting [DEMOGRAPHIC]. Include: name, age, job title, annual income, daily routine, pain points (top 5), goals (top 3), objections to buying, preferred communication channels, and the emotional transformation they seek. Make it feel like a real person, not a stereotype.',
        description: 'Build comprehensive customer personas for targeted marketing',
        use_case: 'Market Research',
        ai_tool: 'Claude',
        sort_order: 3,
      },
      {
        title: 'Facebook Ad Copy Variations',
        body: 'Write 3 Facebook ad variations for [PRODUCT/SERVICE] targeting [AUDIENCE]. Each ad should have: a primary text (125 chars max), headline (27 chars max), and description (27 chars max). Variation 1: Problem-Agitate-Solution format. Variation 2: Social proof and testimonial style. Variation 3: Direct response with urgency. Target: [SPECIFIC PAIN POINT].',
        description: 'Create multiple Facebook ad variations with different angles',
        use_case: 'Paid Advertising',
        ai_tool: 'ChatGPT',
        sort_order: 4,
      },
      {
        title: 'Brand Voice & Tone Guide Creator',
        body: 'Analyze these sample pieces of our existing content and create a comprehensive brand voice guide: [PASTE 2-3 CONTENT EXAMPLES]. The guide should define: personality adjectives (5), tone for different scenarios (social media, email, customer service, sales), words to use/avoid, sentence structure preferences, and 5 example rewrites showing the correct brand voice applied to generic text.',
        description: 'Define and document your brand voice for consistent content',
        use_case: 'Brand Strategy',
        ai_tool: 'Claude',
        sort_order: 5,
      },
    ];

    if (packIds[0]) {
      for (const pr of marketingPrompts) {
        await client.query(`
          INSERT INTO prompts (pack_id, title, body, description, use_case, ai_tool, sort_order, variables)
          VALUES ($1, $2, $3, $4, $5, $6, $7, '[]')
          ON CONFLICT DO NOTHING
        `, [packIds[0], pr.title, pr.body, pr.description, pr.use_case, pr.ai_tool, pr.sort_order]);
      }
      await client.query(`UPDATE packs SET prompt_count = $1 WHERE id = $2`, [marketingPrompts.length, packIds[0]]);
    }

    // Add prompts for coding pack
    const codingPrompts = [
      {
        title: 'Code Review Expert',
        body: 'Act as a senior software engineer conducting a thorough code review. Review the following [PROGRAMMING LANGUAGE] code for: 1) Security vulnerabilities, 2) Performance issues, 3) Code readability and maintainability, 4) Best practices violations, 5) Edge cases not handled. Provide specific line-by-line feedback with severity ratings (Critical/Major/Minor). Code: [PASTE CODE HERE]',
        description: 'Get expert code review feedback across multiple dimensions',
        use_case: 'Code Review',
        ai_tool: 'Claude',
        sort_order: 1,
      },
      {
        title: 'React Component Architect',
        body: 'Design a React component for [COMPONENT NAME/DESCRIPTION]. Requirements: [LIST REQUIREMENTS]. Generate: 1) Full TypeScript component with proper types, 2) Custom hook if needed, 3) Unit tests using React Testing Library, 4) Storybook story file, 5) JSDoc documentation. Use modern React patterns (hooks, context if needed) and follow accessibility best practices.',
        description: 'Build production-ready React components with tests and docs',
        use_case: 'Frontend Development',
        ai_tool: 'ChatGPT',
        sort_order: 2,
      },
      {
        title: 'Database Schema Designer',
        body: 'Design a PostgreSQL database schema for [APPLICATION TYPE]. Requirements: [DESCRIBE THE APP]. Include: 1) CREATE TABLE statements with appropriate data types and constraints, 2) Indexes for common query patterns, 3) Foreign key relationships, 4) Sample seed data (10 rows per table), 5) Explanation of design decisions. Consider normalization, performance, and scalability.',
        description: 'Get optimized PostgreSQL schema designs with explanations',
        use_case: 'Database Design',
        ai_tool: 'Claude',
        sort_order: 3,
      },
    ];

    if (packIds[2]) {
      for (const pr of codingPrompts) {
        await client.query(`
          INSERT INTO prompts (pack_id, title, body, description, use_case, ai_tool, sort_order, variables)
          VALUES ($1, $2, $3, $4, $5, $6, $7, '[]')
          ON CONFLICT DO NOTHING
        `, [packIds[2], pr.title, pr.body, pr.description, pr.use_case, pr.ai_tool, pr.sort_order]);
      }
      await client.query(`UPDATE packs SET prompt_count = $1 WHERE id = $2`, [codingPrompts.length, packIds[2]]);
    }

    // ─── Reviews ─────────────────────────────────────────────────
    const reviews = [
      { pack_idx: 0, rating: 5, title: 'Absolute game changer!', body: 'I\'ve been using AI for marketing for 2 years and this pack elevated my output 10x. The social media prompts alone are worth 10x the price. Highly recommend for any marketing professional.', reviewer_id: buyer.id },
      { pack_idx: 2, rating: 5, title: 'Every developer needs this', body: 'The React component prompts are incredibly detailed. Got production-ready code in minutes. The code review prompts found 3 security issues in my existing codebase. Pure gold.', reviewer_id: buyer.id },
      { pack_idx: 1, rating: 5, title: 'Jaw-dropping results', body: 'Generated portfolio-quality portraits for a client project in an afternoon. The lighting technique prompts are particularly valuable. My clients couldn\'t believe these weren\'t shot by a photographer.', reviewer_id: buyer.id },
    ];

    for (const r of reviews) {
      await client.query(`
        INSERT INTO reviews (pack_id, user_id, rating, title, body, is_verified_purchase, is_approved, helpful_vote_count)
        VALUES ($1, $2, $3, $4, $5, true, true, $6)
        ON CONFLICT DO NOTHING
      `, [packIds[r.pack_idx], r.reviewer_id, r.rating, r.title, r.body, Math.floor(Math.random() * 30) + 5]);
    }
    console.log("✅ Reviews created");

    // ─── Tags ─────────────────────────────────────────────────────
    const tags = ['ChatGPT', 'Claude', 'Midjourney', 'Gemini', 'marketing', 'coding', 'creative', 'business', 'SEO', 'email', 'sales', 'education'];
    for (const t of tags) {
      await client.query(`
        INSERT INTO tags (name, slug, usage_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO NOTHING
      `, [t, t.toLowerCase().replace(/\s+/g, '-'), Math.floor(Math.random() * 100) + 10]);
    }
    console.log("✅ Tags created");

    // ─── User email verification ──────────────────────────────────
    await client.query(`UPDATE users SET email_verified_at = NOW(), status = 'ACTIVE' WHERE email IN ($1, $2, $3)`,
      ['admin@promptvault.com', 'creator@promptvault.com', 'buyer@promptvault.com']);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("  Super Admin: admin@promptvault.com / Admin@PromptVault2026");
    console.log("  Creator:     creator@promptvault.com / Creator@2026!");
    console.log("  Buyer:       buyer@promptvault.com / Buyer@2026!");
    console.log("\n🔑 Hidden Admin Login: /pvx-admin");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
