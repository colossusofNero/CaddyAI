#!/usr/bin/env node

/**
 * Site Health Check Script
 * Tests all critical pages and authentication functionality
 */

const http = require('http');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3005';
const TIMEOUT = 10000;

// Pages to test
const PAGES = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/contact',
  '/login',
  '/signup',
  '/dashboard',
  '/profile',
  '/clubs',
  '/terms',
  '/privacy',
  '/cookies'
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function testUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.get(url, { timeout: TIMEOUT }, (res) => {
      const responseTime = Date.now() - startTime;

      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        responseTime,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        statusText: error.message,
        responseTime: Date.now() - startTime,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        statusText: 'Request timeout',
        responseTime: TIMEOUT,
        success: false
      });
    });
  });
}

function getStatusColor(status, success) {
  if (!success) return colors.red;
  if (status >= 200 && status < 300) return colors.green;
  if (status >= 300 && status < 400) return colors.yellow;
  return colors.red;
}

async function runHealthCheck() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   CaddyAI Site Health Check${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
  console.log(`Testing site: ${colors.blue}${SITE_URL}${colors.reset}\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  // Test each page
  for (const page of PAGES) {
    const url = `${SITE_URL}${page}`;
    process.stdout.write(`Testing ${page.padEnd(20)} ... `);

    const result = await testUrl(url);
    results.push(result);

    const statusColor = getStatusColor(result.status, result.success);
    const statusIcon = result.success ? '✓' : '✗';

    console.log(
      `${statusColor}${statusIcon} ${result.status} ${result.statusText}${colors.reset} ` +
      `${colors.cyan}(${result.responseTime}ms)${colors.reset}`
    );

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  console.log(`Total pages tested: ${PAGES.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  console.log(`${colors.cyan}Avg response time: ${Math.round(avgResponseTime)}ms${colors.reset}`);

  // Detailed failures
  if (failed > 0) {
    console.log(`\n${colors.red}Failed Pages:${colors.reset}`);
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ${colors.red}✗${colors.reset} ${r.url} - ${r.statusText}`);
      });
  }

  // Performance warnings
  const slowPages = results.filter(r => r.responseTime > 3000);
  if (slowPages.length > 0) {
    console.log(`\n${colors.yellow}Slow Pages (>3s):${colors.reset}`);
    slowPages.forEach(r => {
      console.log(`  ${colors.yellow}!${colors.reset} ${r.url} - ${r.responseTime}ms`);
    });
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the health check
runHealthCheck().catch(error => {
  console.error(`${colors.red}Error running health check:${colors.reset}`, error);
  process.exit(1);
});
