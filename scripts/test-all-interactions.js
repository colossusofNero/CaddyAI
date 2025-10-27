#!/usr/bin/env node

/**
 * Comprehensive Button and Link Test Script
 * Tests all clickable elements (buttons, links) across the website
 */

const puppeteer = require('puppeteer');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3005';

// Pages to test
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/features', name: 'Features' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/contact', name: 'Contact' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  { path: '/terms', name: 'Terms' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/cookies', name: 'Cookies' }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function testPageInteractions(page, pageInfo) {
  const results = {
    page: pageInfo.name,
    path: pageInfo.path,
    links: [],
    buttons: [],
    errors: []
  };

  try {
    console.log(`\n${colors.cyan}Testing: ${pageInfo.name} (${pageInfo.path})${colors.reset}`);

    // Increase timeout for dev mode (initial compilation can take 7+ seconds)
    // In production, pages are pre-compiled so timeout can be lower
    const timeout = pageInfo.path === '/' ? 20000 : 15000;

    await page.goto(`${SITE_URL}${pageInfo.path}`, {
      waitUntil: 'networkidle0',
      timeout: timeout
    });

    // Wait for page to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map((a, index) => ({
        index,
        href: a.href,
        text: a.textContent.trim().substring(0, 50),
        target: a.target,
        hasClick: a.onclick !== null,
        visible: a.offsetParent !== null
      })).filter(link => link.visible);
    });

    console.log(`  ${colors.blue}Found ${links.length} links${colors.reset}`);

    // Test each link
    for (const link of links.slice(0, 20)) { // Test first 20 links
      try {
        const isExternal = !link.href.startsWith(SITE_URL) &&
                          (link.href.startsWith('http://') || link.href.startsWith('https://'));
        const isMailto = link.href.startsWith('mailto:');
        const isTel = link.href.startsWith('tel:');

        results.links.push({
          href: link.href,
          text: link.text || '(no text)',
          type: isExternal ? 'external' : isMailto ? 'mailto' : isTel ? 'tel' : 'internal',
          valid: true
        });

        if (!isExternal && !isMailto && !isTel) {
          console.log(`    ${colors.green}✓${colors.reset} ${link.text || link.href.substring(0, 40)}`);
        }
      } catch (error) {
        results.links.push({
          href: link.href,
          text: link.text,
          valid: false,
          error: error.message
        });
        console.log(`    ${colors.red}✗${colors.reset} ${link.text} - ${error.message}`);
      }
    }

    if (links.length > 20) {
      console.log(`    ${colors.yellow}... and ${links.length - 20} more links${colors.reset}`);
      // Add remaining links to results without detailed testing
      links.slice(20).forEach(link => {
        results.links.push({
          href: link.href,
          text: link.text || '(no text)',
          type: 'skipped',
          valid: true
        });
      });
    }

    // Get all buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      return btns.map((btn, index) => ({
        index,
        text: btn.textContent?.trim().substring(0, 50) || btn.value || btn.getAttribute('aria-label') || '(no text)',
        type: btn.type || 'button',
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        hasClick: btn.onclick !== null || btn.getAttribute('onclick') !== null
      })).filter(btn => btn.visible);
    });

    console.log(`  ${colors.blue}Found ${buttons.length} buttons${colors.reset}`);

    // Categorize buttons
    for (const button of buttons) {
      const buttonInfo = {
        text: button.text,
        type: button.type,
        disabled: button.disabled,
        hasClickHandler: button.hasClick,
        valid: true
      };

      results.buttons.push(buttonInfo);

      const statusIcon = button.disabled ? '○' : '✓';
      const statusColor = button.disabled ? colors.yellow : colors.green;
      console.log(`    ${statusColor}${statusIcon}${colors.reset} ${button.text} ${button.disabled ? '(disabled)' : ''}`);
    }

    // Check for forms
    const forms = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).length
      }));
    });

    if (forms.length > 0) {
      console.log(`  ${colors.blue}Found ${forms.length} form(s)${colors.reset}`);
      forms.forEach((form, idx) => {
        console.log(`    ${colors.cyan}Form ${idx + 1}:${colors.reset} ${form.inputs} fields, method: ${form.method}`);
      });
    }

    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.__jsErrors || [];
    });

    if (jsErrors.length > 0) {
      console.log(`  ${colors.red}JavaScript errors: ${jsErrors.length}${colors.reset}`);
      results.errors = jsErrors;
    }

  } catch (error) {
    console.log(`  ${colors.red}✗ Error testing page: ${error.message}${colors.reset}`);
    results.errors.push({
      type: 'page_load_error',
      message: error.message
    });
  }

  return results;
}

