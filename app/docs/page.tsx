/**
 * API Documentation Page
 * Developer documentation and API reference
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Code,
  BookOpen,
  Key,
  Zap,
  Database,
  Cloud,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const sections = [
    {
      icon: Key,
      title: 'Authentication',
      description: 'API keys and OAuth 2.0 integration',
      endpoint: 'POST /api/v1/auth',
    },
    {
      icon: Database,
      title: 'User Profiles',
      description: 'Manage user data and club profiles',
      endpoint: 'GET /api/v1/users/:id',
    },
    {
      icon: Cloud,
      title: 'Weather Data',
      description: 'Real-time weather and wind information',
      endpoint: 'GET /api/v1/weather',
    },
    {
      icon: Zap,
      title: 'Recommendations',
      description: 'Get AI-powered club recommendations',
      endpoint: 'POST /api/v1/recommend',
    },
  ];

  const quickStart = `// Install the Copperline Golf SDK
npm install @copperlinegolf/sdk

// Import and initialize
import { CopperlineGolf } from '@copperlinegolf/sdk';

const client = new CopperlineGolf({
  apiKey: 'YOUR_API_KEY'
});

// Get club recommendation
const recommendation = await client.recommend({
  distance: 150,
  wind: { speed: 10, direction: 'headwind' },
  elevation: 5,
  clubProfile: userClubs
});

console.log(recommendation);
// { club: '7 Iron', confidence: 0.92 }`;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
              <Code className="w-4 h-4" />
              <span className="text-sm font-semibold">API Documentation</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Build With
              <br />
              <span className="text-primary">Copperline Golf API</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary mb-8">
              Integrate Copperline Golf's powerful golf intelligence into your
              applications with our RESTful API
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                <Key className="w-5 h-5 mr-2" />
                Get API Key
              </Button>
              <Button variant="outline" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                View Full Docs
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Quick <span className="text-primary">Start</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Get up and running in minutes with our simple SDK
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between bg-neutral-800 px-6 py-3 border-b border-neutral-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <span className="text-white font-medium">quickstart.ts</span>
                </div>
                <button
                  onClick={() => handleCopy(quickStart, 'quickstart')}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                >
                  {copiedCode === 'quickstart' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm text-neutral-300 leading-relaxed">
                  <code>{quickStart}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Endpoints Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              API <span className="text-primary">Endpoints</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Explore our comprehensive API capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                      <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-text-secondary mb-3">
                        {section.description}
                      </p>
                      <code className="text-sm bg-neutral-100 text-neutral-800 px-3 py-1 rounded font-mono">
                        {section.endpoint}
                      </code>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Why Choose Our <span className="text-primary">API</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Fast & Reliable',
                description: '99.9% uptime with sub-100ms response times',
              },
              {
                icon: Key,
                title: 'Secure',
                description: 'Industry-standard OAuth 2.0 and API key auth',
              },
              {
                icon: BookOpen,
                title: 'Well Documented',
                description: 'Comprehensive guides, examples, and SDKs',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
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
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SDK Libraries */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-text-primary mb-4">
              Official <span className="text-primary">SDKs</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Native libraries for your favorite programming languages
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'JavaScript', command: 'npm install @copperlinegolf/sdk' },
              { name: 'Python', command: 'pip install copperlinegolf' },
              { name: 'Ruby', command: 'gem install copperlinegolf' },
              { name: 'Go', command: 'go get github.com/copperlinegolf/sdk' },
            ].map((sdk, index) => (
              <motion.div
                key={sdk.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {sdk.name}
                </h3>
                <code className="text-sm bg-neutral-900 text-neutral-300 px-3 py-2 rounded block font-mono">
                  {sdk.command}
                </code>
              </motion.div>
            ))}
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
            <Code className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Build?
            </h2>
            <p className="text-lg lg:text-xl mb-8 opacity-90">
              Get your API key and start integrating Copperline Golf today
            </p>
            <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-neutral-50">
              <Key className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
