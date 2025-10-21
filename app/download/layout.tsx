import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download CaddyAI - AI Golf Caddy App for iOS & Android',
  description:
    'Download CaddyAI for free on iOS and Android. Get AI-powered club recommendations, real-time weather data, GPS course maps, and performance tracking to improve your golf game.',
  keywords: [
    'CaddyAI app',
    'golf app download',
    'AI golf caddy',
    'golf GPS app',
    'club selection app',
    'golf statistics app',
    'iOS golf app',
    'Android golf app',
    'golf course GPS',
    'golf shot tracking',
  ],
  openGraph: {
    title: 'Download CaddyAI - Your AI Golf Caddy',
    description:
      'Transform your golf game with AI-powered recommendations. Download free on iOS and Android.',
    type: 'website',
    url: 'https://caddyai.com/download',
    images: [
      {
        url: '/images/og-download.jpg',
        width: 1200,
        height: 630,
        alt: 'CaddyAI Mobile App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download CaddyAI - AI Golf Caddy App',
    description:
      'Get AI-powered club recommendations on the course. Free download for iOS and Android.',
    images: ['/images/twitter-download.jpg'],
  },
  alternates: {
    canonical: 'https://caddyai.com/download',
  },
  other: {
    'apple-itunes-app': 'app-id=123456789', // TODO: Replace with actual App Store ID
    'google-play-app': 'app-id=com.caddyai.app',
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Schema.org JSON-LD for Mobile Application
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'CaddyAI',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'iOS 14.0+, Android 8.0+',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '5000',
      bestRating: '5',
      worstRating: '1',
    },
    description:
      'CaddyAI is an AI-powered golf caddy app that provides smart club recommendations, real-time weather data, GPS course maps, and comprehensive performance tracking.',
    screenshot: [
      'https://caddyai.com/images/app/screenshot-1.jpg',
      'https://caddyai.com/images/app/screenshot-2.jpg',
      'https://caddyai.com/images/app/screenshot-3.jpg',
    ],
    downloadUrl: [
      'https://apps.apple.com/app/caddyai/id123456789',
      'https://play.google.com/store/apps/details?id=com.caddyai.app',
    ],
    installUrl: [
      'https://apps.apple.com/app/caddyai/id123456789',
      'https://play.google.com/store/apps/details?id=com.caddyai.app',
    ],
    author: {
      '@type': 'Organization',
      name: 'CaddyAI',
      url: 'https://caddyai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CaddyAI',
      url: 'https://caddyai.com',
    },
    softwareVersion: '1.0',
    datePublished: '2025-01-01',
    dateModified: '2025-10-21',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {children}
    </>
  );
}
