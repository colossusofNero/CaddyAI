/**
 * Tutorials Page
 * Video tutorials and how-to guides
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Video,
  Play,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Settings,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TutorialsPage() {
  const videos = [
    {
      title: 'Getting Started with CaddyAI',
      description:
        'A complete walkthrough for new users covering setup, profile creation, and your first round',
      duration: '12:34',
      category: 'Getting Started',
      thumbnail: 'bg-gradient-to-br from-primary to-accent',
      difficulty: 'Beginner',
    },
    {
      title: 'Setting Up Your Club Profile',
      description:
        'Learn how to accurately input your club distances and calibrate them for optimal recommendations',
      duration: '8:45',
      category: 'Setup',
      thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      difficulty: 'Beginner',
    },
    {
      title: 'Understanding Club Recommendations',
      description:
        'Deep dive into how CaddyAI calculates recommendations based on conditions and your swing profile',
      duration: '15:20',
      category: 'Features',
      thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-500',
      difficulty: 'Intermediate',
    },
    {
      title: 'Using GPS & Course Mapping',
      description:
        'Master the GPS features including distance measurement, hazard identification, and green reading',
      duration: '10:15',
      category: 'Features',
      thumbnail: 'bg-gradient-to-br from-green-500 to-teal-500',
      difficulty: 'Beginner',
    },
    {
      title: 'Advanced Shot Tracking',
      description:
        'Track your shots like a pro, analyze patterns, and use data to improve your game',
      duration: '18:30',
      category: 'Advanced',
      thumbnail: 'bg-gradient-to-br from-orange-500 to-red-500',
      difficulty: 'Advanced',
    },
    {
      title: 'Weather & Wind Adjustments',
      description:
        'Learn how to read and adjust for weather conditions to make smarter club selections',
      duration: '13:42',
      category: 'Tips',
      thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      difficulty: 'Intermediate',
    },
  ];

  const categories = [
    { name: 'All Videos', count: 24, icon: Video },
    { name: 'Getting Started', count: 6, icon: BookOpen },
    { name: 'Features', count: 8, icon: Target },
    { name: 'Advanced', count: 5, icon: TrendingUp },
    { name: 'Tips & Tricks', count: 5, icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Video className="w-4 h-4" />
              <span className="text-sm font-semibold">Video Tutorials</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Learn To Master
              <br />
              <span className="text-primary">CaddyAI</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Step-by-step video guides to help you get the most out of CaddyAI
              and improve your golf game
            </p>

            <Button variant="primary" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Start Learning
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    index === 0
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {category.name} ({category.count})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group cursor-pointer"
              >
                {/* Thumbnail */}
                <div
                  className={`relative h-48 ${video.thumbnail} flex items-center justify-center`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="relative w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                      {video.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        video.difficulty === 'Beginner'
                          ? 'bg-green-100 text-green-700'
                          : video.difficulty === 'Intermediate'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {video.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>

                  <p className="text-sm text-text-secondary line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Videos
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Recommended <span className="text-primary">Learning Path</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Follow this path to become a CaddyAI expert
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                step: 1,
                title: 'Getting Started',
                description: 'Learn the basics and set up your profile',
                duration: '30 min',
              },
              {
                step: 2,
                title: 'Core Features',
                description:
                  'Master GPS, shot tracking, and club recommendations',
                duration: '45 min',
              },
              {
                step: 3,
                title: 'Advanced Techniques',
                description: 'Wind adjustments, course strategy, and analytics',
                duration: '60 min',
              },
              {
                step: 4,
                title: 'Pro Tips',
                description:
                  'Expert strategies and optimization for competitive play',
                duration: '40 min',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{item.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-primary-600 rounded-3xl p-8 lg:p-12 text-center text-white shadow-2xl"
          >
            <Video className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Have a Question?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Can't find what you're looking for? Request a tutorial or reach
              out to our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                Request Tutorial
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
