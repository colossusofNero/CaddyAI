/**
 * App Demo Page
 * Interactive demo of Copperline Golf mobile app via appetize.io emulator
 */

'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Smartphone, Target, Cloud, BarChart3, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary to-primary-dark text-white py-16 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Try Copperline Golf
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Experience our intelligent golf companion app in action. No download required.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Interactive Demo Section */}
        <Card className="mb-12 p-6 md:p-8 bg-background-light">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">
              Interactive App Demo
            </h2>
          </div>

          {/* Emulator Container */}
          <div className="bg-secondary-800 rounded-lg p-4 md:p-8 mb-6">
            <div className="flex justify-center overflow-hidden">
              {/* Appetize.io emulator configured for Pixel 7 Pro with Android 14.0 */}
              <iframe
                src="https://appetize.io/embed/b_jmpblo4hnm22nlndi3etgy7b6a?device=pixel7pro&osVersion=14.0&scale=60&centered=both"
                width="100%"
                height="1050"
                frameBorder="0"
                scrolling="no"
                allow="camera;microphone;geolocation"
                className="rounded-lg shadow-2xl w-full"
                style={{ maxWidth: '1000px' }}
                title="Copperline Golf App Demo"
              />
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="bg-secondary-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              How to Use This Demo
            </h3>
            <ol className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </span>
                <span>
                  Wait for the emulator to load (this may take a few seconds)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </span>
                <span>
                  Tap and interact with the app just like you would on a real device
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </span>
                <span>
                  <strong>Navigate to a hole:</strong> Start a round by selecting a course, then swipe left or right on the hole card, or use the hole selector at the top to jump to any hole
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  4
                </span>
                <span>
                  <strong>Try the optimizer:</strong> On the hole view, tap the "Optimize" button to get AI-powered club recommendations based on distance, wind, elevation, and your personal shot data
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  5
                </span>
                <span>
                  Explore other features like shot tracking, weather integration, and performance analytics
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                  6
                </span>
                <span>
                  Ready to experience it on your own device? Sign up for free below!
                </span>
              </li>
            </ol>
          </div>
        </Card>

        {/* Features Highlight */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-8">
            What You'll Experience
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-text-primary mb-2">
                Smart Shot Tracking
              </h3>
              <p className="text-sm text-text-secondary">
                Track every shot with AI-powered club detection and GPS precision
              </p>
            </Card>

            <Card className="p-6 text-center hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-text-primary mb-2">
                Weather Integration
              </h3>
              <p className="text-sm text-text-secondary">
                Real-time weather data that adjusts club recommendations
              </p>
            </Card>

            <Card className="p-6 text-center hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-text-primary mb-2">
                Performance Analytics
              </h3>
              <p className="text-sm text-text-secondary">
                Detailed insights into your game with trend analysis
              </p>
            </Card>

            <Card className="p-6 text-center hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-text-primary mb-2">
                Course Management
              </h3>
              <p className="text-sm text-text-secondary">
                GPS-enabled course maps with distance tracking
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary to-primary-dark text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Game?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of golfers who are playing smarter with Copperline Golf
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="bg-white text-primary hover:bg-green-50">
                Get Started Free
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
