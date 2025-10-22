import { Metadata } from 'next';

// Base site configuration
export const siteConfig = {
  name: 'CaddyAI',
  title: 'CaddyAI - Your AI Golf Caddy',
  description: 'Get smart club recommendations powered by AI. Join 50,000+ golfers improving their game with real-time distance tracking, course mapping, and intelligent shot analysis.',
  url: 'https://caddyai.com',
  ogImage: '/og-image.jpg',
  twitterImage: '/twitter-image.jpg',
  keywords: [
    'golf caddy app',
    'AI golf assistant',
    'golf club recommendations',
    'golf GPS',
    'golf yardage app',
    'smart golf caddy',
    'golf shot tracker',
    'golf course mapper',
    'handicap tracker',
    'golf statistics',
  ],
};

// Generate metadata for pages
export function generatePageMetadata({
  title,
  description,
  keywords,
  path = '',
  ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title;
  const pageDescription = description || siteConfig.description;
  const pageUrl = `${siteConfig.url}${path}`;
  const pageOgImage = ogImage || siteConfig.ogImage;
  const pageKeywords = keywords || siteConfig.keywords;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords.join(', '),
    authors: [{ name: 'CaddyAI Team' }],
    creator: 'CaddyAI',
    publisher: 'CaddyAI',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: pageOgImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [siteConfig.twitterImage],
      creator: '@caddyai',
      site: '@caddyai',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
  };
}

// JSON-LD Schema.org structured data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CaddyAI',
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      'https://twitter.com/caddyai',
      'https://instagram.com/caddyai',
      'https://facebook.com/caddyai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@caddyai.com',
      contactType: 'Customer Support',
    },
  };
}

export function generateMobileAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'CaddyAI',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'SportsApplication',
    description: siteConfig.description,
    url: siteConfig.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2450',
      bestRating: '5',
      worstRating: '1',
    },
    screenshot: `${siteConfig.url}/screenshots/app-preview.jpg`,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateProductSchema({
  name,
  description,
  price,
  currency = 'USD',
  availability = 'InStock',
}: {
  name: string;
  description: string;
  price: string;
  currency?: string;
  availability?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: {
      '@type': 'Brand',
      name: 'CaddyAI',
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: siteConfig.url,
    },
  };
}

// Component for injecting JSON-LD schemas
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}
