/**
 * Footer Component
 * Comprehensive footer with links, social media, and newsletter signup
 */

'use client';

import Link from 'next/link';
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
import { fadeInUp } from '@/lib/animations';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Download App', href: '/download' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press Kit', href: '/press' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'API Docs', href: '/docs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/caddyai', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/caddyai', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/caddyai', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/caddyai', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/caddyai', label: 'YouTube' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-background-light border-t border-secondary-700">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo */}
              <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold text-primary">CaddyAI</span>
              </Link>

              <p className="text-text-secondary mb-6 max-w-sm">
                Your intelligent golf companion for smarter shot decisions.
                Powered by AI to help you play your best game.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 text-sm text-text-secondary">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <a
                    href="mailto:support@caddyai.com"
                    className="hover:text-primary transition-colors"
                  >
                    support@caddyai.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <a
                    href="tel:+18005551234"
                    className="hover:text-primary transition-colors"
                  >
                    1-800-555-1234
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>San Francisco, CA 94102</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h3 className="font-bold text-text-primary mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-text-secondary hover:text-primary transition-colors"
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

        {/* Divider */}
        <div className="border-t border-secondary-700 my-8 lg:my-12" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Links */}
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
                  className="w-10 h-10 bg-secondary-800 hover:bg-primary border border-secondary-700 hover:border-primary rounded-lg flex items-center justify-center transition-all group"
                  aria-label={social.label}
                >
                  <Icon className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors" />
                </a>
              );
            })}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center md:text-right"
          >
            <p className="text-sm text-text-muted">
              &copy; {currentYear} CaddyAI, Inc. All rights reserved.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Made with ❤️ for golfers everywhere
            </p>
          </motion.div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(5,161,70,0.05),transparent_50%)] pointer-events-none" />
    </footer>
  );
}
