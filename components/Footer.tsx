/**
 * Footer Component
 * Comprehensive footer with links, social media — localized.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fadeInUp } from '@/lib/animations';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/copperlinegolf', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/copperlinegolf', label: 'Twitter' },
  { icon: Instagram, href: 'https://www.instagram.com/copperlinegolfaz', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/copperlinegolf', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/copperlinegolf', label: 'YouTube' },
];

export function Footer() {
  const t = useTranslations('marketing.footer');
  const currentYear = new Date().getFullYear();

  const footerSections: FooterSection[] = [
    {
      title: t('sectionProduct'),
      links: [
        { label: t('linkFeatures'), href: '/features' },
        { label: t('linkPricing'), href: '/pricing' },
        { label: t('linkDownloadApp'), href: '/download' },
        { label: t('linkIntegrations'), href: '/integrations' },
      ],
    },
    {
      title: t('sectionCompany'),
      links: [
        { label: t('linkAboutUs'), href: '/about' },
        { label: t('linkCareers'), href: '/careers' },
        { label: t('linkBlog'), href: '/blog' },
        { label: t('linkPressKit'), href: '/press' },
      ],
    },
    {
      title: t('sectionResources'),
      links: [
        { label: t('linkHelpCenter'), href: '/help' },
        { label: t('linkCommunity'), href: '/community' },
        { label: t('linkTutorials'), href: '/tutorials' },
        { label: t('linkApiDocs'), href: '/docs' },
      ],
    },
    {
      title: t('sectionLegal'),
      links: [
        { label: t('linkPrivacyPolicy'), href: '/privacy' },
        { label: t('linkTermsOfService'), href: '/terms' },
        { label: t('linkCookiePolicy'), href: '/cookies' },
        { label: t('linkGdpr'), href: '/gdpr' },
      ],
    },
  ];

  return (
    <footer className="relative bg-background-light border-t border-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                <div className="relative w-10 h-10 group-hover:scale-110 transition-transform">
                  <Image
                    src="/logo.png"
                    alt="Copperline Golf Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-copper bg-clip-text text-transparent">Copperline Golf</span>
              </Link>

              <p className="text-text-secondary mb-6 max-w-sm">
                {t('brandTagline')}
              </p>

              <div className="space-y-3 text-sm text-text-secondary">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <a
                    href="mailto:support@copperlinegolf.com"
                    className="hover:text-primary transition-colors"
                  >
                    support@copperlinegolf.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <a
                    href="tel:+14809993345"
                    className="hover:text-primary transition-colors"
                  >
                    480-999-3345
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Scottsdale, AZ 85260</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-2 lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h3 className="font-bold text-text-primary mb-3 text-base">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block py-1 text-sm text-text-secondary hover:text-primary transition-colors touch-manipulation"
                        style={{ minHeight: '32px' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-secondary-700 my-8 lg:my-12" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-secondary-800 hover:bg-primary border border-secondary-700 hover:border-primary rounded-lg flex items-center justify-center transition-all group touch-manipulation"
                  aria-label={social.label}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Icon className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors" />
                </a>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center md:text-right"
          >
            <p className="text-sm text-text-muted">
              {t('copyright', { year: currentYear })}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {t('madeWith')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(5,161,70,0.05),transparent_50%)] pointer-events-none" />
    </footer>
  );
}
