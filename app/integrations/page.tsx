/**
 * Integrations Page
 * Third-party integrations and partner services
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Smartphone,
  Activity,
  Watch,
  Cloud,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Apple Health',
      description: 'Sync your golf activity and health metrics',
      icon: Activity,
      category: 'Health & Fitness',
      status: 'Available',
      color: 'from-red-500 to-pink-500',
    },
    {
      name: 'Apple Watch',
      description: 'Get recommendations right on your wrist',
      icon: Watch,
      category: 'Wearables',
      status: 'Available',
      color: 'from-gray-700 to-gray-900',
    },
    {
      name: 'Garmin',
      description: 'Connect your Garmin device for seamless tracking',
      icon: Watch,
      category: 'Wearables',
      status: 'Available',
      color: 'from-blue-500 to-blue-700',
    },
    {
      name: 'Strava',
      description: 'Share your rounds with the Strava community',
      icon: Activity,
      category: 'Social',
      status: 'Available',
      color: 'from-orange-500 to-red-600',
    },
    {
      name: 'Weather API',
      description: 'Real-time weather data from trusted sources',
      icon: Cloud,
      category: 'Data',
      status: 'Available',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      name: 'Google Fit',
      description: 'Track your golf fitness with Google Fit',
      icon: Activity,
      category: 'Health & Fitness',
      status: 'Coming Soon',
      color: 'from-green-500 to-blue-600',
    },
    {
      name: 'Fitbit',
      description: 'Sync your Fitbit device with Copperline Golf',
      icon: Activity,
      category: 'Wearables',
      status: 'Coming Soon',
      color: 'from-teal-400 to-cyan-600',
    },
    {
      name: 'WHOOP',
      description: 'Optimize performance with WHOOP data',
      icon: Zap,
      category: 'Performance',
      status: 'Coming Soon',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Seamless Sync',
      description:
        'Automatic data synchronization across all your devices and services',
    },
    {
      icon: Cloud,
      title: 'Real-Time Data',
      description:
        'Get the latest weather, elevation, and course information instantly',
    },
    {
      icon: Activity,
      title: 'Health Tracking',
      description:
        'Monitor your fitness and performance metrics alongside your golf data',
    },
    {
      icon: CheckCircle2,
      title: 'Privacy First',
      description:
        'Your data is secure and you control what gets shared with third parties',
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
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Integrations</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Connect Copperline Golf With
              <br />
              <span className="text-primary">Your Favorite Apps</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Seamlessly integrate Copperline Golf with the apps and devices you already
              use. Get more from your golf game with powerful integrations.
            </p>

            <Button variant="primary" size="lg">
              Browse Integrations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Available <span className="text-primary">Integrations</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Connect with popular apps and services to enhance your Copperline Golf
              experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => {
              const Icon = integration.icon;
              return (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <div className="mb-2">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {integration.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {integration.name}
                  </h3>

                  <p className="text-text-secondary text-sm mb-4">
                    {integration.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        integration.status === 'Available'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {integration.status}
                    </span>
                    {integration.status === 'Available' && (
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Why Integrate With <span className="text-primary">Copperline Golf</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Get more value from your data with seamless integrations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-text-secondary">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-primary-600 rounded-3xl p-8 lg:p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Connect?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Start integrating your favorite apps and devices with Copperline Golf
              today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
                View All Integrations
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Request Integration
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
