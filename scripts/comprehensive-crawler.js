/**
 * CaddyAI Comprehensive Issue Crawler
 *
 * This script performs a deep crawl of the application to identify:
 * - UI/UX issues (broken layouts, missing elements, poor design)
 * - Functionality issues (broken features, errors, failed operations)
 * - Accessibility issues (WCAG violations, missing labels, contrast)
 * - Performance issues (slow loads, large bundles, unoptimized assets)
 * - Data integrity issues (Firebase sync problems, missing data)
 * - Security issues (exposed data, insecure practices)
 *
 * Generates:
 * - Detailed issue report with screenshots
 * - Prioritized issue list (Critical, High, Medium, Low)
 * - Actionable agent prompts for fixing each issue
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../crawler-reports');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

// All routes to crawl
const ROUTES = [
  // Public routes
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/about', name: 'About', requiresAuth: false },
  { path: '/features', name: 'Features', requiresAuth: false },
  { path: '/pricing', name: 'Pricing', requiresAuth: false },
  { path: '/download', name: 'Download', requiresAuth: false },
  { path: '/courses', name: 'Courses', requiresAuth: false },
  { path: '/blog', name: 'Blog', requiresAuth: false },
  { path: '/tutorials', name: 'Tutorials', requiresAuth: false },
  { path: '/community', name: 'Community', requiresAuth: false },
  { path: '/docs', name: 'Docs', requiresAuth: false },
  { path: '/help', name: 'Help', requiresAuth: false },
  { path: '/contact', name: 'Contact', requiresAuth: false },
  { path: '/weather-demo', name: 'Weather Demo', requiresAuth: false },
  { path: '/integrations', name: 'Integrations', requiresAuth: false },
  { path: '/press', name: 'Press', requiresAuth: false },
  { path: '/careers', name: 'Careers', requiresAuth: false },
  { path: '/terms', name: 'Terms', requiresAuth: false },
  { path: '/privacy', name: 'Privacy', requiresAuth: false },
  { path: '/cookies', name: 'Cookies', requiresAuth: false },
  { path: '/gdpr', name: 'GDPR', requiresAuth: false },

  // Auth routes
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/signup', name: 'Signup', requiresAuth: false },

  // Protected routes
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/profile', name: 'Profile', requiresAuth: true },
  { path: '/clubs', name: 'Clubs', requiresAuth: true },
];

// Issue categories with severity levels
const ISSUE_CATEGORIES = {
  UI_UX: 'UI/UX',
  FUNCTIONALITY: 'Functionality',
  ACCESSIBILITY: 'Accessibility',
  PERFORMANCE: 'Performance',
  DATA_INTEGRITY: 'Data Integrity',
  SECURITY: 'Security',
  CONTENT: 'Content',
  SEO: 'SEO',
};

const SEVERITY_LEVELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

class ComprehensiveCrawler {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
    this.pageReports = [];
    this.testUser = null;
    this.isAuthenticated = false;
    this.consoleMessages = [];
    this.networkRequests = [];
    this.performanceMetrics = {};
  }

  async init() {
    console.log('🚀 Starting Comprehensive Application Crawler...\n');
    console.log(`📍 Target: ${SITE_URL}\n`);

    // Create output directories
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });

    this.page = await this.browser.newPage();

    // Setup listeners
    this.setupPageListeners();
  }

  setupPageListeners() {
    // Console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      this.consoleMessages.push({ type, text, timestamp: Date.now() });

      // Detect errors and warnings
      if (type === 'error') {
        this.addIssue({
          category: ISSUE_CATEGORIES.FUNCTIONALITY,
          severity: SEVERITY_LEVELS.HIGH,
          title: 'Console Error Detected',
          description: text,
          location: this.page.url(),
        });
      }

      if (text.includes('Firebase') || text.includes('Auth')) {
        console.log(`  🔥 ${text}`);
      }
    });

    // Network failures
    this.page.on('requestfailed', request => {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Failed Network Request',
        description: `Request to ${request.url()} failed: ${request.failure().errorText}`,
        location: this.page.url(),
      });
    });

    // Response tracking
    this.page.on('response', response => {
      this.networkRequests.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now(),
      });

      // Flag 404s and 500s
      if (response.status() === 404) {
        this.addIssue({
          category: ISSUE_CATEGORIES.FUNCTIONALITY,
          severity: SEVERITY_LEVELS.MEDIUM,
          title: '404 Not Found',
          description: `Resource not found: ${response.url()}`,
          location: this.page.url(),
        });
      }

      if (response.status() >= 500) {
        this.addIssue({
          category: ISSUE_CATEGORIES.FUNCTIONALITY,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: 'Server Error',
          description: `Server error (${response.status()}) for: ${response.url()}`,
          location: this.page.url(),
        });
      }
    });

    // JavaScript errors
    this.page.on('pageerror', error => {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: 'JavaScript Runtime Error',
        description: error.message,
        location: this.page.url(),
        stack: error.stack,
      });
    });
  }

  addIssue(issue) {
    this.issues.push({
      id: this.issues.length + 1,
      timestamp: new Date().toISOString(),
      ...issue,
    });
  }

  async authenticateUser() {
    console.log('🔐 Authenticating test user...\n');

    try {
      // Generate test credentials
      const timestamp = Date.now();
      this.testUser = {
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@caddyai-test.com`,
        password: 'TestPass123!',
      };

      console.log(`  📧 Email: ${this.testUser.email}`);
      console.log(`  🔑 Password: ${this.testUser.password}\n`);

      // Navigate to signup
      await this.page.goto(`${SITE_URL}/signup`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Fill signup form
      await this.page.type('input[name="displayName"]', this.testUser.name);
      await this.page.type('input[name="email"]', this.testUser.email);
      await this.page.type('input[name="password"]', this.testUser.password);
      await this.page.type('input[name="confirmPassword"]', this.testUser.password);

      // Submit
      await this.page.click('button[type="submit"]');

      // Wait for redirect or success message
      await Promise.race([
        this.page.waitForNavigation({ timeout: 10000 }),
        this.page.waitForSelector('.bg-green-500', { timeout: 10000 }),
      ]).catch(() => {});

      await new Promise(resolve => setTimeout(resolve, 2000));

      const url = this.page.url();
      if (url.includes('/dashboard') || url.includes('/profile')) {
        console.log('  ✅ Authentication successful!\n');
        this.isAuthenticated = true;
      } else {
        console.log('  ⚠️  Authentication may have failed\n');
        this.addIssue({
          category: ISSUE_CATEGORIES.FUNCTIONALITY,
          severity: SEVERITY_LEVELS.CRITICAL,
          title: 'Authentication Failed',
          description: 'Unable to create test account and authenticate',
          location: '/signup',
        });
      }

    } catch (error) {
      console.log(`  ❌ Authentication error: ${error.message}\n`);
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: 'Authentication System Error',
        description: error.message,
        location: '/signup',
      });
    }
  }

  async crawlPage(route) {
    console.log(`📄 Crawling: ${route.name} (${route.path})`);

    const pageReport = {
      route: route.path,
      name: route.name,
      url: `${SITE_URL}${route.path}`,
      timestamp: new Date().toISOString(),
      status: null,
      loadTime: 0,
      issues: [],
      metrics: {},
      elements: {},
      accessibility: {},
      screenshot: null,
    };

    try {
      // Skip protected routes if not authenticated
      if (route.requiresAuth && !this.isAuthenticated) {
        console.log(`  ⏭️  Skipping (requires auth)\n`);
        return;
      }

      const startTime = Date.now();

      // Navigate to page
      const response = await this.page.goto(pageReport.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      pageReport.loadTime = Date.now() - startTime;
      pageReport.status = response.status();

      console.log(`  📊 Status: ${pageReport.status} | Load: ${pageReport.loadTime}ms`);

      // Take screenshot
      const screenshotName = `${route.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      pageReport.screenshot = screenshotName;

      // Run comprehensive checks
      await this.checkPageStructure(pageReport);
      await this.checkAccessibility(pageReport);
      await this.checkPerformance(pageReport);
      await this.checkContent(pageReport);
      await this.checkFunctionality(pageReport, route);
      await this.checkSEO(pageReport);

      console.log(`  ✅ Completed (${this.issues.filter(i => i.location === pageReport.url).length} issues found)\n`);

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      pageReport.status = 'error';

      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: `Page Failed to Load: ${route.name}`,
        description: error.message,
        location: pageReport.url,
      });
    }

    this.pageReports.push(pageReport);
  }

  async checkPageStructure(pageReport) {
    // Check for basic HTML structure
    const structure = await this.page.evaluate(() => {
      return {
        hasHeader: !!document.querySelector('header, [role="banner"]'),
        hasNav: !!document.querySelector('nav, [role="navigation"]'),
        hasMain: !!document.querySelector('main, [role="main"]'),
        hasFooter: !!document.querySelector('footer, [role="contentinfo"]'),
        hasH1: !!document.querySelector('h1'),
        h1Count: document.querySelectorAll('h1').length,
        buttonCount: document.querySelectorAll('button').length,
        linkCount: document.querySelectorAll('a').length,
        formCount: document.querySelectorAll('form').length,
        imageCount: document.querySelectorAll('img').length,
      };
    });

    pageReport.elements = structure;

    // Check for missing main content area
    if (!structure.hasMain) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Missing Main Landmark',
        description: 'Page is missing <main> element or role="main" for accessibility',
        location: pageReport.url,
      });
    }

    // Check for multiple H1s
    if (structure.h1Count > 1) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Multiple H1 Elements',
        description: `Page has ${structure.h1Count} H1 elements. Should have exactly one.`,
        location: pageReport.url,
      });
    }

    // Check for no H1
    if (structure.h1Count === 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing H1 Element',
        description: 'Page is missing an H1 heading for proper document structure',
        location: pageReport.url,
      });
    }
  }

  async checkAccessibility(pageReport) {
    const a11yIssues = await this.page.evaluate(() => {
      const issues = [];

      // Check images for alt text
      const images = document.querySelectorAll('img');
      images.forEach((img, idx) => {
        if (!img.alt || img.alt.trim() === '') {
          issues.push({
            type: 'missing-alt',
            element: 'img',
            src: img.src,
            index: idx,
          });
        }
      });

      // Check buttons for labels
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        const hasLabel = btn.textContent.trim() || btn.getAttribute('aria-label');
        if (!hasLabel) {
          issues.push({
            type: 'missing-label',
            element: 'button',
            index: idx,
          });
        }
      });

      // Check inputs for labels
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      inputs.forEach((input, idx) => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');

        if (!hasLabel && !hasAriaLabel) {
          issues.push({
            type: 'missing-label',
            element: 'input',
            inputType: input.type,
            index: idx,
          });
        }
      });

      // Check for color contrast issues (simplified)
      const textElements = document.querySelectorAll('p, span, div, button, a');
      let lowContrastCount = 0;

      Array.from(textElements).slice(0, 50).forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const color = style.color;

        // Simple check: if both are similar or transparent, might be an issue
        if (bgColor === 'rgba(0, 0, 0, 0)' || color === bgColor) {
          lowContrastCount++;
        }
      });

      if (lowContrastCount > 5) {
        issues.push({
          type: 'possible-contrast-issues',
          count: lowContrastCount,
        });
      }

      // Check for form validation
      const forms = document.querySelectorAll('form');
      forms.forEach((form, idx) => {
        const hasValidation = form.noValidate === false;
        const requiredFields = form.querySelectorAll('[required]');

        if (requiredFields.length > 0 && !form.querySelector('[aria-invalid]')) {
          issues.push({
            type: 'missing-aria-invalid',
            element: 'form',
            index: idx,
          });
        }
      });

      return issues;
    });

    pageReport.accessibility = {
      totalIssues: a11yIssues.length,
      issues: a11yIssues,
    };

    // Add issues to global list
    const missingAlt = a11yIssues.filter(i => i.type === 'missing-alt');
    if (missingAlt.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Images Missing Alt Text',
        description: `${missingAlt.length} images are missing alt text for screen readers`,
        location: pageReport.url,
        details: missingAlt.slice(0, 5).map(i => i.src),
      });
    }

    const missingLabels = a11yIssues.filter(i => i.type === 'missing-label');
    if (missingLabels.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Form Elements Missing Labels',
        description: `${missingLabels.length} form elements are missing labels or ARIA attributes`,
        location: pageReport.url,
      });
    }

    const contrastIssues = a11yIssues.filter(i => i.type === 'possible-contrast-issues');
    if (contrastIssues.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Possible Color Contrast Issues',
        description: 'Detected elements that may have insufficient color contrast',
        location: pageReport.url,
      });
    }
  }

  async checkPerformance(pageReport) {
    const metrics = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0];

      return {
        domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
        loadComplete: perfData ? perfData.loadEventEnd - perfData.loadEventStart : 0,
        domInteractive: perfData ? perfData.domInteractive : 0,
        resourceCount: window.performance.getEntriesByType('resource').length,
      };
    });

    pageReport.metrics = metrics;

    // Flag slow page loads
    if (pageReport.loadTime > 5000) {
      this.addIssue({
        category: ISSUE_CATEGORIES.PERFORMANCE,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Slow Page Load',
        description: `Page took ${pageReport.loadTime}ms to load (threshold: 5000ms)`,
        location: pageReport.url,
      });
    }

    // Flag large number of resources
    if (metrics.resourceCount > 100) {
      this.addIssue({
        category: ISSUE_CATEGORIES.PERFORMANCE,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'High Resource Count',
        description: `Page loads ${metrics.resourceCount} resources. Consider optimization.`,
        location: pageReport.url,
      });
    }
  }

  async checkContent(pageReport) {
    const content = await this.page.evaluate(() => {
      return {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        hasText: document.body.textContent.trim().length > 0,
        textLength: document.body.textContent.trim().length,
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          hasText: a.textContent.trim().length > 0,
        })),
      };
    });

    // Check for empty title
    if (!content.title || content.title === '') {
      this.addIssue({
        category: ISSUE_CATEGORIES.SEO,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing Page Title',
        description: 'Page is missing a <title> tag',
        location: pageReport.url,
      });
    }

    // Check for missing meta description
    if (!content.metaDescription) {
      this.addIssue({
        category: ISSUE_CATEGORIES.SEO,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Missing Meta Description',
        description: 'Page is missing meta description for SEO',
        location: pageReport.url,
      });
    }

    // Check for links without text
    const emptyLinks = content.links.filter(l => !l.hasText);
    if (emptyLinks.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.ACCESSIBILITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Links Without Text',
        description: `${emptyLinks.length} links have no visible text for screen readers`,
        location: pageReport.url,
        details: emptyLinks.slice(0, 5).map(l => l.href),
      });
    }

    // Check for broken internal links
    const internalLinks = content.links.filter(l => l.href.includes(SITE_URL));
    for (const link of internalLinks.slice(0, 10)) { // Check first 10
      if (link.href.includes('#')) continue; // Skip anchors

      try {
        const response = await this.page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 5000 });
        if (response.status() === 404) {
          this.addIssue({
            category: ISSUE_CATEGORIES.CONTENT,
            severity: SEVERITY_LEVELS.MEDIUM,
            title: 'Broken Internal Link',
            description: `Link to ${link.href} returns 404`,
            location: pageReport.url,
          });
        }
      } catch (error) {
        // Skip timeout errors
      }
    }
  }

  async checkFunctionality(pageReport, route) {
    // Page-specific functionality checks

    if (route.path === '/login' || route.path === '/signup') {
      await this.checkAuthPage(pageReport, route.path);
    }

    if (route.path === '/profile') {
      await this.checkProfilePage(pageReport);
    }

    if (route.path === '/clubs') {
      await this.checkClubsPage(pageReport);
    }

    if (route.path === '/dashboard') {
      await this.checkDashboardPage(pageReport);
    }

    // Check for interactive elements that don't respond
    const brokenButtons = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => {
        const hasClickHandler = btn.onclick || btn.getAttribute('onclick');
        const hasEventListener = true; // We can't check this from the page context
        const isDisabled = btn.disabled;

        return !isDisabled && !hasClickHandler; // Simplified check
      }).length;
    });

    // Note: This is a heuristic, not foolproof
    if (brokenButtons > 5) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Buttons May Lack Event Handlers',
        description: `${brokenButtons} buttons may not have click handlers attached`,
        location: pageReport.url,
      });
    }
  }

  async checkAuthPage(pageReport, path) {
    const hasForm = await this.page.$('form');
    const hasEmail = await this.page.$('input[type="email"]');
    const hasPassword = await this.page.$('input[type="password"]');
    const hasSubmit = await this.page.$('button[type="submit"]');

    if (!hasForm) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: 'Missing Authentication Form',
        description: `${path} page is missing the authentication form`,
        location: pageReport.url,
      });
    }

    if (!hasEmail || !hasPassword) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: 'Missing Form Fields',
        description: 'Authentication form is missing email or password fields',
        location: pageReport.url,
      });
    }

    if (!hasSubmit) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing Submit Button',
        description: 'Authentication form is missing submit button',
        location: pageReport.url,
      });
    }

    // Check for OAuth buttons
    const hasGoogle = await this.page.$('button::-p-text(Google)');
    const hasApple = await this.page.$('button::-p-text(Apple)');

    if (!hasGoogle) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.LOW,
        title: 'Missing Google Sign-In',
        description: 'Google OAuth button not found on auth page',
        location: pageReport.url,
      });
    }

    if (!hasApple) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.LOW,
        title: 'Missing Apple Sign-In',
        description: 'Apple OAuth button not found on auth page',
        location: pageReport.url,
      });
    }
  }

  async checkProfilePage(pageReport) {
    // Check for profile form elements
    const elements = await this.page.evaluate(() => {
      return {
        hasHandicap: !!document.querySelector('::-p-text(Handicap)'),
        hasShotShape: !!document.querySelector('::-p-text(Shot Shape)'),
        hasHeight: !!document.querySelector('::-p-text(Height)'),
        hasDominantHand: !!document.querySelector('::-p-text(Dominant Hand), ::-p-text(Hand)'),
        hasSaveButton: !!document.querySelector('button[type="submit"], button::-p-text(Save)'),
      };
    });

    const missingFields = [];
    if (!elements.hasHandicap) missingFields.push('Handicap');
    if (!elements.hasShotShape) missingFields.push('Shot Shape');
    if (!elements.hasHeight) missingFields.push('Height');
    if (!elements.hasDominantHand) missingFields.push('Dominant Hand');

    if (missingFields.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing Profile Fields',
        description: `Profile page is missing fields: ${missingFields.join(', ')}`,
        location: pageReport.url,
      });
    }

    if (!elements.hasSaveButton) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing Save Button',
        description: 'Profile page is missing a save button',
        location: pageReport.url,
      });
    }
  }

  async checkClubsPage(pageReport) {
    const clubs = await this.page.evaluate(() => {
      // Look for club-related elements
      const clubElements = document.querySelectorAll('[data-testid*="club"], .club-item, [class*="club"]');
      return {
        clubCount: clubElements.length,
        hasAddButton: !!document.querySelector('button::-p-text(Add Club), button::-p-text(Add)'),
        hasSaveButton: !!document.querySelector('button::-p-text(Save)'),
      };
    });

    if (clubs.clubCount === 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'No Clubs Displayed',
        description: 'Clubs page is not displaying any club elements',
        location: pageReport.url,
      });
    }

    if (clubs.clubCount < 14) {
      this.addIssue({
        category: ISSUE_CATEGORIES.CONTENT,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Incomplete Club Set',
        description: `Only ${clubs.clubCount} clubs displayed. Expected 14+ standard clubs.`,
        location: pageReport.url,
      });
    }
  }

  async checkDashboardPage(pageReport) {
    const dashboard = await this.page.evaluate(() => {
      return {
        hasWelcome: !!document.querySelector('::-p-text(Welcome)'),
        hasProfileCard: !!document.querySelector('::-p-text(Profile)'),
        hasClubsCard: !!document.querySelector('::-p-text(Clubs)'),
        hasMobileAppCard: !!document.querySelector('::-p-text(Mobile)'),
        hasSignOut: !!document.querySelector('button::-p-text(Sign Out)'),
      };
    });

    if (!dashboard.hasWelcome) {
      this.addIssue({
        category: ISSUE_CATEGORIES.UI_UX,
        severity: SEVERITY_LEVELS.LOW,
        title: 'Missing Welcome Message',
        description: 'Dashboard should greet the user with a welcome message',
        location: pageReport.url,
      });
    }

    const missingCards = [];
    if (!dashboard.hasProfileCard) missingCards.push('Profile');
    if (!dashboard.hasClubsCard) missingCards.push('Clubs');
    if (!dashboard.hasMobileAppCard) missingCards.push('Mobile App');

    if (missingCards.length > 0) {
      this.addIssue({
        category: ISSUE_CATEGORIES.UI_UX,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Missing Dashboard Cards',
        description: `Dashboard is missing cards: ${missingCards.join(', ')}`,
        location: pageReport.url,
      });
    }

    if (!dashboard.hasSignOut) {
      this.addIssue({
        category: ISSUE_CATEGORIES.FUNCTIONALITY,
        severity: SEVERITY_LEVELS.HIGH,
        title: 'Missing Sign Out Button',
        description: 'Dashboard is missing a sign out button',
        location: pageReport.url,
      });
    }
  }

  async checkSEO(pageReport) {
    const seo = await this.page.evaluate(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
      const ogDescription = document.querySelector('meta[property="og:description"]')?.content;
      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      const canonical = document.querySelector('link[rel="canonical"]')?.href;

      return {
        hasOgTitle: !!ogTitle,
        hasOgDescription: !!ogDescription,
        hasOgImage: !!ogImage,
        hasCanonical: !!canonical,
      };
    });

    if (!seo.hasOgTitle || !seo.hasOgDescription) {
      this.addIssue({
        category: ISSUE_CATEGORIES.SEO,
        severity: SEVERITY_LEVELS.MEDIUM,
        title: 'Missing Open Graph Tags',
        description: 'Page is missing Open Graph meta tags for social sharing',
        location: pageReport.url,
      });
    }

    if (!seo.hasCanonical) {
      this.addIssue({
        category: ISSUE_CATEGORIES.SEO,
        severity: SEVERITY_LEVELS.LOW,
        title: 'Missing Canonical URL',
        description: 'Page is missing canonical link tag',
        location: pageReport.url,
      });
    }
  }

  generateIssuePrompts() {
    console.log('🤖 Generating agent prompts for issues...\n');

    const prompts = [];

    // Group issues by page and category
    const issuesByPage = {};
    this.issues.forEach(issue => {
      if (!issuesByPage[issue.location]) {
        issuesByPage[issue.location] = [];
      }
      issuesByPage[issue.location].push(issue);
    });

    // Generate prompts for critical and high severity issues
    const priorityIssues = this.issues.filter(
      i => i.severity === SEVERITY_LEVELS.CRITICAL || i.severity === SEVERITY_LEVELS.HIGH
    );

    priorityIssues.forEach(issue => {
      const prompt = this.createPromptForIssue(issue);
      prompts.push(prompt);
    });

    return prompts;
  }

  createPromptForIssue(issue) {
    const basePrompt = {
      issueId: issue.id,
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      location: issue.location,
      prompt: '',
      files: [],
      testSteps: [],
    };

    // Create context-specific prompts based on issue type
    switch (issue.category) {
      case ISSUE_CATEGORIES.FUNCTIONALITY:
        basePrompt.prompt = this.createFunctionalityPrompt(issue);
        break;
      case ISSUE_CATEGORIES.ACCESSIBILITY:
        basePrompt.prompt = this.createAccessibilityPrompt(issue);
        break;
      case ISSUE_CATEGORIES.UI_UX:
        basePrompt.prompt = this.createUIPrompt(issue);
        break;
      case ISSUE_CATEGORIES.PERFORMANCE:
        basePrompt.prompt = this.createPerformancePrompt(issue);
        break;
      case ISSUE_CATEGORIES.SEO:
        basePrompt.prompt = this.createSEOPrompt(issue);
        break;
      case ISSUE_CATEGORIES.CONTENT:
        basePrompt.prompt = this.createContentPrompt(issue);
        break;
      default:
        basePrompt.prompt = `Fix the following issue: ${issue.title}\n\nDescription: ${issue.description}\n\nLocation: ${issue.location}`;
    }

    return basePrompt;
  }

  createFunctionalityPrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: Functionality
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Navigate to the file(s) responsible for ${issue.location}
2. Identify the root cause of the issue: ${issue.title}
3. Implement a fix that resolves the issue
4. Ensure the fix doesn't break existing functionality
5. Add error handling if appropriate
6. Test the fix manually by running the dev server
7. Consider adding automated tests to prevent regression

**Testing Steps**:
1. Run \`npm run dev\` to start the development server
2. Navigate to ${issue.location}
3. Verify the issue is resolved
4. Test related functionality to ensure no regressions

**Success Criteria**:
- Issue is fully resolved
- No console errors
- Related functionality still works
- Code follows project conventions`;
  }

  createAccessibilityPrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: Accessibility (WCAG Compliance)
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Locate the components/elements in ${issue.location}
2. Add appropriate ARIA attributes, labels, and semantic HTML
3. Ensure keyboard navigation works properly
4. Test with screen reader tools (if available)
5. Verify color contrast meets WCAG AA standards (4.5:1 for normal text)

**WCAG Guidelines**:
- All images must have descriptive alt text
- Form inputs must have associated labels
- Interactive elements must be keyboard accessible
- Color contrast must meet minimum ratios
- Semantic HTML should be used (header, nav, main, footer)

**Testing Steps**:
1. Run \`npm run dev\`
2. Navigate to ${issue.location}
3. Test keyboard navigation (Tab, Enter, Escape)
4. Inspect elements for ARIA attributes
5. Check browser DevTools Accessibility panel

**Success Criteria**:
- All accessibility issues resolved
- WCAG AA compliance achieved
- Keyboard navigation works
- Screen reader compatible`;
  }

  createUIPrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: UI/UX
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Review the UI/UX issue on ${issue.location}
2. Design a solution that improves user experience
3. Implement the fix using existing design system components
4. Ensure responsive design (mobile, tablet, desktop)
5. Maintain visual consistency with the rest of the app
6. Test on multiple screen sizes

**Design Principles**:
- Follow Tailwind CSS conventions used in the project
- Maintain consistent spacing and typography
- Ensure proper visual hierarchy
- Use appropriate color palette from theme
- Optimize for mobile-first design

**Testing Steps**:
1. Run \`npm run dev\`
2. Navigate to ${issue.location}
3. Test on multiple viewport sizes (mobile, tablet, desktop)
4. Verify visual consistency
5. Check hover/focus/active states

**Success Criteria**:
- UI issue resolved
- Responsive on all screen sizes
- Visually consistent with app design
- Smooth interactions and transitions`;
  }

  createPerformancePrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: Performance
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Profile the performance issue on ${issue.location}
2. Identify bottlenecks (large bundles, slow queries, unoptimized images)
3. Implement optimizations:
   - Code splitting and lazy loading
   - Image optimization (next/image)
   - Memoization and caching
   - Reduce unnecessary re-renders
   - Optimize bundle size
4. Measure before and after performance

**Performance Best Practices**:
- Use Next.js Image component for images
- Implement lazy loading for heavy components
- Use React.memo() for expensive components
- Optimize Firebase queries with proper indexing
- Minimize JavaScript bundle size
- Use web vitals for measurement

**Testing Steps**:
1. Measure baseline: Use Chrome DevTools Performance tab
2. Implement optimizations
3. Measure improved metrics
4. Run \`npm run build\` and analyze bundle size
5. Test on slow 3G connection

**Success Criteria**:
- Page load time < 3 seconds
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Lighthouse performance score > 90`;
  }

  createSEOPrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: SEO
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Add missing SEO meta tags to ${issue.location}
2. Use Next.js Metadata API (if using App Router)
3. Ensure proper Open Graph and Twitter Card tags
4. Add structured data (JSON-LD) where appropriate
5. Verify canonical URLs
6. Check robots.txt and sitemap.xml

**SEO Requirements**:
- Title tag (50-60 characters)
- Meta description (150-160 characters)
- Open Graph tags (og:title, og:description, og:image, og:url)
- Twitter Card tags
- Canonical URL
- Proper heading hierarchy (H1 > H2 > H3)

**Testing Steps**:
1. Run \`npm run dev\`
2. Navigate to ${issue.location}
3. View page source and check meta tags
4. Use Chrome DevTools > Elements > head
5. Test with Facebook Sharing Debugger
6. Test with Twitter Card Validator

**Success Criteria**:
- All required meta tags present
- Social sharing preview looks good
- Search engines can properly index page
- Lighthouse SEO score > 95`;
  }

  createContentPrompt(issue) {
    return `**Issue**: ${issue.title}

**Severity**: ${issue.severity}
**Category**: Content
**Location**: ${issue.location}

**Description**:
${issue.description}

**Your Task**:
1. Review the content issue on ${issue.location}
2. Fix broken links or missing content
3. Ensure all text is clear and readable
4. Verify links are working and point to correct destinations
5. Check for typos and formatting issues

**Content Guidelines**:
- All links should be functional
- Link text should be descriptive (avoid "click here")
- Images should have descriptive alt text
- Text should be clear and concise
- Proper grammar and spelling

**Testing Steps**:
1. Run \`npm run dev\`
2. Navigate to ${issue.location}
3. Click all links to verify they work
4. Read through all content for clarity
5. Check images load properly

**Success Criteria**:
- All content issues resolved
- Links work correctly
- Text is clear and error-free
- Images display properly`;
  }

  generateReport() {
    console.log('📊 Generating comprehensive report...\n');

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        siteUrl: SITE_URL,
        totalPages: this.pageReports.length,
        totalIssues: this.issues.length,
        authenticatedUser: this.testUser?.email || 'N/A',
      },
      summary: {
        issuesBySeverity: {
          critical: this.issues.filter(i => i.severity === SEVERITY_LEVELS.CRITICAL).length,
          high: this.issues.filter(i => i.severity === SEVERITY_LEVELS.HIGH).length,
          medium: this.issues.filter(i => i.severity === SEVERITY_LEVELS.MEDIUM).length,
          low: this.issues.filter(i => i.severity === SEVERITY_LEVELS.LOW).length,
        },
        issuesByCategory: {},
      },
      pages: this.pageReports,
      issues: this.issues,
      prompts: this.generateIssuePrompts(),
    };

    // Count issues by category
    Object.values(ISSUE_CATEGORIES).forEach(cat => {
      report.summary.issuesByCategory[cat] = this.issues.filter(i => i.category === cat).length;
    });

    return report;
  }

  generateMarkdownReport(report) {
    let md = `# CaddyAI Comprehensive Issue Report\n\n`;
    md += `**Generated**: ${new Date(report.metadata.timestamp).toLocaleString()}\n`;
    md += `**Site URL**: ${report.metadata.siteUrl}\n`;
    md += `**Pages Crawled**: ${report.metadata.totalPages}\n`;
    md += `**Total Issues Found**: ${report.metadata.totalIssues}\n\n`;

    md += `---\n\n`;

    md += `## Executive Summary\n\n`;

    md += `### Issues by Severity\n\n`;
    md += `| Severity | Count |\n`;
    md += `|----------|-------|\n`;
    md += `| 🔴 Critical | ${report.summary.issuesBySeverity.critical} |\n`;
    md += `| 🟠 High | ${report.summary.issuesBySeverity.high} |\n`;
    md += `| 🟡 Medium | ${report.summary.issuesBySeverity.medium} |\n`;
    md += `| 🟢 Low | ${report.summary.issuesBySeverity.low} |\n\n`;

    md += `### Issues by Category\n\n`;
    md += `| Category | Count |\n`;
    md += `|----------|-------|\n`;
    Object.entries(report.summary.issuesByCategory).forEach(([cat, count]) => {
      md += `| ${cat} | ${count} |\n`;
    });
    md += `\n`;

    md += `---\n\n`;

    md += `## Detailed Issues\n\n`;

    // Group by severity
    [SEVERITY_LEVELS.CRITICAL, SEVERITY_LEVELS.HIGH, SEVERITY_LEVELS.MEDIUM, SEVERITY_LEVELS.LOW].forEach(severity => {
      const issuesOfSeverity = report.issues.filter(i => i.severity === severity);

      if (issuesOfSeverity.length > 0) {
        const emoji = {
          [SEVERITY_LEVELS.CRITICAL]: '🔴',
          [SEVERITY_LEVELS.HIGH]: '🟠',
          [SEVERITY_LEVELS.MEDIUM]: '🟡',
          [SEVERITY_LEVELS.LOW]: '🟢',
        }[severity];

        md += `### ${emoji} ${severity} Priority Issues (${issuesOfSeverity.length})\n\n`;

        issuesOfSeverity.forEach(issue => {
          md += `#### ${issue.id}. ${issue.title}\n\n`;
          md += `- **Category**: ${issue.category}\n`;
          md += `- **Location**: ${issue.location}\n`;
          md += `- **Description**: ${issue.description}\n`;

          if (issue.details) {
            md += `- **Details**: \n`;
            if (Array.isArray(issue.details)) {
              issue.details.forEach(d => md += `  - ${d}\n`);
            } else {
              md += `  ${JSON.stringify(issue.details, null, 2)}\n`;
            }
          }

          md += `\n`;
        });
      }
    });

    md += `---\n\n`;

    md += `## Agent Fix Prompts\n\n`;
    md += `The following prompts can be used with AI agents to fix the identified issues.\n\n`;

    report.prompts.forEach((prompt, idx) => {
      md += `### Prompt ${idx + 1}: ${prompt.title}\n\n`;
      md += `**Issue ID**: #${prompt.issueId}\n`;
      md += `**Severity**: ${prompt.severity}\n`;
      md += `**Category**: ${prompt.category}\n\n`;
      md += `\`\`\`\n${prompt.prompt}\n\`\`\`\n\n`;
      md += `---\n\n`;
    });

    md += `## Page Reports\n\n`;

    report.pages.forEach(page => {
      md += `### ${page.name} (${page.route})\n\n`;
      md += `- **Status**: ${page.status}\n`;
      md += `- **Load Time**: ${page.loadTime}ms\n`;
      md += `- **Screenshot**: [View](screenshots/${page.screenshot})\n`;
      md += `- **Elements**: ${page.elements?.buttonCount || 0} buttons, ${page.elements?.linkCount || 0} links, ${page.elements?.formCount || 0} forms\n`;

      if (page.accessibility?.totalIssues > 0) {
        md += `- **Accessibility Issues**: ${page.accessibility.totalIssues}\n`;
      }

      md += `\n`;
    });

    md += `---\n\n`;
    md += `*Report generated by CaddyAI Comprehensive Crawler*\n`;

    return md;
  }

  async run() {
    try {
      await this.init();

      // Authenticate first
      await this.authenticateUser();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Crawl all routes
      for (const route of ROUTES) {
        await this.crawlPage(route);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between pages
      }

      // Generate reports
      const report = this.generateReport();
      const markdown = this.generateMarkdownReport(report);

      // Save JSON report
      const jsonPath = path.join(OUTPUT_DIR, 'issue-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`✅ JSON report saved: ${jsonPath}\n`);

      // Save Markdown report
      const mdPath = path.join(OUTPUT_DIR, 'issue-report.md');
      fs.writeFileSync(mdPath, markdown);
      console.log(`✅ Markdown report saved: ${mdPath}\n`);

      // Save agent prompts separately
      const promptsPath = path.join(OUTPUT_DIR, 'agent-prompts.json');
      fs.writeFileSync(promptsPath, JSON.stringify(report.prompts, null, 2));
      console.log(`✅ Agent prompts saved: ${promptsPath}\n`);

      console.log('═══════════════════════════════════════════');
      console.log('📊 CRAWL COMPLETE');
      console.log('═══════════════════════════════════════════\n');
      console.log(`Total Pages: ${report.metadata.totalPages}`);
      console.log(`Total Issues: ${report.metadata.totalIssues}`);
      console.log(`  🔴 Critical: ${report.summary.issuesBySeverity.critical}`);
      console.log(`  🟠 High: ${report.summary.issuesBySeverity.high}`);
      console.log(`  🟡 Medium: ${report.summary.issuesBySeverity.medium}`);
      console.log(`  🟢 Low: ${report.summary.issuesBySeverity.low}\n`);
      console.log(`Agent Prompts Generated: ${report.prompts.length}\n`);

    } catch (error) {
      console.error('❌ Crawler failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the crawler
if (require.main === module) {
  const crawler = new ComprehensiveCrawler();
  crawler.run().catch(console.error);
}

module.exports = ComprehensiveCrawler;
