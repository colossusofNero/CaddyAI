/**
 * Contact Page
 * Contact form, information, and social links
 */

'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Success
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'support@caddyai.com',
      link: 'mailto:support@caddyai.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '1-800-555-1234',
      link: 'tel:+18005551234',
    },
    {
      icon: MapPin,
      title: 'Office',
      content: 'San Francisco, CA 94102',
      link: null,
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: 'https://facebook.com/caddyai',
      label: 'Facebook',
    },
    {
      icon: Twitter,
      href: 'https://twitter.com/caddyai',
      label: 'Twitter',
    },
    {
      icon: Instagram,
      href: 'https://instagram.com/caddyai',
      label: 'Instagram',
    },
    {
      icon: Linkedin,
      href: 'https://linkedin.com/company/caddyai',
      label: 'LinkedIn',
    },
  ];

  // Set page title and meta tags
  useEffect(() => {
    document.title = 'Contact Us | CaddyAI - Get in Touch';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Contact CaddyAI support team. Get help with your golf caddy app, send feedback, or inquire about our AI-powered golf recommendations.'
      );
    }
  }, []);

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
              Get in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-400">
                Touch
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary max-w-3xl mx-auto"
            >
              Have a question or feedback? We'd love to hear from you. Our team is
              here to help you get the most out of CaddyAI.
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
                  Send Us a Message
                </h2>
                <p className="text-text-secondary mb-6">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.name
                          ? 'border-error focus:ring-error'
                          : 'border-secondary-700'
                      }`}
                      placeholder="Your name"
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
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.email
                          ? 'border-error focus:ring-error'
                          : 'border-secondary-700'
                      }`}
                      placeholder="your.email@example.com"
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
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.subject
                          ? 'border-error focus:ring-error'
                          : 'border-secondary-700'
                      }`}
                      placeholder="How can we help?"
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
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 bg-background-muted border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none ${
                        errors.message
                          ? 'border-error focus:ring-error'
                          : 'border-secondary-700'
                      }`}
                      placeholder="Tell us more about your inquiry..."
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
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
                      <span>
                        Message sent successfully! We'll get back to you soon.
                      </span>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 bg-error/20 border border-error rounded-xl text-error"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>
                        Failed to send message. Please try again or email us directly.
                      </span>
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
                  Office Hours
                </h3>
                <div className="space-y-3 text-text-secondary">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium text-text-primary">
                      9:00 AM - 6:00 PM PST
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium text-text-primary">
                      10:00 AM - 4:00 PM PST
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-text-primary">Closed</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-text-muted">
                  We typically respond to all inquiries within 24 hours during
                  business days.
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  Connect With Us
                </h3>
                <p className="text-text-secondary mb-6">
                  Follow us on social media for the latest updates, tips, and golf
                  insights.
                </p>
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
                  Need Quick Answers?
                </h3>
                <p className="text-text-secondary mb-4">
                  Check out our Help Center for instant answers to common questions.
                </p>
                <a
                  href="/help"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-semibold transition-colors"
                >
                  Visit Help Center
                  <span className="text-xl">→</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
