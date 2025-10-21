/**
 * Mobile Sticky CTA
 * Floating call-to-action button for mobile users
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden animate-slide-up">
      <Link href="/signup">
        <button className="w-full bg-gradient-to-r from-primary to-primary-600 text-white font-bold py-4 px-6 rounded-xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Start Free Trial
          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">30 days</span>
        </button>
      </Link>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
