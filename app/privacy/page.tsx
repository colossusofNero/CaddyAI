/**
 * Privacy Policy Page
 * Company privacy policy and data handling practices
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Shield, Lock, Eye, Database, Clock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">Privacy Policy</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Your Privacy Matters
            </h1>

            <p className="text-lg text-text-secondary mb-4">
              Last Updated: March 15, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-lg space-y-8">
              {/* Introduction */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  Introduction
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Copperline Golf, Inc. ("we," "our," or "us") is committed to
                  protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you use our mobile application and services.
                </p>
              </div>

              {/* Information We Collect */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Database className="w-8 h-8 text-primary" />
                  Information We Collect
                </h2>
                <div className="space-y-4 text-text-secondary leading-relaxed">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Personal Information
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Name and email address</li>
                      <li>Account credentials</li>
                      <li>Profile information (handicap, club preferences)</li>
                      <li>Payment information (processed by third-party providers)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Usage Data
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Golf rounds and shot data</li>
                      <li>Club distances and performance metrics</li>
                      <li>GPS location data (only when using the app)</li>
                      <li>Device information and app usage statistics</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How We Use Your Information */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Eye className="w-8 h-8 text-primary" />
                  How We Use Your Information
                </h2>
                <div className="text-text-secondary leading-relaxed">
                  <p className="mb-4">We use the information we collect to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and improve our club recommendation services</li>
                    <li>Process your transactions and manage your account</li>
                    <li>Analyze and enhance app performance</li>
                    <li>Send you updates, newsletters, and promotional materials (with your consent)</li>
                    <li>Provide customer support and respond to your inquiries</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </div>

              {/* Data Security */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Lock className="w-8 h-8 text-primary" />
                  Data Security
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We implement industry-standard security measures to protect
                  your personal information, including encryption, secure
                  servers, and regular security audits. However, no method of
                  transmission over the Internet is 100% secure, and we cannot
                  guarantee absolute security.
                </p>
              </div>

              {/* Data Sharing */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Data Sharing and Disclosure
                </h2>
                <div className="text-text-secondary leading-relaxed">
                  <p className="mb-4">We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Service Providers:</strong> Third-party companies
                      that help us operate our services (payment processors,
                      analytics providers, cloud hosting)
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law
                      or to protect our rights and safety
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In connection with a
                      merger, acquisition, or sale of assets
                    </li>
                  </ul>
                  <p className="mt-4">
                    We do not sell your personal information to third parties.
                  </p>
                </div>
              </div>

              {/* Your Rights */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Your Privacy Rights
                </h2>
                <div className="text-text-secondary leading-relaxed">
                  <p className="mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your account and data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Export your data in a portable format</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, contact us at{' '}
                    <a
                      href="mailto:privacy@copperlinegolf.com"
                      className="text-primary hover:underline"
                    >
                      privacy@copperlinegolf.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Clock className="w-8 h-8 text-primary" />
                  Data Retention
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We retain your personal information for as long as necessary
                  to provide our services and comply with legal obligations.
                  When you delete your account, we will delete or anonymize your
                  data within 90 days, except where retention is required by law.
                </p>
              </div>

              {/* Children's Privacy */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Children's Privacy
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Our services are not intended for users under 13 years of age.
                  We do not knowingly collect personal information from children
                  under 13. If you believe we have collected information from a
                  child, please contact us immediately.
                </p>
              </div>

              {/* Changes to Policy */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of significant changes via email or through the app.
                  Your continued use of our services after changes constitutes
                  acceptance of the updated policy.
                </p>
              </div>

              {/* Contact */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Contact Us
                </h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or our data
                  practices, please contact us:
                </p>
                <div className="space-y-2 text-text-secondary">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:privacy@copperlinegolf.com"
                      className="text-primary hover:underline"
                    >
                      privacy@copperlinegolf.com
                    </a>
                  </p>
                  <p>
                    <strong>Address:</strong> Copperline Golf, Inc., 123 Golf Drive, San
                    Francisco, CA 94102
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
