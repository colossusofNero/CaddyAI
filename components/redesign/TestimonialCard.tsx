/**
 * TestimonialCard Component
 * Design System: Social Proof Section
 * Displays user testimonials with avatar, rating, and verified badge
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, CheckCircle } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  verified?: boolean;
  delay?: number;
}

export function TestimonialCard({
  quote,
  author,
  role,
  location,
  avatar,
  rating = 5,
  verified = true,
  delay = 0,
}: TestimonialCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(27, 94, 32, 0.12)' }}
      className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 hover:border-primary/20 transition-all duration-300 h-full flex flex-col"
    >
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-600 p-0.5">
            <div className="w-full h-full rounded-full bg-white p-0.5">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={author}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-xl">
                    {author.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <CheckCircle className="w-5 h-5 text-primary fill-primary-50" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-sans font-semibold text-neutral-900 text-base">
            {author}
          </h4>
          <p className="font-sans text-sm text-neutral-600">
            {role}
          </p>
          <p className="font-sans text-xs text-neutral-500">
            {location}
          </p>
        </div>
      </div>

      {/* Quote */}
      <blockquote className="font-sans text-lg text-neutral-700 leading-relaxed mb-6 flex-1">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Rating */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? 'text-gold-500 fill-gold-500'
                : 'text-neutral-300 fill-neutral-300'
            }`}
          />
        ))}
      </div>

      {/* Verified Badge */}
      {verified && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Verified User</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
