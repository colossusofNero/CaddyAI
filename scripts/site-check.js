/**
 * Comprehensive Site Check using Puppeteer
 * Tests all pages, checks for errors, validates functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../test-results/screenshots');
const REPORT_FILE = path.join(__dirname, '../test-results/site-check-report.json');

// Pages to test
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/features', name: 'Features' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/courses', name: 'Courses' },
  { path: '/careers', name: 'Careers' },
  { path: '/press', name: 'Press' },
  { path: '/docs', name: 'Documentation' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/cookies', name: 'Cookie Policy' },
  { path: '/integrations', name: 'Integrations' },
  { path: '/contact', name: 'Contact' },
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  pages: []
};

// Ensure directories exist
function ensureDirectories() {
  const dirs = [
    path.dirname(SCREENSHOT_DIR),
    SCREENSHOT_DIR
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Check a single page
async function checkPage(browser, pageConfig) {
  const page = await browser.newPage();
  const pageResult = {
    name: pageConfig.name,
    path: pageConfig.path,
    url: `${BASE_URL}${pageConfig.path}`,
    status: 'passed',
    errors: [],
    warnings: [],
    consoleMessages: [],
    networkErrors: [],
    performance: {},
    accessibility: {},
    screenshot: null
  };

  try {
    console.log(`\nTesting: ${pageConfig.name} (${pageConfig.path})`);

    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      pageResult.consoleMessages.push({
        type,
        text,
        timestamp: new Date().toISOString()
      });

      if (type === 'error') {
        pageResult.errors.push(`Console Error: ${text}`);
        console.log(`  ❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        pageResult.warnings.push(`Console Warning: ${text}`);
        console.log(`  ⚠️  Console Warning: ${text}`);
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      pageResult.errors.push(`Page Error: ${error.message}`);
      console.log(`  ❌ Page Error: ${error.message}`);
    });

    // Listen for failed requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      pageResult.networkErrors.push({
        url: request.url(),
        error: failure ? failure.errorText : 'Unknown error'
      });
      console.log(`  ⚠️  Request Failed: ${request.url()}`);
    });

    // Navigate to page
    const startTime = Date.now();
    const response = await page.goto(pageResult.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    const loadTime = Date.now() - startTime;

    // Check HTTP status
    const status = response.status();
    pageResult.performance.httpStatus = status;
    pageResult.performance.loadTime = loadTime;

    if (status !== 200) {
      pageResult.errors.push(`HTTP Status: ${status}`);
      pageResult.status = 'failed';
      console.log(`  ❌ HTTP Status: ${status}`);
    } else {
      console.log(`  ✓ HTTP Status: ${status}`);
      console.log(`  ✓ Load Time: ${loadTime}ms`);
    }

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get page title
    const title = await page.title();
    pageResult.title = title;
    console.log(`  ✓ Title: ${title}`);

    // Check for basic content
    const bodyText = await page.evaluate(() => document.body.innerText);
    pageResult.hasContent = bodyText.length > 100;

    if (!pageResult.hasContent) {
      pageResult.warnings.push('Page has very little content');
      console.log(`  ⚠️  Warning: Page has very little content`);
    }

    // Performance metrics
    const metrics = await page.metrics();
    pageResult.performance.metrics = {
      domContentLoaded: metrics.DomContentLoaded,
      layoutCount: metrics.LayoutCount,
      scriptDuration: metrics.ScriptDuration
    };

    // Take screenshot
    const screenshotName = `${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    pageResult.screenshot = screenshotPath;
    console.log(`  ✓ Screenshot saved: ${screenshotName}`);

    // Check for common elements
    const hasNav = await page.$('nav') !== null;
    const hasFooter = await page.$('footer') !== null;
    const hasMain = await page.$('main') !== null;

    pageResult.structure = { hasNav, hasFooter, hasMain };

    if (!hasNav) {
      pageResult.warnings.push('No <nav> element found');
      console.log(`  ⚠️  Warning: No <nav> element found`);
    }

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => !img.complete || img.naturalHeight === 0)
        .map(img => img.src);
    });

    if (brokenImages.length > 0) {
      pageResult.warnings.push(`${brokenImages.length} broken images found`);
      pageResult.brokenImages = brokenImages;
      console.log(`  ⚠️  Warning: ${brokenImages.length} broken images`);
    }

    // Check links (sample)
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.slice(0, 20).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 50)
      }));
    });
    pageResult.links = links;

    // Determine final status
    if (pageResult.errors.length > 0) {
      pageResult.status = 'failed';
    } else if (pageResult.warnings.length > 0) {
      pageResult.status = 'warning';
    }

    console.log(`  ${pageResult.status === 'passed' ? '✅' : pageResult.status === 'warning' ? '⚠️' : '❌'} Status: ${pageResult.status}`);

  } catch (error) {
    pageResult.status = 'failed';
    pageResult.errors.push(`Test Error: ${error.message}`);
    console.log(`  ❌ Test Failed: ${error.message}`);
  } finally {
    await page.close();
  }

  return pageResult;
}

// Main test function
async function runSiteCheck() {
  console.log('🚀 Starting Comprehensive Site Check');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📄 Testing ${PAGES.length} pages\n`);

  ensureDirectories();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test each page
    for (const pageConfig of PAGES) {
      const result = await checkPage(browser, pageConfig);
      results.pages.push(result);

      // Update summary
      results.summary.total++;
      if (result.status === 'passed') {
        results.summary.passed++;
      } else if (result.status === 'failed') {
        results.summary.failed++;
      } else if (result.status === 'warning') {
        results.summary.warnings++;
      }
    }

    // Save results
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    console.log(`\n📊 Report saved: ${REPORT_FILE}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages Tested: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`⚠️  Warnings: ${results.summary.warnings}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log('='.repeat(60));

    // Print failed pages
    if (results.summary.failed > 0) {
      console.log('\n❌ FAILED PAGES:');
      results.pages
        .filter(p => p.status === 'failed')
        .forEach(p => {
          console.log(`\n${p.name} (${p.path})`);
          p.errors.forEach(err => console.log(`  - ${err}`));
        });
    }

    // Print warnings
    if (results.summary.warnings > 0) {
      console.log('\n⚠️  PAGES WITH WARNINGS:');
      results.pages
        .filter(p => p.status === 'warning')
        .forEach(p => {
          console.log(`\n${p.name} (${p.path})`);
          p.warnings.forEach(warn => console.log(`  - ${warn}`));
        });
    }

  } catch (error) {
    console.error('❌ Site check failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }

  // Exit with error code if any tests failed
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

// Run the check
runSiteCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
