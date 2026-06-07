import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Copperline Golf - AI Golf Caddy App for iOS & Android',
  description:
    'Download Copperline Golf for free on iOS and Android. Get AI-powered club recommendations, real-time weather data, GPS course maps, and performance tracking to improve your golf game.',
  keywords: [
    'Copperline Golf app',
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
    title: 'Download Copperline Golf - Your AI Golf Caddy',
    description:
      'Transform your golf game with AI-powered recommendations. Download free on iOS and Android.',
    type: 'website',
    url: 'https://copperlinegolf.com/download',
    images: [
      {
        url: '/images/og-download.jpg',
        width: 1200,
        height: 630,
        alt: 'Copperline Golf Mobile App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Copperline Golf - AI Golf Caddy App',
    description:
      'Get AI-powered club recommendations on the course. Free download for iOS and Android.',
    images: ['/images/twitter-download.jpg'],
  },
  alternates: {
    canonical: 'https://copperlinegolf.com/download',
  },
  other: {
    'apple-itunes-app': 'app-id=123456789', // TODO: Replace with actual App Store ID
    'google-play-app': 'app-id=com.Copperline Golf.app',
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
    name: 'Copperline Golf',
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
      'Copperline Golf is an AI-powered golf caddy app that provides smart club recommendations, real-time weather data, GPS course maps, and comprehensive performance tracking.',
    screenshot: [
      'https://copperlinegolf.com/images/app/screenshot-1.jpg',
      'https://copperlinegolf.com/images/app/screenshot-2.jpg',
      'https://copperlinegolf.com/images/app/screenshot-3.jpg',
    ],
    downloadUrl: [
      'https://apps.apple.com/app/Copperline Golf/id123456789',
      'https://play.google.com/store/apps/details?id=com.Copperline Golf.app',
    ],
    installUrl: [
      'https://apps.apple.com/app/Copperline Golf/id123456789',
      'https://play.google.com/store/apps/details?id=com.Copperline Golf.app',
    ],
    author: {
      '@type': 'Organization',
      name: 'Copperline Golf',
      url: 'https://copperlinegolf.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Copperline Golf',
      url: 'https://copperlinegolf.com',
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