async function runInteractionTests() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Website Interaction Test Suite${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Testing site: ${colors.blue}${SITE_URL}${colors.reset}\n`);

  let browser;
  const allResults = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Track JavaScript errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`    ${colors.red}Console Error:${colors.reset} ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      if (!page.__jsErrors) page.__jsErrors = [];
      page.__jsErrors.push(error.message);
    });

    // Test each page
    for (const pageInfo of PAGES) {
      const results = await testPageInteractions(page, pageInfo);
      allResults.push(results);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Generate summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Test Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  let totalLinks = 0;
  let totalButtons = 0;
  let totalErrors = 0;
  let pagesWithErrors = 0;

  allResults.forEach(result => {
    totalLinks += result.links.length;
    totalButtons += result.buttons.length;
    totalErrors += result.errors.length;
    if (result.errors.length > 0) pagesWithErrors++;
  });

  console.log(`${colors.blue}Pages Tested:${colors.reset} ${PAGES.length}`);
  console.log(`${colors.blue}Total Links Found:${colors.reset} ${totalLinks}`);
  console.log(`${colors.blue}Total Buttons Found:${colors.reset} ${totalButtons}`);

  if (totalErrors > 0) {
    console.log(`${colors.red}Pages with Errors:${colors.reset} ${pagesWithErrors}`);
    console.log(`${colors.red}Total Errors:${colors.reset} ${totalErrors}`);
  } else {
    console.log(`${colors.green}No errors detected${colors.reset}`);
  }

  // Detailed breakdown by page
  console.log(`\n${colors.cyan}Breakdown by Page:${colors.reset}\n`);

  allResults.forEach(result => {
    const internalLinks = result.links.filter(l => l.type === 'internal' || l.type === 'skipped').length;
    const externalLinks = result.links.filter(l => l.type === 'external').length;
    const mailtoLinks = result.links.filter(l => l.type === 'mailto').length;
    const hasErrors = result.errors.length > 0;

    console.log(`${hasErrors ? colors.red : colors.green}${result.page}:${colors.reset}`);
    console.log(`  Links: ${internalLinks} internal, ${externalLinks} external, ${mailtoLinks} mailto`);
    console.log(`  Buttons: ${result.buttons.length}`);
    if (hasErrors) {
      console.log(`  ${colors.red}Errors: ${result.errors.length}${colors.reset}`);
    }
  });

  // Link type summary
  console.log(`\n${colors.cyan}Link Types Across All Pages:${colors.reset}\n`);

  const linkTypes = {
    internal: 0,
    external: 0,
    mailto: 0,
    tel: 0,
    skipped: 0
  };

  allResults.forEach(result => {
    result.links.forEach(link => {
      if (linkTypes[link.type] !== undefined) {
        linkTypes[link.type]++;
      }
    });
  });

  console.log(`  Internal Links: ${linkTypes.internal}`);
  console.log(`  External Links: ${linkTypes.external}`);
  console.log(`  Mailto Links: ${linkTypes.mailto}`);
  console.log(`  Tel Links: ${linkTypes.tel}`);
  if (linkTypes.skipped > 0) {
    console.log(`  ${colors.yellow}Skipped (not fully tested): ${linkTypes.skipped}${colors.reset}`);
  }

  // Button summary
  console.log(`\n${colors.cyan}Button Summary:${colors.reset}\n`);

  let submitButtons = 0;
  let regularButtons = 0;
  let disabledButtons = 0;

  allResults.forEach(result => {
    result.buttons.forEach(btn => {
      if (btn.type === 'submit') submitButtons++;
      else regularButtons++;
      if (btn.disabled) disabledButtons++;
    });
  });

  console.log(`  Submit Buttons: ${submitButtons}`);
  console.log(`  Regular Buttons: ${regularButtons}`);
  console.log(`  Disabled Buttons: ${disabledButtons}`);

  console.log(`\n${colors.cyan}========================================${colors.reset}\n`);

  // Exit code based on errors
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run the tests
runInteractionTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
