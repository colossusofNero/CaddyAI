/**
 * CaddyAI Website Audit Script
 *
 * Crawls the website and generates a comprehensive audit report covering:
 * - Functionality testing (what works, what doesn't)
 * - Visual design (colors, images, UI/UX)
 * - Firebase integration status
 * - Mobile app feature parity
 * - Data synchronization readiness
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://caddyai-2dc3o72xb-rcg-valuation.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '../audit-reports');

// Expected mobile app features that should be on web
const EXPECTED_FEATURES = {
  authentication: [
    'Sign Up',
    'Login',
    'Password Reset',
    'Profile Creation',
  ],
  profile: [
    'User Profile View',
    'Handicap Display',
    'Shot Shape Selection',
    'Profile Editing',
  ],
  clubs: [
    'Club List (26 clubs)',
    'Distance Input',
    'Club Selection',
    'Distance Tracking',
  ],
  courses: [
    'Course Search',
    'Favorite Courses',
    'Played Courses History',
    'Course Details',
  ],
  rounds: [
    'Start Round',
    'Active Round Tracking',
    'Hole Navigation',
    'Score Entry',
    'Round History',
  ],
  statistics: [
    'Round Statistics',
    'Club Usage Stats',
    'Performance Trends',
    'Distance Analytics',
  ],
};

// Pages to crawl
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/features', name: 'Features' },
  { path: '/courses', name: 'Courses' },
  { path: '/about', name: 'About' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/download', name: 'Download' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  { path: '/profile', name: 'Profile' },
  { path: '/dashboard', name: 'Dashboard' },
];

class SiteAuditor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.report = {
      timestamp: new Date().toISOString(),
      siteUrl: SITE_URL,
      summary: {
        totalPages: 0,
        workingPages: 0,
        brokenPages: 0,
        consoleErrors: 0,
        consoleWarnings: 0,
        firebaseInitialized: false,
      },
      pages: [],
      functionality: {
        working: [],
        broken: [],
        missing: [],
      },
      design: {
        colors: [],
        images: {
          total: 0,
          broken: [],
          missingAlt: [],
        },
        issues: [],
      },
      firebase: {
        initialized: false,
        services: {
          auth: false,
          firestore: false,
          storage: false,
        },
        errors: [],
      },
      appParity: {
        implemented: [],
        missing: [],
        partial: [],
      },
    };
  }

  async init() {
    console.log('🚀 Starting CaddyAI Website Audit...\n');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Capture console messages
    this.page.on('console', msg => this.handleConsoleMessage(msg));

    // Capture network failures
    this.page.on('requestfailed', request => {
      console.log(`❌ Failed request: ${request.url()}`);
    });
  }

  handleConsoleMessage(msg) {
    const text = msg.text();
    const type = msg.type();

    // Track Firebase initialization
    if (text.includes('[Firebase] Successfully initialized')) {
      this.report.firebase.initialized = true;
      this.report.summary.firebaseInitialized = true;
    }

    if (text.includes('[Firebase] Missing environment variables')) {
      this.report.firebase.errors.push(text);
    }

    if (text.includes('[Auth] Firebase Auth is not initialized')) {
      this.report.firebase.services.auth = false;
      this.report.firebase.errors.push('Auth not initialized');
    }

    // Count errors and warnings
    if (type === 'error') {
      this.report.summary.consoleErrors++;
    } else if (type === 'warning') {
      this.report.summary.consoleWarnings++;
    }
  }

  async testPage(pageInfo) {
    console.log(`📄 Testing: ${pageInfo.name} (${pageInfo.path})`);

    const pageReport = {
      name: pageInfo.name,
      path: pageInfo.path,
      url: `${SITE_URL}${pageInfo.path}`,
      status: 'unknown',
      loadTime: 0,
      errors: [],
      warnings: [],
      elements: {
        buttons: 0,
        links: 0,
        forms: 0,
        images: 0,
      },
      features: [],
      design: {
        colors: [],
        hasHero: false,
        hasCTA: false,
      },
    };

    const startTime = Date.now();

    try {
      const response = await this.page.goto(pageReport.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      pageReport.loadTime = Date.now() - startTime;
      pageReport.status = response.status();

      if (pageReport.status === 200) {
        this.report.summary.workingPages++;

        // Analyze page content
        await this.analyzePage(pageReport);

      } else {
        this.report.summary.brokenPages++;
        pageReport.errors.push(`HTTP ${pageReport.status}`);
      }

    } catch (error) {
      this.report.summary.brokenPages++;
      pageReport.status = 'error';
      pageReport.errors.push(error.message);
      console.log(`   ❌ Error: ${error.message}`);
    }

    this.report.pages.push(pageReport);
    console.log(`   ✅ Status: ${pageReport.status} (${pageReport.loadTime}ms)\n`);
  }

  async analyzePage(pageReport) {
    // Count elements
    pageReport.elements.buttons = await this.page.$$eval('button', els => els.length);
    pageReport.elements.links = await this.page.$$eval('a', els => els.length);
    pageReport.elements.forms = await this.page.$$eval('form', els => els.length);
    pageReport.elements.images = await this.page.$$eval('img', els => els.length);

    // Check for authentication elements
    const hasLoginButton = await this.page.$('button::-p-text(Log In), button::-p-text(Login), a::-p-text(Log In), a::-p-text(Login)');
    const hasSignupButton = await this.page.$('button::-p-text(Sign Up), button::-p-text(Signup), a::-p-text(Sign Up), a::-p-text(Signup)');

    if (hasLoginButton) pageReport.features.push('Login Button');
    if (hasSignupButton) pageReport.features.push('Signup Button');

    // Check for profile/dashboard elements
    const hasProfileLink = await this.page.$('a[href*="profile"], button::-p-text(Profile)');
    const hasDashboardLink = await this.page.$('a[href*="dashboard"]');

    if (hasProfileLink) pageReport.features.push('Profile Link');
    if (hasDashboardLink) pageReport.features.push('Dashboard Link');

    // Analyze colors
    const colors = await this.page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        background: styles.backgroundColor,
        color: styles.color,
      };
    });
    pageReport.design.colors = colors;

    // Check for hero section
    const hasHero = await this.page.$('section[class*="hero"], div[class*="hero"], .hero');
    pageReport.design.hasHero = !!hasHero;

    // Check for CTA buttons
    const hasCTA = await this.page.$('button[class*="cta"], a[class*="cta"], button::-p-text(Get Started), button::-p-text(Download)');
    pageReport.design.hasCTA = !!hasCTA;

    // Analyze images
    const images = await this.page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      }))
    );

    this.report.design.images.total += images.length;

    images.forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        this.report.design.images.missingAlt.push(img.src);
      }
    });

    // Check for Firebase Auth UI
    if (pageReport.name === 'Login' || pageReport.name === 'Signup') {
      const hasEmailInput = await this.page.$('input[type="email"]');
      const hasPasswordInput = await this.page.$('input[type="password"]');

      if (hasEmailInput && hasPasswordInput) {
        pageReport.features.push('Email/Password Form');
        this.report.functionality.working.push(`${pageReport.name} Form Present`);
      } else {
        this.report.functionality.broken.push(`${pageReport.name} Form Missing`);
      }
    }

    // Check for profile features
    if (pageReport.name === 'Profile') {
      const hasHandicap = await this.page.$('::-p-text(Handicap)');
      const hasShotShape = await this.page.$('::-p-text(Shot Shape)');
      const hasClubs = await this.page.$('::-p-text(Clubs), ::-p-text(Club)');

      if (hasHandicap) pageReport.features.push('Handicap Field');
      if (hasShotShape) pageReport.features.push('Shot Shape Field');
      if (hasClubs) pageReport.features.push('Clubs Section');
    }
  }

  async checkFirebaseIntegration() {
    console.log('🔥 Checking Firebase Integration...\n');

    // Go to home page and wait for Firebase
    await this.page.goto(SITE_URL, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check Firebase status in console
    const firebaseStatus = await this.page.evaluate(() => {
      return {
        hasAuth: typeof window.firebase !== 'undefined' || document.documentElement.innerHTML.includes('firebase'),
        consoleMessages: window.__consoleMessages || [],
      };
    });

    console.log('   Firebase Status:', this.report.firebase);
  }

  async checkFeatureParity() {
    console.log('📱 Checking Mobile App Feature Parity...\n');

    for (const [category, features] of Object.entries(EXPECTED_FEATURES)) {
      console.log(`   Checking ${category}...`);

      for (const feature of features) {
        // Search for feature across all tested pages
        const found = this.report.pages.some(page =>
          page.features.some(f =>
            f.toLowerCase().includes(feature.toLowerCase()) ||
            feature.toLowerCase().includes(f.toLowerCase())
          )
        );

        if (found) {
          this.report.appParity.implemented.push(`${category}: ${feature}`);
        } else {
          this.report.appParity.missing.push(`${category}: ${feature}`);
        }
      }
    }

    console.log(`   ✅ Implemented: ${this.report.appParity.implemented.length}`);
    console.log(`   ❌ Missing: ${this.report.appParity.missing.length}\n`);
  }

  generateMarkdownReport() {
    const { report } = this;

    let md = `# CaddyAI Website Audit Report\n\n`;
    md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
    md += `**Site URL:** ${report.siteUrl}\n\n`;

    md += `## Executive Summary\n\n`;
    md += `- **Total Pages Tested:** ${report.summary.totalPages}\n`;
    md += `- **Working Pages:** ${report.summary.workingPages}\n`;
    md += `- **Broken Pages:** ${report.summary.brokenPages}\n`;
    md += `- **Console Errors:** ${report.summary.consoleErrors}\n`;
    md += `- **Console Warnings:** ${report.summary.consoleWarnings}\n`;
    md += `- **Firebase Initialized:** ${report.summary.firebaseInitialized ? '✅ Yes' : '❌ No'}\n\n`;

    md += `## Firebase Integration Status\n\n`;
    md += `**Initialized:** ${report.firebase.initialized ? '✅ Yes' : '❌ No'}\n\n`;

    if (report.firebase.errors.length > 0) {
      md += `### Firebase Errors\n\n`;
      report.firebase.errors.forEach(err => {
        md += `- ❌ ${err}\n`;
      });
      md += `\n`;
    }

    md += `## Page Analysis\n\n`;
    report.pages.forEach(page => {
      md += `### ${page.name} (${page.path})\n\n`;
      md += `- **Status:** ${page.status === 200 ? '✅' : '❌'} ${page.status}\n`;
      md += `- **Load Time:** ${page.loadTime}ms\n`;
      md += `- **Elements:** ${page.elements.buttons} buttons, ${page.elements.links} links, ${page.elements.forms} forms, ${page.elements.images} images\n`;

      if (page.features.length > 0) {
        md += `- **Features Found:** ${page.features.join(', ')}\n`;
      }

      if (page.errors.length > 0) {
        md += `- **Errors:**\n`;
        page.errors.forEach(err => md += `  - ❌ ${err}\n`);
      }

      md += `\n`;
    });

    md += `## Mobile App Feature Parity\n\n`;

    md += `### ✅ Implemented Features (${report.appParity.implemented.length})\n\n`;
    if (report.appParity.implemented.length > 0) {
      report.appParity.implemented.forEach(f => md += `- ✅ ${f}\n`);
    } else {
      md += `*No features fully implemented yet*\n`;
    }
    md += `\n`;

    md += `### ❌ Missing Features (${report.appParity.missing.length})\n\n`;
    if (report.appParity.missing.length > 0) {
      report.appParity.missing.forEach(f => md += `- ❌ ${f}\n`);
    }
    md += `\n`;

    md += `## Design Analysis\n\n`;
    md += `### Images\n\n`;
    md += `- **Total Images:** ${report.design.images.total}\n`;
    md += `- **Missing Alt Text:** ${report.design.images.missingAlt.length}\n\n`;

    if (report.design.images.missingAlt.length > 0) {
      md += `#### Images Missing Alt Text\n\n`;
      report.design.images.missingAlt.slice(0, 10).forEach(src => {
        md += `- ${src}\n`;
      });
      if (report.design.images.missingAlt.length > 10) {
        md += `- ... and ${report.design.images.missingAlt.length - 10} more\n`;
      }
      md += `\n`;
    }

    md += `## Recommendations\n\n`;
    md += `### High Priority\n\n`;

    if (!report.firebase.initialized) {
      md += `1. ❌ **Firebase not initializing** - Authentication and data sync will not work\n`;
    }

    if (report.appParity.missing.length > report.appParity.implemented.length) {
      md += `1. ❌ **Low feature parity** - Most mobile app features are missing from web\n`;
    }

    if (report.summary.brokenPages > 0) {
      md += `1. ❌ **${report.summary.brokenPages} broken pages** - Fix page errors\n`;
    }

    md += `\n### Medium Priority\n\n`;

    if (report.design.images.missingAlt.length > 0) {
      md += `1. ⚠️ **${report.design.images.missingAlt.length} images missing alt text** - Add for accessibility\n`;
    }

    if (report.summary.consoleErrors > 0) {
      md += `1. ⚠️ **${report.summary.consoleErrors} console errors** - Review and fix\n`;
    }

    md += `\n### Key Features to Implement\n\n`;

    const priorityFeatures = [
      'User Profile with Handicap and Shot Shape',
      'Club Management (26 clubs with distances)',
      'Course Search and Favorites',
      'Round Tracking and History',
      'Statistics Dashboard',
      'Data Sync with Mobile App',
    ];

    priorityFeatures.forEach(feature => {
      const implemented = report.appParity.implemented.some(f =>
        f.toLowerCase().includes(feature.toLowerCase())
      );
      md += `- ${implemented ? '✅' : '❌'} ${feature}\n`;
    });

    md += `\n---\n\n`;
    md += `*This report was automatically generated by the CaddyAI Site Audit Script*\n`;

    return md;
  }

  async run() {
    try {
      await this.init();

      // Test all pages
      this.report.summary.totalPages = PAGES_TO_TEST.length;

      for (const pageInfo of PAGES_TO_TEST) {
        await this.testPage(pageInfo);
      }

      // Check Firebase
      await this.checkFirebaseIntegration();

      // Check feature parity
      await this.checkFeatureParity();

      // Generate reports
      console.log('📝 Generating Report...\n');

      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      // Save JSON report
      const jsonPath = path.join(OUTPUT_DIR, 'audit-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
      console.log(`✅ JSON report saved: ${jsonPath}`);

      // Save Markdown report
      const mdReport = this.generateMarkdownReport();
      const mdPath = path.join(OUTPUT_DIR, 'audit-report.md');
      fs.writeFileSync(mdPath, mdReport);
      console.log(`✅ Markdown report saved: ${mdPath}`);

      console.log('\n🎉 Audit Complete!\n');

      // Print summary
      console.log('Summary:');
      console.log(`  Pages Working: ${this.report.summary.workingPages}/${this.report.summary.totalPages}`);
      console.log(`  Firebase: ${this.report.firebase.initialized ? '✅ Working' : '❌ Not Working'}`);
      console.log(`  Features Implemented: ${this.report.appParity.implemented.length}`);
      console.log(`  Features Missing: ${this.report.appParity.missing.length}`);

    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SiteAuditor();
  auditor.run().catch(console.error);
}

module.exports = SiteAuditor;
