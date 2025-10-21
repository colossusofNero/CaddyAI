/**
 * TestimonialSlider Component
 * Auto-play carousel with testimonials, swipe gestures, and navigation controls
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { testimonials, Testimonial } from '@/lib/testimonials';
import { slideVariants, swipePower, swipeConfidenceThreshold } from '@/lib/animations';

interface TestimonialSliderProps {
  autoPlayInterval?: number; // milliseconds
  showNavigation?: boolean;
  showDots?: boolean;
}

export function TestimonialSlider({
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
}: TestimonialSliderProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const testimonialIndex = ((page % testimonials.length) + testimonials.length) % testimonials.length;
  const currentTestimonial = testimonials[testimonialIndex];

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  // Auto-play functionality
  useEffect(() => {
    if (isPaused || !autoPlayInterval) return;

    const interval = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, autoPlayInterval, paginate]);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  const goToSlide = (index: number) => {
    const newDirection = index > testimonialIndex ? 1 : -1;
    setPage([index, newDirection]);
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Testimonial Container */}
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            <TestimonialCard testimonial={currentTestimonial} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {showNavigation && testimonials.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-10 h-10 lg:w-12 lg:h-12 bg-secondary-800/80 backdrop-blur-sm hover:bg-secondary-700 border border-secondary-600 rounded-full flex items-center justify-center transition-colors group"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-10 h-10 lg:w-12 lg:h-12 bg-secondary-800/80 backdrop-blur-sm hover:bg-secondary-700 border border-secondary-600 rounded-full flex items-center justify-center transition-colors group"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-text-secondary group-hover:text-primary transition-colors" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === testimonialIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-secondary-600 hover:bg-secondary-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === testimonialIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TestimonialCard Component
 * Individual testimonial card with quote, rating, and user info
 */
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-gradient-to-br from-secondary-800/50 to-secondary-900/50 backdrop-blur-sm border border-secondary-700 rounded-3xl p-8 lg:p-12 relative">
      {/* Quote Icon */}
      <div className="absolute top-6 right-6 opacity-10">
        <Quote className="w-16 h-16 lg:w-24 lg:h-24 text-primary" />
      </div>

      {/* Rating Stars */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            className="w-5 h-5 text-primary fill-primary"
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-lg lg:text-xl text-text-primary leading-relaxed mb-8 relative z-10">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* User Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xl lg:text-2xl font-bold text-white">
            {testimonial.name.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>

        {/* Details */}
        <div>
          <p className="font-bold text-text-primary text-lg">
            {testimonial.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>{testimonial.handicap}</span>
            <span className="w-1 h-1 bg-text-muted rounded-full" />
            <span>{testimonial.location}</span>
          </div>
        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl" />
    </div>
  );
}
