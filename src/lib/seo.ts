// SEO utilities for Search Console optimization

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  url: string;
  type: 'website' | 'article';
}

export interface AdStructuredData {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  image?: string;
  url: string;
  offers?: {
    "@type": "Offer";
    availability: string;
  };
}

export function generateAdStructuredData(ad: {
  name: string;
  text: string;
  imageUrl?: string;
  telegramLink: string;
}): AdStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.name,
    description: ad.text,
    image: ad.imageUrl,
    url: ad.telegramLink,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock"
    }
  };
}

export function generateMetaTags(seo: SEOData): Record<string, string> {
  return {
    "title": seo.title,
    "description": seo.description,
    "keywords": seo.keywords.join(", "),
    "og:title": seo.title,
    "og:description": seo.description,
    "og:image": seo.image || "",
    "og:url": seo.url,
    "og:type": seo.type,
    "twitter:card": "summary_large_image",
    "twitter:title": seo.title,
    "twitter:description": seo.description,
    "twitter:image": seo.image || ""
  };
}

export function generateSitemapEntry(ad: {
  id: string;
  name: string;
  updatedAt?: string;
}): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const lastmod = ad.updatedAt ? new Date(ad.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return `
  <url>
    <loc>${baseUrl}/ad/${ad.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}
