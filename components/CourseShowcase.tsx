/**
 * Course Showcase Component
 * Display beautiful golf course imagery with overlays
 */

'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Star, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function CourseShowcase() {
  const t = useTranslations('marketing.courseShowcase');

  const featuredCourses = [
    { name: 'Pebble Beach', location: t('locPebbleBeach'), image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop', rating: 4.9, plays: '15.2K' },
    { name: 'St Andrews Links', location: t('locStAndrews'), image: 'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=800&auto=format&fit=crop', rating: 4.8, plays: '12.8K' },
    { name: 'Augusta National', location: t('locAugusta'), image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop', rating: 5.0, plays: '8.5K' },
    { name: 'Royal Melbourne', location: t('locRoyalMelbourne'), image: 'https://images.unsplash.com/photo-1593111774240-d529f12cb0ee?q=80&w=800&auto=format&fit=crop', rating: 4.7, plays: '9.3K' },
  ];
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background via-background-light to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {t('badge')}
            </span>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-text-primary mb-6"
          >
            {t('heading')}
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="text-lg text-text-secondary max-w-2xl mx-auto"
          >
            {t('subheading')}
          </motion.p>
        </motion.div>

        {/* Course Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {featuredCourses.map((course, index) => (
            <motion.div
              key={course.name}
              variants={staggerItem}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              {/* Course Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="text-sm font-bold text-text-primary">
                    {course.rating}
                  </span>
                </div>
              </div>

              {/* Course Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-sans font-bold mb-2 group-hover:text-secondary transition-colors">
                  {course.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span>{course.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('plays', { count: course.plays })}</span>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center px-4">
                  <p className="text-sm font-semibold mb-2">{t('hoverCta')}</p>
                  <div className="w-12 h-0.5 bg-white/50 mx-auto" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Courses CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-text-secondary mb-4">
            {t('andMore')}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold group cursor-pointer">
            <span>{t('exploreAll')}</span>
            <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
