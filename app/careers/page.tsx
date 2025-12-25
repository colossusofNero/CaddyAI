/**
 * Careers Page
 * Job listings and company culture
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Heart,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CareersPage() {
  const jobs = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      salary: '$140k - $180k',
      description:
        'Build the future of golf technology with React, Node.js, and AI/ML integration.',
    },
    {
      title: 'Mobile Developer (iOS)',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      salary: '$130k - $170k',
      description:
        'Develop our native iOS app using Swift and integrate with our AI backend.',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      salary: '$120k - $160k',
      description:
        'Design beautiful, intuitive interfaces that help golfers play better.',
    },
    {
      title: 'Machine Learning Engineer',
      department: 'AI/ML',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$150k - $200k',
      description:
        'Build and optimize ML models for club recommendations and shot analysis.',
    },
    {
      title: 'Growth Marketing Manager',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      salary: '$100k - $140k',
      description:
        'Drive user acquisition and retention through creative marketing campaigns.',
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance',
    },
    {
      icon: DollarSign,
      title: 'Competitive Salary',
      description: 'Market-leading compensation and equity packages',
    },
    {
      icon: Zap,
      title: 'Unlimited PTO',
      description: 'Take the time you need to rest and recharge',
    },
    {
      icon: Target,
      title: 'Professional Growth',
      description: 'Learning budget and conference attendance',
    },
    {
      icon: Users,
      title: 'Remote-First',
      description: 'Work from anywhere with flexible hours',
    },
    {
      icon: Briefcase,
      title: '401(k) Matching',
      description: 'Generous retirement plan contributions',
    },
  ];

  const values = [
    {
      title: 'Innovation First',
      description:
        'We push boundaries and embrace new technologies to solve problems.',
    },
    {
      title: 'User-Centric',
      description:
        'Every decision starts with understanding our golfers\' needs.',
    },
    {
      title: 'Data-Driven',
      description: 'We let data guide our decisions and validate our ideas.',
    },
    {
      title: 'Collaborative',
      description:
        'We win together as a team and celebrate collective success.',
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
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-semibold">Join Our Team</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Build The Future Of
              <br />
              <span className="text-primary">Golf Technology</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Join a passionate team using AI to transform how golfers play the
              game. We're hiring talented people who want to make an impact.
            </p>

            <Button variant="primary" size="lg">
              View Open Positions
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Our <span className="text-primary">Values</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The principles that guide everything we do at Copperline Golf
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="text-4xl font-bold text-primary/20 mb-4">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {value.title}
                </h3>
                <p className="text-text-secondary">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Benefits & <span className="text-primary">Perks</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We take care of our team so they can do their best work
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-text-secondary">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Open <span className="text-primary">Positions</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Find your next opportunity at Copperline Golf
            </p>
          </div>

          <div className="space-y-6 max-w-5xl mx-auto">
            {jobs.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salary}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="lg:flex-shrink-0">
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <p className="text-text-secondary">{job.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Don't See Your Role?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              We're always looking for exceptional talent. Send us your resume
              and tell us what you'd love to work on.
            </p>
            <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
              Get In Touch
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
