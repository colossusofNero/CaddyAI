/**
 * Community Page
 * Community forum and social features
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Users,
  MessageSquare,
  Trophy,
  TrendingUp,
  Heart,
  MessageCircle,
  ThumbsUp,
  Share2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CommunityPage() {
  const posts = [
    {
      author: 'Mike Johnson',
      avatar: 'MJ',
      time: '2 hours ago',
      title: 'Finally broke 80! Thanks CaddyAI!',
      content:
        'After 3 months using CaddyAI, I shot my first 78 today. The club recommendations were spot on, especially on the par 3s. The wind adjustment feature was a game changer!',
      likes: 42,
      replies: 15,
      category: 'Success Stories',
    },
    {
      author: 'Sarah Chen',
      avatar: 'SC',
      time: '5 hours ago',
      title: 'Best courses in California?',
      content:
        'Planning a golf trip to California next month. What are your favorite courses that are well-mapped in CaddyAI? Looking for scenic views and challenging layouts.',
      likes: 28,
      replies: 34,
      category: 'Travel & Courses',
    },
    {
      author: 'Tom Anderson',
      avatar: 'TA',
      time: '1 day ago',
      title: 'Club distance calibration tips?',
      content:
        'Just started using CaddyAI and want to make sure my club distances are accurate. Should I use my maximum distance or average? Any tips for getting the best recommendations?',
      likes: 18,
      replies: 22,
      category: 'Tips & Advice',
    },
  ];

  const categories = [
    {
      icon: Trophy,
      name: 'Success Stories',
      posts: 234,
      color: 'from-gold-400 to-gold-600',
    },
    {
      icon: MessageSquare,
      name: 'Tips & Advice',
      posts: 512,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      name: 'Course Reviews',
      posts: 389,
      color: 'from-green-500 to-teal-500',
    },
    {
      icon: Users,
      name: 'Events & Meetups',
      posts: 156,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const stats = [
    { label: 'Active Members', value: '15,000+', icon: Users },
    { label: 'Discussions', value: '2,500+', icon: MessageSquare },
    { label: 'Success Stories', value: '800+', icon: Trophy },
    { label: 'Courses Reviewed', value: '1,200+', icon: TrendingUp },
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
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">CaddyAI Community</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Connect With Golfers
              <br />
              <span className="text-primary">Around The World</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Share tips, celebrate wins, and learn from fellow CaddyAI users
              in our vibrant community
            </p>

            <Button variant="primary" size="lg">
              Join the Community
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg text-center"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-text-secondary">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Popular <span className="text-primary">Categories</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Find discussions that interest you
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-text-secondary">
                    {category.posts} discussions
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Discussions */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Recent <span className="text-primary">Discussions</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join the conversation and share your golf journey
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.avatar}
                  </div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-text-primary">
                          {post.author}
                        </h4>
                        <p className="text-sm text-text-muted">{post.time}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {post.title}
                    </h3>

                    {/* Content */}
                    <p className="text-text-secondary mb-4">{post.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-6 text-text-muted">
                      <button className="flex items-center gap-2 hover:text-primary transition-colors">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {post.likes}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {post.replies}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-primary transition-colors ml-auto">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
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
              View All Discussions
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Join?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Connect with thousands of golfers, share your journey, and
              improve together
            </p>
            <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
              <Users className="w-5 h-5 mr-2" />
              Join the Community
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
