/**
 * Contact Page
 * Contact form, information, and social links — localized.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { firebaseService } from '@/services/firebaseService';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const t = useTranslations('marketing.contact');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('form.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('form.errors.nameTooShort');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('form.errors.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('form.errors.emailInvalid');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('form.errors.subjectRequired');
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = t('form.errors.subjectTooShort');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('form.errors.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('form.errors.messageTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await firebaseService.submitContactForm({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      const googleSheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
      if (googleSheetsUrl) {
        try {
          await fetch(googleSheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              subject: formData.subject,
              message: formData.message,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (sheetsError) {
          console.error('Error submitting to Google Sheets:', sheetsError);
        }
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('info.emailTitle'),
      content: 'support@copperlinegolf.com',
      link: 'mailto:support@copperlinegolf.com',
    },
    {
      icon: Phone,
      title: t('info.phoneTitle'),
      content: '480-999-3345',
      link: 'tel:+14809993345',
    },
    {
      icon: MapPin,
      title: t('info.officeTitle'),
      content: t('info.office'),
      link: null,
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/copperlinegolf', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/copperlinegolf', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/copperlinegolf', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/copperlinegolf', label: 'LinkedIn' },
  ];

  useEffect(() => {
    document.title = t('meta.title');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'));
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background-light to-background" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-6"
            >
              <MessageSquare className="w-8 h-8 text-primary" />
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
            >
              {t('hero.titleStart')}{' '}
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary max-w-3xl mx-auto"
            >
              {t('hero.subtitle')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              const content = info.link ? (
                <a
                  href={info.link}
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  {info.content}
                </a>
              ) : (
                <span className="text-text-secondary">{info.content}</span>
              );

              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {info.title}
                  </h3>
                  {content}
                </motion.div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 sm:p-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                  {t('form.heading')}
                </h2>
                <p className="text-text-secondary mb-6">{t('form.subheading')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      {t('form.nameLabel')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.name ? 'border-error focus:ring-error' : 'border-secondary-700'
                      }`}
                      placeholder={t('form.namePlaceholder')}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      {t('form.emailLabel')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.email ? 'border-error focus:ring-error' : 'border-secondary-700'
                      }`}
                      placeholder={t('form.emailPlaceholder')}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      {t('form.subjectLabel')} *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.subject ? 'border-error focus:ring-error' : 'border-secondary-700'
                      }`}
                      placeholder={t('form.subjectPlaceholder')}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-error flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      {t('form.messageLabel')} *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none ${
                        errors.message ? 'border-error focus:ring-error' : 'border-secondary-700'
                      }`}
                      placeholder={t('form.messagePlaceholder')}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-error flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('form.submit')}
                      </>
                    )}
                  </button>

                  {/* Success/Error Messages */}
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 bg-success/20 border border-success rounded-xl text-success"
                    >
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{t('form.successMessage')}</span>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 bg-error/20 border border-error rounded-xl text-error"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{t('form.errorMessage')}</span>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>

            {/* Additional Info & Social */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Office Hours */}
              <div className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  {t('hours.heading')}
                </h3>
                <div className="space-y-3 text-text-secondary">
                  <div className="flex justify-between">
                    <span>{t('hours.weekdaysLabel')}</span>
                    <span className="font-medium text-text-primary">
                      {t('hours.weekdays')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('hours.saturdayLabel')}</span>
                    <span className="font-medium text-text-primary">
                      {t('hours.saturday')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('hours.sundayLabel')}</span>
                    <span className="font-medium text-text-primary">
                      {t('hours.sunday')}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-text-muted">{t('hours.responseNote')}</p>
              </div>

              {/* Social Media */}
              <div className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  {t('social.heading')}
                </h3>
                <p className="text-text-secondary mb-6">{t('social.body')}</p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 bg-secondary-800 hover:bg-primary border border-secondary-700 hover:border-primary rounded-xl flex items-center justify-center transition-all group"
                        aria-label={social.label}
                      >
                        <Icon className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* FAQ Link */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {t('faq.heading')}
                </h3>
                <p className="text-text-secondary mb-4">{t('faq.body')}</p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-semibold transition-colors"
                >
                  {t('faq.cta')}
                  <span className="text-xl">→</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
