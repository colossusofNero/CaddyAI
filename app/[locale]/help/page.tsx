/**
 * Help Page
 * Help center with FAQ accordion and support resources
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  HelpCircle,
  ChevronDown,
  Search,
  MessageCircle,
  Mail,
  BookOpen,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HelpPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create my profile?',
          a: 'After signing up, go to Profile Settings and enter your club distances. Copperline Golf will use this information to provide personalized recommendations. You can update your profile anytime as your game improves.',
        },
        {
          q: 'How accurate are the club recommendations?',
          a: 'Copperline Golf uses advanced algorithms that consider your club distances, real-time weather conditions, elevation changes, and shot history. Most users report 90%+ accuracy when their profile is properly calibrated.',
        },
        {
          q: 'Do I need an internet connection?',
          a: 'An internet connection is required for real-time weather data and GPS mapping. However, your profile data and basic club recommendations work offline once downloaded.',
        },
      ],
    },
    {
      category: 'Using the App',
      questions: [
        {
          q: 'How do I track a round?',
          a: 'Open the app on the course and tap "Start Round". Select your course from the GPS list, and Copperline Golf will automatically track your location and provide recommendations for each shot.',
        },
        {
          q: 'Can I edit past rounds?',
          a: 'Yes! Go to your round history, select the round you want to edit, and tap the edit icon. You can adjust scores, club selections, and add notes.',
        },
        {
          q: 'How do I share my rounds with friends?',
          a: 'After completing a round, tap the share icon on your scorecard. You can share via text, email, or social media with detailed statistics and a course map.',
        },
      ],
    },
    {
      category: 'Account & Billing',
      questions: [
        {
          q: 'What is included in the free version?',
          a: 'The free version includes basic club recommendations, shot tracking, and access to course GPS. Premium features like advanced analytics, weather radar, and unlimited course downloads require a Pro subscription.',
        },
        {
          q: 'How do I upgrade to Pro?',
          a: 'Go to Settings > Subscription and tap "Upgrade to Pro". Choose between monthly ($9.99) or annual ($79.99) billing. You can cancel anytime from your account settings.',
        },
        {
          q: 'How do I cancel my subscription?',
          a: 'For iOS: Settings > [Your Name] > Subscriptions > Copperline Golf. For Android: Play Store > Menu > Subscriptions > Copperline Golf. You can also manage subscriptions from our website.',
        },
      ],
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'The GPS is not accurate. What should I do?',
          a: 'Ensure location services are enabled for Copperline Golf in your device settings. Try restarting the app or your device. If issues persist, recalibrate your GPS by standing still for 30 seconds in an open area.',
        },
        {
          q: 'My club distances seem wrong. How do I fix this?',
          a: 'Go to Profile > Clubs and review your distance inputs. Make sure they represent your average distance, not your maximum. You can also use our calibration feature during a practice round.',
        },
        {
          q: 'The app is draining my battery. What can I do?',
          a: 'Enable battery saver mode in app settings, which reduces GPS refresh rate and background activity. Also ensure you\'re running the latest version of the app.',
        },
      ],
    },
    {
      category: 'Premium Features',
      questions: [
        {
          q: 'What is the AI Shot Advisor?',
          a: 'The AI Shot Advisor analyzes your past performance, current conditions, and course layout to suggest the optimal club and strategy for each shot. It learns from your game over time.',
        },
        {
          q: 'How does wind adjustment work?',
          a: 'Copperline Golf uses real-time wind data to calculate how wind speed and direction affect your shot distance. The recommendation automatically adjusts club selection based on these factors.',
        },
      ],
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@copperlinegolf.com',
      action: 'Send Email',
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Browse our help docs',
      action: 'View Docs',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch how-to guides',
      action: 'Watch Videos',
    },
  ];

  const filteredFAQs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        searchQuery === '' ||
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

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
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Help Center</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              How Can We
              <br />
              <span className="text-primary">Help You?</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Find answers to common questions or get in touch with our support
              team
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Get <span className="text-primary">Support</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Choose the best way to get help
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center group cursor-pointer"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                    <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {option.description}
                  </p>
                  <Button variant="ghost" size="sm">
                    {option.action}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Frequently Asked{' '}
              <span className="text-primary">Questions</span>
            </h2>
            <p className="text-lg text-text-secondary">
              Find quick answers to common questions
            </p>
          </div>

          <div className="space-y-8">
            {filteredFAQs.map((category, categoryIndex) =>
              category.questions.length > 0 ? (
                <div key={category.category}>
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.questions.map((faq, faqIndex) => {
                      const globalIndex = categoryIndex * 100 + faqIndex;
                      return (
                        <motion.div
                          key={globalIndex}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: faqIndex * 0.05 }}
                          className="bg-white rounded-xl overflow-hidden shadow-md"
                        >
                          <button
                            onClick={() =>
                              setExpandedFAQ(
                                expandedFAQ === globalIndex ? null : globalIndex
                              )
                            }
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                          >
                            <span className="text-lg font-semibold text-text-primary pr-4">
                              {faq.q}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-text-secondary flex-shrink-0 transition-transform ${
                                expandedFAQ === globalIndex
                                  ? 'transform rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                          {expandedFAQ === globalIndex && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="px-6 pb-6"
                            >
                              <p className="text-text-secondary leading-relaxed">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
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
            <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Still Need Help?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Our support team is here to help you get the most out of Copperline Golf
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
