/**
 * Blog Page
 * Blog listing with articles and insights
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function BlogPage() {
  const posts = [
    {
      title: '5 Ways AI is Revolutionizing Golf',
      excerpt:
        'Discover how artificial intelligence is transforming the game of golf, from club selection to swing analysis.',
      author: 'Sarah Johnson',
      date: 'Mar 15, 2025',
      readTime: '5 min read',
      category: 'Technology',
      image: 'bg-gradient-to-br from-primary to-accent',
    },
    {
      title: 'Understanding Wind and Weather on the Course',
      excerpt:
        'Learn how to read weather conditions and adjust your game for optimal performance in any conditions.',
      author: 'Mike Chen',
      date: 'Mar 12, 2025',
      readTime: '7 min read',
      category: 'Tips & Tricks',
      image: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    },
    {
      title: 'The Science Behind Club Selection',
      excerpt:
        'A deep dive into the physics and mathematics that power CaddyAI\'s intelligent club recommendations.',
      author: 'Dr. Emily Roberts',
      date: 'Mar 10, 2025',
      readTime: '10 min read',
      category: 'Science',
      image: 'bg-gradient-to-br from-purple-500 to-pink-500',
    },
    {
      title: 'How to Build Your Perfect Golf Profile',
      excerpt:
        'Step-by-step guide to setting up your CaddyAI profile for the most accurate recommendations.',
      author: 'Tom Anderson',
      date: 'Mar 8, 2025',
      readTime: '6 min read',
      category: 'Guides',
      image: 'bg-gradient-to-br from-orange-500 to-red-500',
    },
    {
      title: 'CaddyAI Success Stories: From 95 to 85',
      excerpt:
        'Real stories from golfers who dramatically improved their scores using CaddyAI\'s recommendations.',
      author: 'Lisa Martinez',
      date: 'Mar 5, 2025',
      readTime: '8 min read',
      category: 'Success Stories',
      image: 'bg-gradient-to-br from-green-500 to-teal-500',
    },
    {
      title: 'Course Management Strategies for Lower Scores',
      excerpt:
        'Strategic tips for managing the course and making smarter decisions from tee to green.',
      author: 'John Williams',
      date: 'Mar 1, 2025',
      readTime: '9 min read',
      category: 'Strategy',
      image: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    },
  ];

  const categories = [
    'All Posts',
    'Technology',
    'Tips & Tricks',
    'Science',
    'Guides',
    'Success Stories',
    'Strategy',
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
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-semibold">CaddyAI Blog</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Insights & Stories From
              <br />
              <span className="text-primary">The Golf Tech World</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Tips, strategies, and insights to help you get the most out of
              CaddyAI and improve your golf game.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  index === 0
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group cursor-pointer"
              >
                {/* Image */}
                <div
                  className={`h-48 ${post.image} flex items-center justify-center`}
                >
                  <BookOpen className="w-16 h-16 text-white/40" />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Category */}
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-text-secondary mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-text-muted border-t border-neutral-200 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-text-secondary">
                      {post.author}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Posts
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Never Miss an Update
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Subscribe to our newsletter for the latest tips, features, and
              golf tech insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
