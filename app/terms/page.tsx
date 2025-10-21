/**
 * Terms of Service Page
 * Legal terms and conditions for using CaddyAI
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { FileText, AlertCircle, Scale, UserCheck } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">Terms of Service</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Terms of Service
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
              {/* Acceptance */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-primary" />
                  Acceptance of Terms
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  By accessing or using CaddyAI's mobile application and
                  services (collectively, the "Service"), you agree to be bound
                  by these Terms of Service ("Terms"). If you do not agree to
                  these Terms, do not use the Service.
                </p>
              </div>

              {/* Description of Service */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Description of Service
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  CaddyAI provides an AI-powered golf assistance application
                  that offers club recommendations, shot tracking, GPS mapping,
                  weather data, and performance analytics. The Service is
                  intended to assist golfers in making informed decisions but
                  should not replace personal judgment or professional coaching.
                </p>
              </div>

              {/* User Accounts */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  User Accounts
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>To use certain features, you must create an account. You agree to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate and complete registration information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Be responsible for all activities under your account</li>
                    <li>Not share your account with others</li>
                  </ul>
                  <p>
                    You must be at least 13 years old to create an account. Users
                    under 18 must have parental consent.
                  </p>
                </div>
              </div>

              {/* Acceptable Use */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Scale className="w-8 h-8 text-primary" />
                  Acceptable Use Policy
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Service for any illegal or unauthorized purpose</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt the Service</li>
                    <li>Upload viruses or malicious code</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Collect or harvest user data without permission</li>
                    <li>Reverse engineer or decompile the application</li>
                    <li>Use automated scripts or bots</li>
                  </ul>
                </div>
              </div>

              {/* Subscription & Payment */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Subscription and Payment
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>
                    CaddyAI offers both free and paid subscription plans ("Pro").
                    By subscribing to a paid plan:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You authorize recurring billing to your payment method</li>
                    <li>Subscriptions auto-renew unless cancelled</li>
                    <li>Prices are subject to change with 30 days' notice</li>
                    <li>Refunds are provided according to our refund policy</li>
                    <li>You can cancel anytime from your account settings</li>
                  </ul>
                </div>
              </div>

              {/* Intellectual Property */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Intellectual Property Rights
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  The Service, including all content, features, and
                  functionality, is owned by CaddyAI, Inc. and is protected by
                  copyright, trademark, and other intellectual property laws. You
                  are granted a limited, non-exclusive, non-transferable license
                  to use the Service for personal, non-commercial purposes.
                </p>
              </div>

              {/* User Content */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  User-Generated Content
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  You retain ownership of any content you submit to the Service
                  (rounds, comments, reviews). By submitting content, you grant
                  CaddyAI a worldwide, non-exclusive, royalty-free license to
                  use, display, and distribute your content in connection with
                  the Service. You represent that you have all necessary rights
                  to grant this license.
                </p>
              </div>

              {/* Disclaimer */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-primary" />
                  Disclaimer of Warranties
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-text-secondary leading-relaxed">
                  <p className="mb-4">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                    WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. CADDYAI DISCLAIMS
                    ALL WARRANTIES, INCLUDING:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Accuracy of club recommendations or data</li>
                    <li>Uninterrupted or error-free operation</li>
                    <li>Fitness for a particular purpose</li>
                  </ul>
                  <p className="mt-4">
                    Always use your best judgment when making golf decisions. GPS
                    and weather data may not be 100% accurate.
                  </p>
                </div>
              </div>

              {/* Limitation of Liability */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  To the maximum extent permitted by law, CaddyAI shall not be
                  liable for any indirect, incidental, special, consequential, or
                  punitive damages, including loss of profits, data, or goodwill,
                  arising from your use of the Service. Our total liability shall
                  not exceed the amount you paid to us in the past 12 months.
                </p>
              </div>

              {/* Indemnification */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Indemnification
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  You agree to indemnify and hold harmless CaddyAI, its officers,
                  directors, employees, and agents from any claims, damages,
                  losses, liabilities, and expenses arising from your use of the
                  Service or violation of these Terms.
                </p>
              </div>

              {/* Termination */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Termination
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We may suspend or terminate your account at any time for
                  violation of these Terms or for any other reason. Upon
                  termination, your right to use the Service will immediately
                  cease. You may terminate your account at any time from your
                  account settings.
                </p>
              </div>

              {/* Governing Law */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Governing Law and Disputes
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  These Terms are governed by the laws of the State of California,
                  without regard to conflict of law principles. Any disputes shall
                  be resolved through binding arbitration in San Francisco,
                  California, except for claims that may be brought in small
                  claims court.
                </p>
              </div>

              {/* Changes to Terms */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Changes to These Terms
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will
                  notify you of material changes via email or through the app.
                  Your continued use of the Service after changes constitutes
                  acceptance of the updated Terms.
                </p>
              </div>

              {/* Contact */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Contact Us
                </h2>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Questions about these Terms? Contact us at:
                </p>
                <div className="space-y-2 text-text-secondary">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:legal@caddyai.com"
                      className="text-primary hover:underline"
                    >
                      legal@caddyai.com
                    </a>
                  </p>
                  <p>
                    <strong>Address:</strong> CaddyAI, Inc., 123 Golf Drive, San
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
