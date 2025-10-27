#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * Tests authentication form fields and Firebase integration
 */

const puppeteer = require('puppeteer');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3005';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testAuthForms() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Authentication Flow Test${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
  console.log(`Testing site: ${colors.blue}${SITE_URL}${colors.reset}\n`);

  let browser;
  const results = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set up console listener
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Firebase Debug]') || text.includes('[Auth Debug]')) {
        console.log(`  ${colors.cyan}Console:${colors.reset} ${text}`);
      }
    });

    // Test 1: Signup page form fields
    console.log(`${colors.yellow}Test 1: Signup Form Fields${colors.reset}`);
    await page.goto(`${SITE_URL}/signup`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('form', { timeout: 5000 });

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    const signupFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name]'));
      return inputs.map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder
      }));
    });

    console.log(`  Found ${signupFields.length} form fields:`);
    signupFields.forEach(field => {
      console.log(`    ${colors.green}✓${colors.reset} ${field.name} (${field.type})`);
    });

    const hasDisplayName = signupFields.some(f => f.name === 'displayName');
    const hasEmail = signupFields.some(f => f.name === 'email');
    const hasPassword = signupFields.some(f => f.name === 'password');
    const hasConfirmPassword = signupFields.some(f => f.name === 'confirmPassword');

    results.push({
      test: 'Signup Form - displayName field',
      passed: hasDisplayName
    });
    results.push({
      test: 'Signup Form - email field',
      passed: hasEmail
    });
    results.push({
      test: 'Signup Form - password field',
      passed: hasPassword
    });
    results.push({
      test: 'Signup Form - confirmPassword field',
      passed: hasConfirmPassword
    });

    if (hasDisplayName && hasEmail && hasPassword && hasConfirmPassword) {
      console.log(`  ${colors.green}✓ All required fields present${colors.reset}\n`);
    } else {
      console.log(`  ${colors.red}✗ Missing required fields${colors.reset}\n`);
    }

    // Test 2: Login page form fields
    console.log(`${colors.yellow}Test 2: Login Form Fields${colors.reset}`);
    await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('form', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const loginFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name]'));
      return inputs.map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder
      }));
    });

    console.log(`  Found ${loginFields.length} form fields:`);
    loginFields.forEach(field => {
      console.log(`    ${colors.green}✓${colors.reset} ${field.name} (${field.type})`);
    });

    const loginHasEmail = loginFields.some(f => f.name === 'email');
    const loginHasPassword = loginFields.some(f => f.name === 'password');

    results.push({
      test: 'Login Form - email field',
      passed: loginHasEmail
    });
    results.push({
      test: 'Login Form - password field',
      passed: loginHasPassword
    });

    if (loginHasEmail && loginHasPassword) {
      console.log(`  ${colors.green}✓ All required fields present${colors.reset}\n`);
    } else {
      console.log(`  ${colors.red}✗ Missing required fields${colors.reset}\n`);
    }

    // Test 3: Firebase initialization
    console.log(`${colors.yellow}Test 3: Firebase Initialization${colors.reset}`);
    const firebaseInitialized = await page.evaluate(() => {
      return typeof window !== 'undefined' &&
             window.console &&
             localStorage.getItem('firebase:host:caddyai-aaabd.firebaseapp.com') !== null;
    });

    results.push({
      test: 'Firebase initialization',
      passed: firebaseInitialized
    });

    if (firebaseInitialized) {
      console.log(`  ${colors.green}✓ Firebase initialized${colors.reset}\n`);
    } else {
      console.log(`  ${colors.yellow}⚠ Firebase state unclear (may be normal)${colors.reset}\n`);
    }

    // Test 4: Form validation
    console.log(`${colors.yellow}Test 4: Form Validation${colors.reset}`);
    await page.goto(`${SITE_URL}/signup`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('form', { timeout: 5000 });

    // Try to submit empty form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hasErrorMessages = await page.evaluate(() => {
        const errors = document.querySelectorAll('[role="alert"], .text-red-500, .error');
        return errors.length > 0;
      });

      results.push({
        test: 'Form validation on submit',
        passed: hasErrorMessages
      });

      if (hasErrorMessages) {
        console.log(`  ${colors.green}✓ Validation errors displayed${colors.reset}\n`);
      } else {
        console.log(`  ${colors.yellow}⚠ No validation errors found${colors.reset}\n`);
      }
    }

    // Test 5: Social auth buttons
    console.log(`${colors.yellow}Test 5: Social Authentication${colors.reset}`);
    await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const socialButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => btn.textContent.includes('Google') || btn.textContent.includes('Apple'))
        .map(btn => btn.textContent.trim());
    });

    console.log(`  Found ${socialButtons.length} social auth buttons:`);
    socialButtons.forEach(text => {
      console.log(`    ${colors.green}✓${colors.reset} ${text}`);
    });

    results.push({
      test: 'Social auth buttons present',
      passed: socialButtons.length > 0
    });

    console.log();

  } catch (error) {
    console.error(`${colors.red}Error during testing:${colors.reset}`, error.message);
    results.push({
      test: 'Test execution',
      passed: false,
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Test Results${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.test}${colors.reset}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log();
  console.log(`Total tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  console.log(`\n${colors.cyan}========================================${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
testAuthForms().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
