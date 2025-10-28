/**
 * Verification Script: RCG Valuation Design Implementation
 *
 * This script checks if the RCG design transformation has been implemented
 * by inspecting the live application for key design elements.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Expected RCG design elements
const EXPECTED_DESIGN = {
  colors: {
    'rcg-navy': '#1E2949',
    'rcg-blue': '#4A90E2',
    'rcg-light-blue': '#E8F3FF'
  },
  fonts: {
    primary: ['Inter', 'Poppins']
  },
  components: [
    'RCGLogo',
    'InfoCard',
    'SectionHeader',
    'FormField with help icons',
    'Depreciation table',
    'Pricing display with 3 options'
  ]
};

async function verifyRCGDesign(baseUrl = 'http://localhost:3000') {
  console.log('🔍 Starting RCG Design Verification...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });

  const resultsDir = path.join(__dirname, 'verification-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl,
    checks: [],
    screenshots: [],
    summary: {
      passed: 0,
      failed: 0,
      missing: []
    }
  };

  try {
    const page = await browser.newPage();

    // ==========================================
    // CHECK 1: Homepage / Landing Page
    // ==========================================
    console.log('📄 Checking Homepage...');
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });

      const screenshotPath = path.join(resultsDir, 'homepage.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push('homepage.png');

      // Check for RCG branding
      const hasRCGLogo = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('RCGV') || text.includes('RCG Valuation');
      });

      // Check for old OpenAsApp branding (should be gone)
      const hasOldBranding = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('OpenAsApp') || text.includes('open as app');
      });

      // Check computed styles for RCG colors
      const usesRCGColors = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let foundNavy = false;
        let foundBlue = false;

        for (let el of allElements) {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const color = styles.color;

          // Check for RCG Navy (#1E2949 = rgb(30, 41, 73))
          if (bgColor.includes('rgb(30, 41, 73)') || color.includes('rgb(30, 41, 73)')) {
            foundNavy = true;
          }

          // Check for RCG Blue (#4A90E2 = rgb(74, 144, 226))
          if (bgColor.includes('rgb(74, 144, 226)') || color.includes('rgb(74, 144, 226)')) {
            foundBlue = true;
          }

          if (foundNavy && foundBlue) break;
        }

        return { foundNavy, foundBlue };
      });

      // Check for Inter or Poppins fonts
      const usesRCGFonts = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        const fontFamily = styles.fontFamily.toLowerCase();
        return fontFamily.includes('inter') || fontFamily.includes('poppins');
      });

      results.checks.push({
        page: 'Homepage',
        test: 'RCG Logo Present',
        passed: hasRCGLogo,
        actual: hasRCGLogo ? 'Found RCG branding' : 'No RCG branding found'
      });

      results.checks.push({
        page: 'Homepage',
        test: 'Old Branding Removed',
        passed: !hasOldBranding,
        actual: hasOldBranding ? 'Still has OpenAsApp branding' : 'Old branding removed'
      });

      results.checks.push({
        page: 'Homepage',
        test: 'RCG Color Scheme',
        passed: usesRCGColors.foundNavy && usesRCGColors.foundBlue,
        actual: `Navy: ${usesRCGColors.foundNavy}, Blue: ${usesRCGColors.foundBlue}`
      });

      results.checks.push({
        page: 'Homepage',
        test: 'RCG Fonts (Inter/Poppins)',
        passed: usesRCGFonts,
        actual: usesRCGFonts ? 'Using RCG fonts' : 'Not using RCG fonts'
      });

    } catch (error) {
      console.log(`❌ Error checking homepage: ${error.message}`);
      results.checks.push({
        page: 'Homepage',
        test: 'Page Load',
        passed: false,
        actual: error.message
      });
    }

    // ==========================================
    // CHECK 2: Quote Form Page
    // ==========================================
    console.log('📝 Checking Quote Form...');
    try {
      // Try to navigate to quote form
      const quoteFormUrl = `${baseUrl}/quotes/new`;
      await page.goto(quoteFormUrl, { waitUntil: 'networkidle0', timeout: 10000 });

      const screenshotPath = path.join(resultsDir, 'quote-form.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push('quote-form.png');

      // Check for RCG-style card layout
      const hasCardLayout = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="rounded"], [class*="shadow"], [class*="border"]');
        return cards.length > 3; // Should have multiple card-style sections
      });

      // Check for help icons (info icons with tooltips)
      const hasHelpIcons = await page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('info') || text.includes('help') || text.includes('tooltip');
      });

      // Check for proper form field structure
      const hasFormFields = await page.evaluate(() => {
        const labels = document.querySelectorAll('label');
        const inputs = document.querySelectorAll('input, select, textarea');
        return labels.length > 5 && inputs.length > 5;
      });

      // Check for RCG-style section headers
      const hasSectionHeaders = await page.evaluate(() => {
        const headings = document.querySelectorAll('h2, h3');
        return headings.length > 2;
      });

      results.checks.push({
        page: 'Quote Form',
        test: 'Card-based Layout',
        passed: hasCardLayout,
        actual: hasCardLayout ? 'Has card layout' : 'Missing card layout'
      });

      results.checks.push({
        page: 'Quote Form',
        test: 'Help Icons/Tooltips',
        passed: hasHelpIcons,
        actual: hasHelpIcons ? 'Has help icons' : 'Missing help icons'
      });

      results.checks.push({
        page: 'Quote Form',
        test: 'Proper Form Structure',
        passed: hasFormFields,
        actual: hasFormFields ? 'Has form fields' : 'Missing form fields'
      });

      results.checks.push({
        page: 'Quote Form',
        test: 'Section Headers',
        passed: hasSectionHeaders,
        actual: hasSectionHeaders ? 'Has section headers' : 'Missing section headers'
      });

    } catch (error) {
      console.log(`❌ Error checking quote form: ${error.message}`);
      results.checks.push({
        page: 'Quote Form',
        test: 'Page Load',
        passed: false,
        actual: `Could not access: ${error.message}`
      });
    }

    // ==========================================
    // CHECK 3: Dashboard/Quotes List
    // ==========================================
    console.log('📊 Checking Dashboard...');
    try {
      const dashboardUrl = `${baseUrl}/dashboard`;
      await page.goto(dashboardUrl, { waitUntil: 'networkidle0', timeout: 10000 });

      const screenshotPath = path.join(resultsDir, 'dashboard.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.screenshots.push('dashboard.png');

      // Check for RCG styling
      const hasRCGStyling = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        const bgColor = styles.backgroundColor;

        // Check for gradient or light background
        return bgColor.includes('rgb(249, 250, 251)') ||
               bgColor.includes('rgb(243, 244, 246)') ||
               body.innerHTML.includes('gradient');
      });

      results.checks.push({
        page: 'Dashboard',
        test: 'RCG Background Styling',
        passed: hasRCGStyling,
        actual: hasRCGStyling ? 'Has RCG styling' : 'Missing RCG styling'
      });

    } catch (error) {
      console.log(`❌ Error checking dashboard: ${error.message}`);
      results.checks.push({
        page: 'Dashboard',
        test: 'Page Load',
        passed: false,
        actual: `Could not access: ${error.message}`
      });
    }

    // ==========================================
    // CHECK 4: Check Tailwind Config
    // ==========================================
    console.log('⚙️ Checking Tailwind Configuration...');
    const tailwindPath = path.join(__dirname, '..', 'tailwind.config.ts');
    if (fs.existsSync(tailwindPath)) {
      const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

      const hasRCGNavy = tailwindContent.includes('1E2949') || tailwindContent.includes('rcg-navy');
      const hasRCGBlue = tailwindContent.includes('4A90E2') || tailwindContent.includes('rcg-blue');
      const hasInterFont = tailwindContent.includes('Inter');
      const hasPoppinsFont = tailwindContent.includes('Poppins');

      results.checks.push({
        page: 'Config',
        test: 'Tailwind - RCG Navy Color',
        passed: hasRCGNavy,
        actual: hasRCGNavy ? 'Configured' : 'Missing'
      });

      results.checks.push({
        page: 'Config',
        test: 'Tailwind - RCG Blue Color',
        passed: hasRCGBlue,
        actual: hasRCGBlue ? 'Configured' : 'Missing'
      });

      results.checks.push({
        page: 'Config',
        test: 'Tailwind - Inter Font',
        passed: hasInterFont,
        actual: hasInterFont ? 'Configured' : 'Missing'
      });

      results.checks.push({
        page: 'Config',
        test: 'Tailwind - Poppins Font',
        passed: hasPoppinsFont,
        actual: hasPoppinsFont ? 'Configured' : 'Missing'
      });
    }

    // ==========================================
    // CHECK 5: Check for RCG Components
    // ==========================================
    console.log('🧩 Checking for RCG Components...');
    const componentsToCheck = [
      { name: 'RCGLogo', path: 'components/layout/logo.tsx' },
      { name: 'InfoCard', path: 'components/ui/info-card.tsx' },
      { name: 'SectionHeader', path: 'components/layout/section-header.tsx' },
      { name: 'FormField', path: 'components/ui/form-field.tsx' },
      { name: 'PricingDisplay', path: 'components/quotes/pricing-display.tsx' },
      { name: 'DepreciationTable', path: 'components/quotes/depreciation-table.tsx' }
    ];

    for (const component of componentsToCheck) {
      const componentPath = path.join(__dirname, '..', component.path);
      const exists = fs.existsSync(componentPath);

      results.checks.push({
        page: 'Components',
        test: `${component.name} Component`,
        passed: exists,
        actual: exists ? 'Exists' : 'Missing'
      });

      if (!exists) {
        results.summary.missing.push(component.name);
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await browser.close();
  }

  // ==========================================
  // GENERATE REPORT
  // ==========================================

  // Calculate summary
  results.checks.forEach(check => {
    if (check.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  });

  const reportPath = path.join(resultsDir, 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Generate readable report
  const readableReport = generateReadableReport(results);
  const readableReportPath = path.join(resultsDir, 'verification-report.txt');
  fs.writeFileSync(readableReportPath, readableReport);

  console.log('\n' + readableReport);
  console.log(`\n📁 Results saved to: ${resultsDir}`);
  console.log(`📸 Screenshots: ${results.screenshots.length} captured`);

  return results;
}

function generateReadableReport(results) {
  let report = '═══════════════════════════════════════════════════════\n';
  report += '   RCG VALUATION DESIGN VERIFICATION REPORT\n';
  report += '═══════════════════════════════════════════════════════\n\n';
  report += `Timestamp: ${results.timestamp}\n`;
  report += `Base URL: ${results.baseUrl}\n\n`;

  report += '───────────────────────────────────────────────────────\n';
  report += '  SUMMARY\n';
  report += '───────────────────────────────────────────────────────\n';
  report += `✅ Passed: ${results.summary.passed}\n`;
  report += `❌ Failed: ${results.summary.failed}\n`;
  report += `📊 Total Checks: ${results.checks.length}\n`;
  report += `🎯 Pass Rate: ${((results.summary.passed / results.checks.length) * 100).toFixed(1)}%\n\n`;

  if (results.summary.missing.length > 0) {
    report += '❌ Missing Components:\n';
    results.summary.missing.forEach(comp => {
      report += `   • ${comp}\n`;
    });
    report += '\n';
  }

  report += '───────────────────────────────────────────────────────\n';
  report += '  DETAILED RESULTS\n';
  report += '───────────────────────────────────────────────────────\n\n';

  // Group by page
  const pageGroups = {};
  results.checks.forEach(check => {
    if (!pageGroups[check.page]) {
      pageGroups[check.page] = [];
    }
    pageGroups[check.page].push(check);
  });

  Object.keys(pageGroups).forEach(page => {
    report += `📄 ${page}\n`;
    report += '─'.repeat(55) + '\n';

    pageGroups[page].forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      report += `${icon} ${check.test}\n`;
      report += `   Result: ${check.actual}\n`;
    });

    report += '\n';
  });

  report += '═══════════════════════════════════════════════════════\n';
  report += '  CONCLUSION\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  const passRate = (results.summary.passed / results.checks.length) * 100;

  if (passRate < 50) {
    report += '❌ INCOMPLETE: The RCG design transformation has NOT been\n';
    report += '   implemented. Most design elements are missing.\n\n';
    report += '   Recommendation: Follow the Agent Prompts to implement\n';
    report += '   the complete RCG design system.\n';
  } else if (passRate < 80) {
    report += '⚠️  PARTIAL: Some RCG design elements are present, but\n';
    report += '   significant work remains to match the target design.\n\n';
    report += '   Recommendation: Review failed checks and implement\n';
    report += '   missing components and styling.\n';
  } else {
    report += '✅ COMPLETE: Most RCG design elements are implemented.\n';
    report += '   Minor refinements may be needed.\n\n';
  }

  report += '═══════════════════════════════════════════════════════\n';

  return report;
}

// Run verification
const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
verifyRCGDesign(baseUrl)
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
