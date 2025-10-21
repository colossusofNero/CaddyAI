/**
 * Testimonials Section
 * Social proof with rotating user testimonials
 */

'use client';

import { Card } from '@/components/ui/Card';

interface Testimonial {
  name: string;
  handicap: string;
  avatar: string;
  quote: string;
  improvement: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Michael Chen',
    handicap: '12 handicap',
    avatar: 'MC',
    quote: "CaddyAI helped me drop my handicap from 18 to 12 in just 6 months. The club recommendations are spot-on, and I'm hitting more greens than ever.",
    improvement: '6 strokes improved',
  },
  {
    name: 'Sarah Johnson',
    handicap: '8 handicap',
    avatar: 'SJ',
    quote: "I was skeptical at first, but CaddyAI's wind and elevation adjustments are incredible. It's like having a professional caddy in my pocket.",
    improvement: '4 strokes improved',
  },
  {
    name: 'David Martinez',
    handicap: '15 handicap',
    avatar: 'DM',
    quote: "The personalized club tracking changed my game completely. Now I know exactly how far I hit each club in different conditions.",
    improvement: '7 strokes improved',
  },
  {
    name: 'Emily Roberts',
    handicap: '22 handicap',
    avatar: 'ER',
    quote: "As a beginner, CaddyAI gave me confidence on the course. No more guessing which club to use - it's educational and effective.",
    improvement: '5 strokes improved',
  },
  {
    name: 'James Wilson',
    handicap: '5 handicap',
    avatar: 'JW',
    quote: "Even as a low-handicap player, CaddyAI helps me make smarter decisions on tough shots. The data-driven approach is brilliant.",
    improvement: '3 strokes improved',
  },
  {
    name: 'Lisa Anderson',
    handicap: '16 handicap',
    avatar: 'LA',
    quote: "I love how CaddyAI learns my tendencies. It knows I tend to fade my long irons and adjusts recommendations accordingly.",
    improvement: '6 strokes improved',
  },
];

export function Testimonials() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-text-primary mb-4">
          Loved by Golfers of All Levels
        </h2>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Join thousands of players who've improved their game with CaddyAI
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {testimonials.map((testimonial, index) => (
          <Card key={index} variant="default" padding="lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {testimonial.avatar}
              </div>
              <div className="flex-1">
                <div className="font-bold text-text-primary">{testimonial.name}</div>
                <div className="text-sm text-text-secondary">{testimonial.handicap}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">"{testimonial.quote}"</p>
            <div className="inline-flex items-center gap-2 bg-success bg-opacity-10 text-success px-3 py-1 rounded-full text-xs font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              {testimonial.improvement}
            </div>
          </Card>
        ))}
      </div>

      {/* Trust Stats */}
      <div className="grid md:grid-cols-4 gap-8 mt-16">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
          <div className="text-text-secondary">Active Golfers</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">2M+</div>
          <div className="text-text-secondary">Shots Analyzed</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">4.2</div>
          <div className="text-text-secondary">Avg. Strokes Saved</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">15,000+</div>
          <div className="text-text-secondary">Courses Supported</div>
        </div>
      </div>
    </section>
  );
}
