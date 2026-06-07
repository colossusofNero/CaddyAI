/**
 * Cookie Policy Page
 * Information about how Copperline Golf uses cookies
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Cookie, Settings, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CookiesPage() {
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
              <Cookie className="w-4 h-4" />
              <span className="text-sm font-semibold">Cookie Policy</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Cookie Policy
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
              {/* What Are Cookies */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Cookie className="w-8 h-8 text-primary" />
                  What Are Cookies?
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Cookies are small text files that are placed on your device
                  when you visit our website or use our mobile application.
                  Cookies help us provide you with a better experience by
                  remembering your preferences, understanding how you use our
                  services, and improving functionality.
                </p>
              </div>

              {/* Types of Cookies */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Types of Cookies We Use
                </h2>
                <div className="space-y-6">
                  {/* Essential Cookies */}
                  <div className="bg-primary/5 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                          Essential Cookies
                        </h3>
                        <p className="text-text-secondary mb-3">
                          These cookies are necessary for the website to function
                          and cannot be disabled. They enable core functionality
                          such as security, authentication, and accessibility.
                        </p>
                        <p className="text-sm text-text-muted">
                          Examples: Session cookies, security tokens, load
                          balancing
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Cookies */}
                  <div className="bg-primary/5 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                          Performance & Analytics Cookies
                        </h3>
                        <p className="text-text-secondary mb-3">
                          These cookies help us understand how visitors interact
                          with our website by collecting and reporting information
                          anonymously. We use this data to improve our services.
                        </p>
                        <p className="text-sm text-text-muted">
                          Examples: Google Analytics, page views, error tracking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="bg-primary/5 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                          Functional Cookies
                        </h3>
                        <p className="text-text-secondary mb-3">
                          These cookies enable enhanced functionality and
                          personalization, such as remembering your preferences
                          and settings.
                        </p>
                        <p className="text-sm text-text-muted">
                          Examples: Language preferences, theme selection, user
                          settings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third-Party Cookies */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Third-Party Cookies
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>
                    We use third-party services that may set cookies on your
                    device. These include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Google Analytics:</strong> To analyze website
                      traffic and user behavior
                    </li>
                    <li>
                      <strong>Stripe:</strong> For payment processing (only when
                      making payments)
                    </li>
                    <li>
                      <strong>Social Media Platforms:</strong> For social sharing
                      features
                    </li>
                  </ul>
                  <p>
                    These third parties have their own privacy policies and cookie
                    policies, which we encourage you to review.
                  </p>
                </div>
              </div>

              {/* How Long Cookies Last */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  How Long Do Cookies Last?
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>Cookies can be either:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Session Cookies:</strong> Temporary cookies that
                      expire when you close your browser
                    </li>
                    <li>
                      <strong>Persistent Cookies:</strong> Remain on your device
                      for a set period (typically 1-24 months) or until you
                      delete them
                    </li>
                  </ul>
                </div>
              </div>

              {/* Managing Cookies */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary" />
                  Managing Your Cookie Preferences
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>You have several options to manage cookies:</p>

                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Browser Settings
                    </h3>
                    <p className="mb-2">
                      Most browsers allow you to control cookies through their
                      settings:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Chrome: Settings → Privacy and security → Cookies</li>
                      <li>Firefox: Preferences → Privacy & Security</li>
                      <li>Safari: Preferences → Privacy</li>
                      <li>Edge: Settings → Cookies and site permissions</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Mobile Devices
                    </h3>
                    <p className="mb-2">
                      On mobile devices, you can manage app tracking through:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>iOS: Settings → Privacy → Tracking</li>
                      <li>Android: Settings → Google → Ads</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <p className="text-sm">
                      <strong>Note:</strong> Disabling certain cookies may affect
                      the functionality of our website and your user experience.
                      Essential cookies cannot be disabled as they are necessary
                      for the site to function.
                    </p>
                  </div>
                </div>
              </div>

              {/* Do Not Track */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Do Not Track Signals
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Some browsers include a "Do Not Track" (DNT) feature that
                  signals websites you visit that you do not want to have your
                  online activity tracked. We currently do not respond to DNT
                  signals, but we provide you with choices about data collection
                  and use through our cookie preferences and privacy settings.
                </p>
              </div>

              {/* Updates */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Updates to This Policy
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect
                  changes in our practices or for legal reasons. We will notify
                  you of any significant changes by posting the new policy on this
                  page with an updated "Last Updated" date.
                </p>
              </div>

              {/* Contact & Preferences */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Questions or Preferences?
                </h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                  If you have questions about our use of cookies or want to update
                  your preferences, please contact us:
                </p>
                <div className="space-y-4">
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
                      <strong>Address:</strong> Copperline Golf, Inc.,
                      Scottsdale, AZ 85260
                    </p>
                  </div>
                  <Button variant="primary" size="lg">
                    <Settings className="w-5 h-5 mr-2" />
                    Manage Cookie Preferences
                  </Button>
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
