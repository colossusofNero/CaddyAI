'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshot {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const screenshots: Screenshot[] = [
  {
    id: '1',
    title: 'Smart Club Recommendations',
    image: '/images/app/screenshot-club-recommendation.jpg',
    alt: 'AI-powered club recommendation screen showing suggested club with distance and conditions',
  },
  {
    id: '2',
    title: 'Interactive Course Map',
    image: '/images/app/screenshot-course-map.jpg',
    alt: 'GPS course map view with hole layout and distance measurements',
  },
  {
    id: '3',
    title: 'Round Tracking',
    image: '/images/app/screenshot-round-tracking.jpg',
    alt: 'Live scorecard and shot tracking during a round',
  },
  {
    id: '4',
    title: 'Statistics Dashboard',
    image: '/images/app/screenshot-stats-dashboard.jpg',
    alt: 'Comprehensive statistics dashboard with performance metrics',
  },
  {
    id: '5',
    title: 'Personal Profile',
    image: '/images/app/screenshot-profile.jpg',
    alt: 'User profile with club bag setup and distance tracking',
  },
  {
    id: '6',
    title: 'Weather Conditions',
    image: '/images/app/screenshot-weather.jpg',
    alt: 'Real-time weather overlay with wind speed and direction',
  },
  {
    id: '7',
    title: 'Shot History',
    image: '/images/app/screenshot-shot-history.jpg',
    alt: 'Historical shot data with club performance analysis',
  },
  {
    id: '8',
    title: 'Performance Insights',
    image: '/images/app/screenshot-insights.jpg',
    alt: 'AI-generated insights and recommendations to improve your game',
  },
];

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = screenshots.length - 1;
      if (nextIndex >= screenshots.length) nextIndex = 0;
      return nextIndex;
    });
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Main Carousel */}
      <div className="relative h-[600px] bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-3xl overflow-hidden shadow-2xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
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
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="relative w-full max-w-sm mx-auto">
              {/* Phone Frame */}
              <div className="relative bg-neutral-900 rounded-[3rem] p-4 shadow-2xl">
                <div className="relative bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-3xl z-10"></div>

                  {/* Screenshot Content */}
                  <div className="relative aspect-[9/19.5] bg-neutral-50">
                    {/* Placeholder for actual screenshot */}
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                          <span className="text-3xl">📱</span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">
                          {screenshots[currentIndex].title}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {screenshots[currentIndex].alt}
                        </p>
                      </div>
                    </div>

                    {/* TODO: Replace with actual screenshot images */}
                    {/* <img
                      src={screenshots[currentIndex].image}
                      alt={screenshots[currentIndex].alt}
                      className="w-full h-full object-cover"
                    /> */}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-900" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
          aria-label="Next screenshot"
        >
          <ChevronRight className="w-6 h-6 text-neutral-900" />
        </button>
      </div>

      {/* Thumbnail Navigation */}
      <div className="mt-8 flex gap-3 justify-center overflow-x-auto pb-4">
        {screenshots.map((screenshot, index) => (
          <button
            key={screenshot.id}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`
              flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all
              ${
                index === currentIndex
                  ? 'ring-4 ring-primary scale-110'
                  : 'opacity-50 hover:opacity-100'
              }
            `}
          >
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-100 flex items-center justify-center">
              <span className="text-2xl">{index + 1}</span>
            </div>
            {/* TODO: Replace with actual thumbnail */}
            {/* <img
              src={screenshot.image}
              alt={screenshot.title}
              className="w-full h-full object-cover"
            /> */}
          </button>
        ))}
      </div>

      {/* Indicator Dots */}
      <div className="mt-4 flex gap-2 justify-center">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`
              h-2 rounded-full transition-all
              ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              }
            `}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
