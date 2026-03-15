import { Helmet } from "react-helmet-async";

const SITE_NAME = "PromptVault";
const DEFAULT_DESCRIPTION = "Browse and purchase premium AI prompt packs for ChatGPT, Claude, Midjourney and more. Boost your AI productivity with curated, professional prompts.";
const DEFAULT_OG_IMAGE = "/images/opengraph.jpg";
const SITE_URL = "https://promptvault--ganeswar07rana.replit.app";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  type?: "website" | "article" | "product";
  keywords?: string;
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noindex = false,
  type = "website",
  keywords,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium AI Prompt Packs`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const ogImageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  );
}
