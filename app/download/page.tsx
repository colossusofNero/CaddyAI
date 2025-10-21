'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  DownloadButton,
  detectPlatform,
} from '@/components/download/DownloadButton';
import { ScreenshotCarousel } from '@/components/download/ScreenshotCarousel';
import {
  Smartphone,
  Target,
  Cloud,
  BarChart3,
  Map,
  TrendingUp,
  Zap,
  Star,
  Users,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

export default function DownloadPage() {
  const [userPlatform, setUserPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    setUserPlatform(detectPlatform());
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Smart Club Selection',
      description: 'AI-powered recommendations based on distance, conditions, and your swing profile',
    },
    {
      icon: Cloud,
      title: 'Real-time Weather',
      description: 'Live wind, temperature, and humidity data for every shot',
    },
    {
      icon: Map,
      title: 'GPS Course Maps',
      description: 'Detailed hole layouts with accurate distance measurements',
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Comprehensive statistics to analyze and improve your game',
    },
    {
      icon: TrendingUp,
      title: 'Progress Insights',
      description: 'AI-generated insights showing how your game is improving',
    },
    {
      icon: Zap,
      title: 'Shot Tracking',
      description: 'Automatic shot detection and club performance analysis',
    },
  ];

  const requirements = [
    {
      platform: 'iOS',
      items: [
        'iPhone or iPad',
        'iOS 14.0 or later',
        'Location services enabled',
        '50 MB storage space',
      ],
    },
    {
      platform: 'Android',
      items: [
        'Android phone or tablet',
        'Android 8.0 (Oreo) or later',
        'Location services enabled',
        '50 MB storage space',
      ],
    },
  ];

  const faqs = [
    {
      question: 'Is CaddyAI free to download?',
      answer: 'Yes! CaddyAI is free to download and includes basic features. Premium features are available with our Pro subscription.',
    },
    {
      question: 'Does the app work offline?',
      answer: 'CaddyAI requires an internet connection for real-time weather data and GPS course maps. However, your personal club data and basic recommendations work offline.',
    },
    {
      question: 'How much battery does the app use?',
      answer: 'CaddyAI is optimized for battery efficiency. On average, it uses about 10-15% battery during an 18-hole round with GPS and weather tracking enabled.',
    },
    {
      question: 'Can I use it on Apple Watch or Android Wear?',
      answer: 'Apple Watch support is coming soon! Android Wear support is planned for a future release.',
    },
    {
      question: 'How do I transfer my data to a new device?',
      answer: 'All your data is automatically synced to the cloud. Simply log in to your account on your new device and everything will be there.',
    },
    {
      question: 'What courses are supported?',
      answer: 'CaddyAI supports over 35,000 courses worldwide with detailed GPS mapping. If your course isn\'t listed, you can request it to be added.',
    },
  ];

  const stats = [
    { value: '4.8', label: 'App Store Rating', icon: Star },
    { value: '50K+', label: 'Downloads', icon: Users },
    { value: '1M+', label: 'Rounds Tracked', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background-light"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl lg:text-7xl font-bold text-neutral-900 mb-6">
                Download
                <br />
                <span className="text-primary">CaddyAI</span>
              </h1>
              <p className="text-xl lg:text-2xl text-neutral-700 mb-8 leading-relaxed">
                Your AI-powered golf caddy is ready to transform your game.
                Available now on iOS and Android.
              </p>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <DownloadButton platform="ios" showQR={userPlatform === 'desktop'} />
                <DownloadButton
                  platform="android"
                  showQR={userPlatform === 'desktop'}
                />
              </div>

              {/* Smart Platform Message */}
              {userPlatform !== 'desktop' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-3 rounded-xl"
                >
                  <Smartphone className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {userPlatform === 'ios'
                      ? 'We detected you\'re on iOS - tap the App Store button above!'
                      : 'We detected you\'re on Android - tap the Google Play button above!'}
                  </p>
                </motion.div>
              )}

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-neutral-200">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <p className="text-3xl font-bold text-neutral-900">
                        {stat.value}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column - App Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                {/* Phone Frame */}
                <div className="relative mx-auto w-full max-w-sm">
                  <div className="relative bg-neutral-900 rounded-[3rem] p-4 shadow-2xl">
                    <div className="relative bg-white rounded-[2.5rem] overflow-hidden">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-3xl z-10"></div>

                      {/* App Content */}
                      <div className="relative aspect-[9/19.5] bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                          <div className="w-24 h-24 bg-primary rounded-3xl mb-6 flex items-center justify-center shadow-xl">
                            <Target className="w-12 h-12 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                            CaddyAI
                          </h3>
                          <p className="text-sm text-neutral-600 text-center">
                            Your AI Golf Caddy
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl p-4"
                  >
                    <Cloud className="w-8 h-8 text-primary" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-4"
                  >
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              Powerful Features
              <br />
              in Your Pocket
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-neutral-700 max-w-3xl mx-auto"
            >
              Everything you need to play smarter golf, all in one app
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-neutral-50 to-white p-8 rounded-2xl border border-neutral-200 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background-light to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              See It in Action
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-neutral-700 max-w-3xl mx-auto"
            >
              Explore the beautiful, intuitive interface designed for golfers
            </motion.p>
          </div>

          <ScreenshotCarousel />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              Get Started in Minutes
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '1',
                title: 'Download & Install',
                description:
                  'Get CaddyAI from the App Store or Google Play. Installation takes less than a minute.',
              },
              {
                step: '2',
                title: 'Set Up Your Profile',
                description:
                  'Add your clubs and distances. Our AI will learn and adapt to your unique game.',
              },
              {
                step: '3',
                title: 'Start Playing',
                description:
                  'Hit the course and get instant recommendations for every shot. It\'s that simple!',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                  <span className="text-3xl font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-700 text-lg">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-background-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              System Requirements
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {requirements.map((req, index) => (
              <motion.div
                key={req.platform}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  {req.platform}
                </h3>
                <ul className="space-y-4">
                  {req.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-neutral-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-neutral-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-600 flex-shrink-0 transition-transform ${
                      expandedFAQ === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-neutral-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Game?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of golfers who are already playing smarter with CaddyAI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <DownloadButton
                platform="ios"
                variant="secondary"
                showQR={userPlatform === 'desktop'}
              />
              <DownloadButton
                platform="android"
                variant="secondary"
                showQR={userPlatform === 'desktop'}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
