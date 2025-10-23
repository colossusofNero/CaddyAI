#!/usr/bin/env node

/**
 * Extract Agent Prompts by Priority
 *
 * This helper script extracts prompts from the crawler report
 * and displays them in a format ready to copy-paste to AI agents.
 *
 * Usage:
 *   node scripts/extract-prompts.js                    # All critical issues
 *   node scripts/extract-prompts.js --severity high    # All high severity
 *   node scripts/extract-prompts.js --category a11y    # All accessibility
 *   node scripts/extract-prompts.js --limit 5          # First 5 issues
 *   node scripts/extract-prompts.js --page /login      # Issues on login page
 */

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, '../crawler-reports/issue-report.json');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    severity: null,
    category: null,
    limit: null,
    page: null,
    format: 'text', // text, json, markdown
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--severity' || arg === '-s') {
      options.severity = args[++i];
    } else if (arg === '--category' || arg === '-c') {
      options.category = args[++i];
    } else if (arg === '--limit' || arg === '-l') {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--page' || arg === '-p') {
      options.page = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  // Default to critical if no severity specified
  if (!options.severity && !options.category && !options.page) {
    options.severity = 'critical';
  }

  return options;
}

function showHelp() {
  console.log(`
Extract Agent Prompts from Crawler Report

Usage:
  node scripts/extract-prompts.js [options]

Options:
  -s, --severity <level>     Filter by severity (critical, high, medium, low)
  -c, --category <category>  Filter by category (functionality, accessibility, ui/ux, performance, seo, content)
  -p, --page <path>          Filter by page path (e.g., /login)
  -l, --limit <number>       Limit number of prompts to display
  -f, --format <format>      Output format (text, json, markdown)
  -h, --help                 Show this help message

Examples:
  # All critical issues (default)
  node scripts/extract-prompts.js

  # All high severity issues
  node scripts/extract-prompts.js --severity high

  # All accessibility issues
  node scripts/extract-prompts.js --category accessibility

  # Issues on login page
  node scripts/extract-prompts.js --page /login

  # First 3 critical issues
  node scripts/extract-prompts.js --severity critical --limit 3

  # Export as JSON
  node scripts/extract-prompts.js --format json > prompts.json
  `);
}

function loadReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('❌ Error: Report not found!');
    console.error('   Run the crawler first: node scripts/comprehensive-crawler.js');
    process.exit(1);
  }

  try {
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    return report;
  } catch (error) {
    console.error('❌ Error: Failed to parse report:', error.message);
    process.exit(1);
  }
}

function filterPrompts(prompts, issues, options) {
  let filtered = prompts;

  // Filter by severity
  if (options.severity) {
    const severity = options.severity.toLowerCase();
    filtered = filtered.filter(p =>
      p.severity.toLowerCase() === severity
    );
  }

  // Filter by category
  if (options.category) {
    const category = options.category.toLowerCase();
    filtered = filtered.filter(p =>
      p.category.toLowerCase().includes(category) ||
      category.includes(p.category.toLowerCase())
    );
  }

  // Filter by page
  if (options.page) {
    filtered = filtered.filter(p =>
      p.location.includes(options.page)
    );
  }

  // Apply limit
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

function displayTextFormat(prompts, report) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 AGENT PROMPTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Report Summary:`);
  console.log(`   Total Issues: ${report.metadata.totalIssues}`);
  console.log(`   🔴 Critical: ${report.summary.issuesBySeverity.critical}`);
  console.log(`   🟠 High: ${report.summary.issuesBySeverity.high}`);
  console.log(`   🟡 Medium: ${report.summary.issuesBySeverity.medium}`);
  console.log(`   🟢 Low: ${report.summary.issuesBySeverity.low}\n`);

  console.log(`📋 Displaying ${prompts.length} prompts:\n`);

  prompts.forEach((prompt, idx) => {
    const severityEmoji = {
      'Critical': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢',
    }[prompt.severity] || '⚪';

    console.log('───────────────────────────────────────────────────────────');
    console.log(`${severityEmoji} Prompt ${idx + 1}/${prompts.length}: ${prompt.title}`);
    console.log('───────────────────────────────────────────────────────────\n');
    console.log(prompt.prompt);
    console.log('\n');
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 USAGE INSTRUCTIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('1. Copy a prompt above');
  console.log('2. Paste it into Claude Code or your AI assistant');
  console.log('3. The agent will:');
  console.log('   - Locate the relevant files');
  console.log('   - Implement the fix');
  console.log('   - Test the changes');
  console.log('   - Verify success criteria\n');
  console.log('4. Review and commit the changes');
  console.log('5. Run the crawler again to verify the fix\n');
}

function displayJsonFormat(prompts) {
  console.log(JSON.stringify(prompts, null, 2));
}

function displayMarkdownFormat(prompts, report) {
  console.log(`# Agent Prompts\n`);
  console.log(`**Generated**: ${new Date().toISOString()}`);
  console.log(`**Total Prompts**: ${prompts.length}\n`);

  prompts.forEach((prompt, idx) => {
    console.log(`## Prompt ${idx + 1}: ${prompt.title}\n`);
    console.log(`- **Issue ID**: #${prompt.issueId}`);
    console.log(`- **Severity**: ${prompt.severity}`);
    console.log(`- **Category**: ${prompt.category}`);
    console.log(`- **Location**: ${prompt.location}\n`);
    console.log('```');
    console.log(prompt.prompt);
    console.log('```\n');
    console.log('---\n');
  });
}

function main() {
  const options = parseArgs();
  const report = loadReport();

  // Filter prompts
  const filtered = filterPrompts(report.prompts, report.issues, options);

  if (filtered.length === 0) {
    console.log('ℹ️  No prompts match the specified filters.');
    console.log('\nTry:');
    console.log('  - Different severity level');
    console.log('  - Different category');
    console.log('  - Different page');
    console.log('  - Remove filters to see all prompts');
    process.exit(0);
  }

  // Display based on format
  switch (options.format) {
    case 'json':
      displayJsonFormat(filtered);
      break;
    case 'markdown':
      displayMarkdownFormat(filtered, report);
      break;
    case 'text':
    default:
      displayTextFormat(filtered, report);
      break;
  }
}

// Run
main();
