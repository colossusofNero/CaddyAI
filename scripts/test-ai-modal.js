#!/usr/bin/env node

/**
 * Test AI Club Selection Modal Integration
 */

const puppeteer = require('puppeteer');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testAIModal() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   AI Modal Integration Test${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Testing site: ${colors.blue}${SITE_URL}${colors.reset}\n`);

  let browser;
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleMessages = [];
    const errors = [];

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        console.log(`    ${colors.red}Console Error:${colors.reset} ${text}`);
      } else if (text.includes('[Features]') || text.includes('[AIClubSelectionModal]')) {
        console.log(`    ${colors.blue}Debug:${colors.reset} ${text}`);
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log(`    ${colors.red}Page Error:${colors.reset} ${error.message}`);
    });

    // Test 1: Load features page
    console.log(`${colors.cyan}\nTest 1: Load features page${colors.reset}`);
    try {
      await page.goto(`${SITE_URL}/features`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`  ${colors.green}✓ Page loaded${colors.reset}`);
      results.passed++;
      results.tests.push({ name: 'Page load', status: 'passed' });
    } catch (error) {
      console.log(`  ${colors.red}✗ Failed to load page: ${error.message}${colors.reset}`);
      results.failed++;
      results.tests.push({ name: 'Page load', status: 'failed', error: error.message });
      throw error;
    }

    // Test 2: Check for AI feature card
    console.log(`${colors.cyan}\nTest 2: Check for AI feature card${colors.reset}`);
    const hasAIFeature = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('a[href*="ai-selection"], button'));
      return cards.some(el =>
        el.textContent.includes('AI-Powered Club Selection') ||
        el.textContent.includes('AI Powered Club Selection')
      );
    });

    if (hasAIFeature) {
      console.log(`  ${colors.green}✓ AI feature card found${colors.reset}`);
      results.passed++;
      results.tests.push({ name: 'AI feature card exists', status: 'passed' });
    } else {
      console.log(`  ${colors.yellow}⚠ AI feature card not found${colors.reset}`);
      results.warnings++;
      results.tests.push({ name: 'AI feature card exists', status: 'warning' });
    }

    // Test 3: Navigate with hash
    console.log(`${colors.cyan}\nTest 3: Navigate with #ai-selection hash${colors.reset}`);
    try {
      await page.goto(`${SITE_URL}/features#ai-selection`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector('[class*="AIClubSelection"]') ||
                      document.querySelector('[class*="fixed"][class*="z-"]');
        return modal !== null && modal.offsetParent !== null;
      });

      if (modalVisible) {
        console.log(`  ${colors.green}✓ Modal opened via hash navigation${colors.reset}`);
        results.passed++;
        results.tests.push({ name: 'Hash navigation opens modal', status: 'passed' });
      } else {
        console.log(`  ${colors.red}✗ Modal not visible after hash navigation${colors.reset}`);
        results.failed++;
        results.tests.push({ name: 'Hash navigation opens modal', status: 'failed' });
      }
    } catch (error) {
      console.log(`  ${colors.red}✗ Hash navigation failed: ${error.message}${colors.reset}`);
      results.failed++;
      results.tests.push({ name: 'Hash navigation opens modal', status: 'failed', error: error.message });
    }

    // Test 4: Check skill level buttons
    console.log(`${colors.cyan}\nTest 4: Check skill level buttons${colors.reset}`);
    const skillLevels = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn =>
        ['Beginner', 'Intermediate', 'Advanced', 'Pro', 'Tour Pro'].some(level =>
          btn.textContent.includes(level)
        )
      ).map(btn => btn.textContent.trim().split('\n')[0]);
    });

    if (skillLevels.length >= 5) {
      console.log(`  ${colors.green}✓ Found ${skillLevels.length} skill level buttons${colors.reset}`);
      skillLevels.forEach(level => {
        console.log(`    - ${level}`);
      });
      results.passed++;
      results.tests.push({ name: 'Skill level buttons present', status: 'passed' });
    } else {
      console.log(`  ${colors.yellow}⚠ Expected 5 skill levels, found ${skillLevels.length}${colors.reset}`);
      results.warnings++;
      results.tests.push({ name: 'Skill level buttons present', status: 'warning' });
    }

    // Test 5: Click a skill level
    console.log(`${colors.cyan}\nTest 5: Test skill level selection${colors.reset}`);
    try {
      const skillButton = await page.$('button::-p-text(Intermediate)');
      if (skillButton) {
        await skillButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const levelSelected = await page.evaluate(() => {
          const heading = document.querySelector('h2');
          return heading ? heading.textContent.includes('Level Selected') : false;
        });

        if (levelSelected) {
          console.log(`  ${colors.green}✓ Skill level selection works${colors.reset}`);
          results.passed++;
          results.tests.push({ name: 'Skill level selection', status: 'passed' });
        } else {
          console.log(`  ${colors.yellow}⚠ Level selected but heading not updated${colors.reset}`);
          results.warnings++;
          results.tests.push({ name: 'Skill level selection', status: 'warning' });
        }
      } else {
        console.log(`  ${colors.yellow}⚠ Could not find skill level button${colors.reset}`);
        results.warnings++;
        results.tests.push({ name: 'Skill level selection', status: 'warning' });
      }
    } catch (error) {
      console.log(`  ${colors.red}✗ Skill level selection failed: ${error.message}${colors.reset}`);
      results.failed++;
      results.tests.push({ name: 'Skill level selection', status: 'failed', error: error.message });
    }

    // Test 6: Check for ElevenLabs integration
    console.log(`${colors.cyan}\nTest 6: Check ElevenLabs integration${colors.reset}`);
    const elevenLabsCheck = await page.evaluate(() => {
      const script = document.querySelector('script[src*="elevenlabs"]');
      const widget = document.querySelector('elevenlabs-convai');
      const errorMessage = document.querySelector('[class*="red"]');

      return {
        scriptLoaded: script !== null,
        widgetPresent: widget !== null,
        errorShown: errorMessage !== null && errorMessage.textContent.includes('Configuration Required')
      };
    });

    if (elevenLabsCheck.scriptLoaded) {
      console.log(`  ${colors.green}✓ ElevenLabs script loaded${colors.reset}`);
      results.passed++;
    } else {
      console.log(`  ${colors.yellow}⚠ ElevenLabs script not loaded${colors.reset}`);
      results.warnings++;
    }

    if (elevenLabsCheck.widgetPresent) {
      console.log(`  ${colors.green}✓ ElevenLabs widget present${colors.reset}`);
      results.passed++;
    } else if (elevenLabsCheck.errorShown) {
      console.log(`  ${colors.yellow}⚠ ElevenLabs agent configuration error (expected if not configured)${colors.reset}`);
      results.warnings++;
    } else {
      console.log(`  ${colors.yellow}⚠ ElevenLabs widget status unclear${colors.reset}`);
      results.warnings++;
    }
    results.tests.push({ name: 'ElevenLabs integration', status: elevenLabsCheck.widgetPresent ? 'passed' : 'warning' });

    // Test 7: Test modal close
    console.log(`${colors.cyan}\nTest 7: Test modal close functionality${colors.reset}`);
    try {
      const closeButton = await page.$('button[aria-label="Close modal"]');
      if (closeButton) {
        await closeButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        const modalClosed = await page.evaluate(() => {
          const modal = document.querySelector('[class*="fixed"][class*="z-"]');
          return modal === null || modal.offsetParent === null;
        });

        const hashRemoved = await page.evaluate(() => {
          return !window.location.hash.includes('ai-selection');
        });

        if (modalClosed) {
          console.log(`  ${colors.green}✓ Modal closes properly${colors.reset}`);
          results.passed++;
        } else {
          console.log(`  ${colors.yellow}⚠ Modal close status unclear${colors.reset}`);
          results.warnings++;
        }

        if (hashRemoved) {
          console.log(`  ${colors.green}✓ Hash removed on close${colors.reset}`);
          results.passed++;
        } else {
          console.log(`  ${colors.yellow}⚠ Hash not removed${colors.reset}`);
          results.warnings++;
        }
        results.tests.push({ name: 'Modal close', status: modalClosed && hashRemoved ? 'passed' : 'warning' });
      } else {
        console.log(`  ${colors.yellow}⚠ Close button not found${colors.reset}`);
        results.warnings++;
        results.tests.push({ name: 'Modal close', status: 'warning' });
      }
    } catch (error) {
      console.log(`  ${colors.red}✗ Modal close test failed: ${error.message}${colors.reset}`);
      results.failed++;
      results.tests.push({ name: 'Modal close', status: 'failed', error: error.message });
    }

    // Test 8: Check for JavaScript errors
    console.log(`${colors.cyan}\nTest 8: Check for JavaScript errors${colors.reset}`);
    const criticalErrors = errors.filter(err =>
      !err.includes('ConversationalAI') && // Expected if ElevenLabs not configured
      !err.includes('Failed to fetch') // Network errors are acceptable
    );

    if (criticalErrors.length === 0) {
      console.log(`  ${colors.green}✓ No critical JavaScript errors${colors.reset}`);
      results.passed++;
      results.tests.push({ name: 'No critical errors', status: 'passed' });
    } else {
      console.log(`  ${colors.red}✗ Found ${criticalErrors.length} critical errors${colors.reset}`);
      criticalErrors.forEach(err => console.log(`    - ${err}`));
      results.failed++;
      results.tests.push({ name: 'No critical errors', status: 'failed', errors: criticalErrors });
    }

  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error.message);
    results.failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Test Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  const totalTests = results.tests.length;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  console.log(`\nSuccess Rate: ${successRate}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ All critical tests passed!${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    return 0;
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);
    return 1;
  }
}

// Run the test
testAIModal()
  .then(code => process.exit(code))
  .catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
