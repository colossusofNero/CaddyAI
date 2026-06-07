/**
 * Press Page
 * Press kit, media resources, and company information
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  FileText,
  Download,
  Image,
  Mail,
  Award,
  Newspaper,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PressPage() {
  const pressReleases = [
    {
      title: 'Copperline Golf Reaches 100,000 Active Users Milestone',
      date: 'March 15, 2025',
      excerpt:
        'Golf tech startup Copperline Golf announces major growth milestone as golfers embrace AI-powered club recommendations.',
    },
    {
      title: 'Copperline Golf Raises $10M Series A Funding',
      date: 'February 20, 2025',
      excerpt:
        'Leading venture capital firms invest in Copperline Golf to accelerate product development and market expansion.',
    },
    {
      title: 'Copperline Golf Launches Apple Watch Integration',
      date: 'January 10, 2025',
      excerpt:
        'New Apple Watch app brings club recommendations directly to golfers\' wrists for seamless on-course experience.',
    },
  ];

  const mediaAssets = [
    {
      title: 'Company Logo Pack',
      description: 'High-resolution logos in multiple formats (PNG, SVG, EPS)',
      icon: Image,
      size: '2.4 MB',
    },
    {
      title: 'Product Screenshots',
      description: 'App screenshots and UI mockups for editorial use',
      icon: Image,
      size: '8.7 MB',
    },
    {
      title: 'Brand Guidelines',
      description: 'Complete brand style guide and usage guidelines',
      icon: FileText,
      size: '1.2 MB',
    },
    {
      title: 'Executive Photos',
      description: 'High-resolution photos of company leadership',
      icon: Image,
      size: '5.3 MB',
    },
  ];

  const coverage = [
    {
      publication: 'TechCrunch',
      title: 'Copperline Golf is bringing AI to the golf course',
      date: 'March 2025',
    },
    {
      publication: 'Golf Digest',
      title: 'The future of golf technology is here',
      date: 'February 2025',
    },
    {
      publication: 'The Verge',
      title: 'How AI is changing the way we play golf',
      date: 'January 2025',
    },
    {
      publication: 'Forbes',
      title: 'Golf tech startup raises millions to expand',
      date: 'December 2024',
    },
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
              <Newspaper className="w-4 h-4" />
              <span className="text-sm font-semibold">Press & Media</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Copperline Golf In The
              <br />
              <span className="text-primary">News</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Media resources, press releases, and company information for
              journalists and content creators.
            </p>

            <Button variant="primary" size="lg">
              <Mail className="w-5 h-5 mr-2" />
              Contact Press Team
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Latest <span className="text-primary">Press Releases</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Stay up to date with Copperline Golf news and announcements
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {pressReleases.map((release, index) => (
              <motion.div
                key={release.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-text-muted mb-2">
                      {release.date}
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                      {release.title}
                    </h3>
                    <p className="text-text-secondary">{release.excerpt}</p>
                  </div>
                  <Button variant="outline" size="sm" className="lg:flex-shrink-0">
                    Read More
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Assets */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Media <span className="text-primary">Assets</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Download high-quality assets for your stories and articles
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {mediaAssets.map((asset, index) => {
              const Icon = asset.icon;
              return (
                <motion.div
                  key={asset.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-primary mb-2">
                        {asset.title}
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">
                        {asset.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {asset.size}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Media <span className="text-primary">Coverage</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Featured in leading technology and golf publications
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {coverage.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-primary mb-2">
                      {item.publication}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-sm text-text-muted">{item.date}</div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <Mail className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Media Inquiries
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              For press inquiries, interview requests, or more information about
              Copperline Golf
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:press@copperlinegolf.com">
                <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                  <Mail className="w-5 h-5 mr-2" />
                  press@copperlinegolf.com
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
