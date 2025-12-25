import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { generatePageMetadata, StructuredData, generateOrganizationSchema, generateMobileAppSchema } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#B87333',
};

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: "Your AI Golf Caddy",
    description: "Get smart club recommendations powered by AI. Join 50,000+ golfers improving their game with real-time distance tracking, course mapping, and intelligent shot analysis.",
    keywords: [
      'golf caddy app',
      'AI golf assistant',
      'golf club recommendations',
      'golf GPS',
      'golf yardage app',
      'smart golf caddy',
    ],
  }),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Copperline Golf',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <StructuredData data={generateOrganizationSchema()} />
        <StructuredData data={generateMobileAppSchema()} />
        <script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          async
          type="text/javascript"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <GoogleAnalytics />
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
