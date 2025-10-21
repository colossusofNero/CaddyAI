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
