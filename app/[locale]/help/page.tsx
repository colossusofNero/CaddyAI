/**
 * Help Page
 * Help center with FAQ accordion and support resources — localized.
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
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function HelpPage() {
  const t = useTranslations('marketing.help');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: t('faq.catGettingStarted'),
      questions: [
        { q: t('faq.gs1q'), a: t('faq.gs1a') },
        { q: t('faq.gs2q'), a: t('faq.gs2a') },
        { q: t('faq.gs3q'), a: t('faq.gs3a') },
      ],
    },
    {
      category: t('faq.catUsing'),
      questions: [
        { q: t('faq.u1q'), a: t('faq.u1a') },
        { q: t('faq.u2q'), a: t('faq.u2a') },
        { q: t('faq.u3q'), a: t('faq.u3a') },
      ],
    },
    {
      category: t('faq.catBilling'),
      questions: [
        { q: t('faq.b1q'), a: t('faq.b1a') },
        { q: t('faq.b2q'), a: t('faq.b2a') },
        { q: t('faq.b3q'), a: t('faq.b3a') },
      ],
    },
    {
      category: t('faq.catTrouble'),
      questions: [
        { q: t('faq.t1q'), a: t('faq.t1a') },
        { q: t('faq.t2q'), a: t('faq.t2a') },
        { q: t('faq.t3q'), a: t('faq.t3a') },
      ],
    },
    {
      category: t('faq.catPremium'),
      questions: [
        { q: t('faq.p1q'), a: t('faq.p1a') },
        { q: t('faq.p2q'), a: t('faq.p2a') },
      ],
    },
  ];

  const supportOptions = [
    { icon: MessageCircle, title: t('support.liveChatTitle'), description: t('support.liveChatDesc'), action: t('support.liveChatAction') },
    { icon: Mail, title: t('support.emailTitle'), description: t('support.emailDesc'), action: t('support.emailAction') },
    { icon: BookOpen, title: t('support.docsTitle'), description: t('support.docsDesc'), action: t('support.docsAction') },
    { icon: Video, title: t('support.videoTitle'), description: t('support.videoDesc'), action: t('support.videoAction') },
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
              <span className="text-sm font-semibold">{t('hero.badge')}</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              {t('hero.titleStart')}
              <br />
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              {t('hero.subtitle')}
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder={t('hero.searchPlaceholder')}
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
              {t('support.headingStart')} <span className="text-primary">{t('support.headingHighlight')}</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t('support.subheading')}
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
              {t('faq.headingStart')} <span className="text-primary">{t('faq.headingHighlight')}</span>
            </h2>
            <p className="text-lg text-text-secondary">
              {t('faq.subheading')}
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
                            onClick={() => setExpandedFAQ(expandedFAQ === globalIndex ? null : globalIndex)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                          >
                            <span className="text-lg font-semibold text-text-primary pr-4">
                              {faq.q}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-text-secondary flex-shrink-0 transition-transform ${
                                expandedFAQ === globalIndex ? 'transform rotate-180' : ''
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
              {t('cta.heading')}
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('cta.liveChatButton')}
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Mail className="w-5 h-5 mr-2" />
                {t('cta.emailButton')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
