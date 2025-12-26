/**
 * Navigation Component
 * Sticky header with blur background on scroll, mobile hamburger menu,
 * scroll spy for current section highlighting
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeInDown, slideInRight } from '@/lib/animations';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const pathname = usePathname();

  // Handle scroll for blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy for section highlighting
  useEffect(() => {
    if (pathname !== '/') return;

    const handleScroll = () => {
      const sections = ['hero', 'features', 'how-it-works', 'cta'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const isLinkActive = (href: string) => {
    return pathname === href;
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (pathname === '/' && href.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={fadeInDown}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-lg border-b border-secondary-700/50 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Copperline Golf Home"
            >
              <div className="relative w-10 h-10 lg:w-12 lg:h-12">
                <Image
                  src="/logo.png"
                  alt="Copperline Golf Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-copper bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                Copperline Golf
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className={`text-sm font-medium transition-colors relative group ${
                    isLinkActive(link.href)
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isLinkActive(link.href)
                        ? 'w-full'
                        : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button - Touch-optimized (44px min) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 -mr-3 text-text-primary hover:text-primary transition-colors touch-manipulation"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/95 backdrop-blur-lg z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideInRight}
              className="fixed top-16 right-0 bottom-0 w-full max-w-sm bg-background-light border-l border-secondary-700 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Navigation Links */}
                <nav className="space-y-4">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={(e) => {
                          handleSmoothScroll(e, link.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`block text-lg font-medium py-3 px-4 rounded-lg transition-colors touch-manipulation ${
                          isLinkActive(link.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-text-secondary hover:text-text-primary hover:bg-secondary-800'
                        }`}
                        style={{ minHeight: '48px' }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Divider */}
                <div className="border-t border-secondary-700" />

                {/* Mobile CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <Link href="/login" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-6 border-t border-secondary-700"
                >
                  <p className="text-sm text-text-muted text-center">
                    Your intelligent golf companion
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
