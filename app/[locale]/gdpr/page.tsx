/**
 * GDPR Compliance Page
 * GDPR compliance information and data subject rights
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Shield,
  FileText,
  Download,
  Trash2,
  Edit,
  Eye,
  Lock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GDPRPage() {
  const rights = [
    {
      icon: Eye,
      title: 'Right to Access',
      description:
        'You can request a copy of all personal data we hold about you',
    },
    {
      icon: Edit,
      title: 'Right to Rectification',
      description:
        'You can request that we correct any inaccurate or incomplete data',
    },
    {
      icon: Trash2,
      title: 'Right to Erasure',
      description:
        'You can request deletion of your personal data ("right to be forgotten")',
    },
    {
      icon: Lock,
      title: 'Right to Restriction',
      description:
        'You can request that we restrict processing of your personal data',
    },
    {
      icon: Download,
      title: 'Right to Portability',
      description:
        'You can request your data in a structured, machine-readable format',
    },
    {
      icon: FileText,
      title: 'Right to Object',
      description:
        'You can object to processing of your data for specific purposes',
    },
  ];

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
              <span className="text-sm font-semibold">GDPR Compliance</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              GDPR Compliance
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary">
              Your data protection rights under the General Data Protection
              Regulation
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
                  <Globe className="w-8 h-8 text-primary" />
                  Our Commitment to GDPR
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Copperline Golf is committed to protecting the privacy and personal data
                  of all our users, including those in the European Union and
                  European Economic Area. We comply with the General Data
                  Protection Regulation (GDPR) and respect your rights as a data
                  subject.
                </p>
              </div>

              {/* Data Controller */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Data Controller Information
                </h2>
                <div className="bg-primary/5 rounded-xl p-6 text-text-secondary">
                  <p className="mb-2">
                    <strong>Data Controller:</strong> Copperline Golf, Inc.
                  </p>
                  <p className="mb-2">
                    <strong>Address:</strong> Scottsdale, AZ 85260, USA
                  </p>
                  <p className="mb-2">
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:dpo@copperlinegolf.com"
                      className="text-primary hover:underline"
                    >
                      dpo@copperlinegolf.com
                    </a>
                  </p>
                  <p>
                    <strong>EU Representative:</strong> [To be appointed if
                    required]
                  </p>
                </div>
              </div>

              {/* Legal Basis */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Legal Basis for Processing
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>We process your personal data under the following legal bases:</p>
                  <ul className="list-disc pl-6 space-y-3">
                    <li>
                      <strong>Contract Performance:</strong> To provide our
                      services and fulfill our contractual obligations
                    </li>
                    <li>
                      <strong>Legitimate Interest:</strong> To improve our
                      services, prevent fraud, and ensure security
                    </li>
                    <li>
                      <strong>Consent:</strong> For marketing communications and
                      optional features (you can withdraw consent at any time)
                    </li>
                    <li>
                      <strong>Legal Obligation:</strong> To comply with applicable
                      laws and regulations
                    </li>
                  </ul>
                </div>
              </div>

              {/* Your Rights */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Your Data Protection Rights
                </h2>
                <p className="text-text-secondary mb-6">
                  Under GDPR, you have the following rights regarding your personal
                  data:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {rights.map((right, index) => {
                    const Icon = right.icon;
                    return (
                      <motion.div
                        key={right.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-primary/5 rounded-xl p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">
                              {right.title}
                            </h3>
                            <p className="text-sm text-text-secondary">
                              {right.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* How to Exercise Rights */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  How to Exercise Your Rights
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>
                    To exercise any of your GDPR rights, you can:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Log into your Copperline Golf account and manage your data from
                      Settings
                    </li>
                    <li>
                      Email our Data Protection Officer at{' '}
                      <a
                        href="mailto:dpo@copperlinegolf.com"
                        className="text-primary hover:underline"
                      >
                        dpo@copperlinegolf.com
                      </a>
                    </li>
                    <li>Use our online data request form</li>
                  </ul>
                  <p>
                    We will respond to your request within 30 days. If your
                    request is complex, we may extend this period by an additional
                    60 days and will notify you of the extension.
                  </p>
                </div>
              </div>

              {/* Data Transfers */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  International Data Transfers
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>
                    Copperline Golf is based in the United States. When you use our
                    services, your data may be transferred to and processed in the
                    US and other countries.
                  </p>
                  <p>We protect your data during international transfers by:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Using Standard Contractual Clauses approved by the European
                      Commission
                    </li>
                    <li>
                      Ensuring adequate data protection measures are in place
                    </li>
                    <li>
                      Processing data only as necessary to provide our services
                    </li>
                  </ul>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Data Retention
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>We retain your personal data only as long as necessary:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Active Accounts:</strong> Data retained while your
                      account is active
                    </li>
                    <li>
                      <strong>Deleted Accounts:</strong> Data deleted within 90
                      days of account deletion
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> Some data may be
                      retained longer to comply with legal obligations
                    </li>
                  </ul>
                </div>
              </div>

              {/* Automated Decision Making */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Automated Decision-Making
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Copperline Golf uses AI algorithms to provide club recommendations.
                  These automated decisions do not have legal or similarly
                  significant effects on you. You always have the option to
                  override AI recommendations and make your own club selection
                  decisions.
                </p>
              </div>

              {/* Data Breach */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Data Breach Notification
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  In the unlikely event of a data breach that affects your
                  personal data, we will notify you and the relevant supervisory
                  authority within 72 hours of becoming aware of the breach, as
                  required by GDPR.
                </p>
              </div>

              {/* Supervisory Authority */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">
                  Right to Lodge a Complaint
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  If you believe we have not handled your personal data in
                  accordance with GDPR, you have the right to lodge a complaint
                  with your local supervisory authority. For EU residents, you can
                  find your supervisory authority at{' '}
                  <a
                    href="https://edpb.europa.eu/about-edpb/board/members_en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    edpb.europa.eu
                  </a>
                  .
                </p>
              </div>

              {/* Contact & Action */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Exercise Your Rights
                </h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                  Have questions about your data or want to exercise your GDPR
                  rights? Contact our Data Protection Officer:
                </p>
                <div className="space-y-4">
                  <div className="space-y-2 text-text-secondary">
                    <p>
                      <strong>Email:</strong>{' '}
                      <a
                        href="mailto:dpo@copperlinegolf.com"
                        className="text-primary hover:underline"
                      >
                        dpo@copperlinegolf.com
                      </a>
                    </p>
                    <p>
                      <strong>Address:</strong> Data Protection Officer, Copperline Golf,
                      Inc., Scottsdale, AZ 85260, USA
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="primary" size="lg">
                      <FileText className="w-5 h-5 mr-2" />
                      Submit Data Request
                    </Button>
                    <Button variant="outline" size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      Download My Data
                    </Button>
                  </div>
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
