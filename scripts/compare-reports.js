#!/usr/bin/env node

/**
 * Compare Crawler Reports
 *
 * Compares two crawler reports to track issue resolution progress
 *
 * Usage:
 *   node scripts/compare-reports.js report1.json report2.json
 */

const fs = require('fs');
const path = require('path');

function loadReport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Report not found: ${filePath}`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Error: Failed to parse report: ${filePath}`, error.message);
    process.exit(1);
  }
}

function compareReports(oldReport, newReport) {
  const comparison = {
    metadata: {
      oldTimestamp: oldReport.metadata.timestamp,
      newTimestamp: newReport.metadata.timestamp,
    },
    summary: {
      issuesFixed: 0,
      issuesAdded: 0,
      issuesUnchanged: 0,
      severityChanges: {},
    },
    issueChanges: {
      fixed: [],
      new: [],
      unchanged: [],
    },
    severityComparison: {},
    categoryComparison: {},
  };

  // Create maps for easy lookup
  const oldIssuesMap = new Map();
  oldReport.issues.forEach(issue => {
    const key = `${issue.title}|${issue.location}`;
    oldIssuesMap.set(key, issue);
  });

  const newIssuesMap = new Map();
  newReport.issues.forEach(issue => {
    const key = `${issue.title}|${issue.location}`;
    newIssuesMap.set(key, issue);
  });

  // Find fixed issues (in old but not in new)
  oldIssuesMap.forEach((issue, key) => {
    if (!newIssuesMap.has(key)) {
      comparison.issueChanges.fixed.push(issue);
      comparison.summary.issuesFixed++;
    }
  });

  // Find new issues (in new but not in old)
  newIssuesMap.forEach((issue, key) => {
    if (!oldIssuesMap.has(key)) {
      comparison.issueChanges.new.push(issue);
      comparison.summary.issuesAdded++;
    } else {
      comparison.summary.issuesUnchanged++;
    }
  });

  // Compare severity counts
  const severities = ['critical', 'high', 'medium', 'low'];
  severities.forEach(severity => {
    const oldCount = oldReport.summary.issuesBySeverity[severity] || 0;
    const newCount = newReport.summary.issuesBySeverity[severity] || 0;
    const change = newCount - oldCount;

    comparison.severityComparison[severity] = {
      old: oldCount,
      new: newCount,
      change,
      improvement: change <= 0,
    };
  });

  // Compare category counts
  const categories = new Set([
    ...Object.keys(oldReport.summary.issuesByCategory || {}),
    ...Object.keys(newReport.summary.issuesByCategory || {}),
  ]);

  categories.forEach(category => {
    const oldCount = oldReport.summary.issuesByCategory[category] || 0;
    const newCount = newReport.summary.issuesByCategory[category] || 0;
    const change = newCount - oldCount;

    comparison.categoryComparison[category] = {
      old: oldCount,
      new: newCount,
      change,
      improvement: change <= 0,
    };
  });

  return comparison;
}

function displayComparison(comparison) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 CRAWLER REPORT COMPARISON');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📅 Time Period:`);
  console.log(`   From: ${new Date(comparison.metadata.oldTimestamp).toLocaleString()}`);
  console.log(`   To:   ${new Date(comparison.metadata.newTimestamp).toLocaleString()}\n`);

  // Overall summary
  console.log('📈 Overall Changes:\n');

  const totalChange = comparison.summary.issuesAdded - comparison.summary.issuesFixed;
  const totalChangeEmoji = totalChange < 0 ? '✅' : totalChange > 0 ? '⚠️' : '➖';
  const totalChangeText = totalChange < 0
    ? `${Math.abs(totalChange)} fewer issues`
    : totalChange > 0
    ? `${totalChange} more issues`
    : 'No change in total issues';

  console.log(`   ${totalChangeEmoji} ${totalChangeText}`);
  console.log(`   ✅ Issues Fixed: ${comparison.summary.issuesFixed}`);
  console.log(`   ⚠️  New Issues: ${comparison.summary.issuesAdded}`);
  console.log(`   ➖ Unchanged: ${comparison.summary.issuesUnchanged}\n`);

  // Severity breakdown
  console.log('🔴 Issues by Severity:\n');
  console.log('   Severity   | Before | After  | Change ');
  console.log('   -----------|--------|--------|--------');

  Object.entries(comparison.severityComparison).forEach(([severity, data]) => {
    const emoji = data.improvement ? '✅' : data.change === 0 ? '➖' : '⚠️';
    const changeStr = data.change > 0 ? `+${data.change}` : data.change.toString();
    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);

    console.log(`   ${emoji} ${severityLabel.padEnd(8)} | ${String(data.old).padStart(6)} | ${String(data.new).padStart(6)} | ${changeStr.padStart(6)} `);
  });
  console.log('');

  // Category breakdown
  console.log('📂 Issues by Category:\n');
  console.log('   Category           | Before | After  | Change ');
  console.log('   -------------------|--------|--------|--------');

  Object.entries(comparison.categoryComparison).forEach(([category, data]) => {
    const emoji = data.improvement ? '✅' : data.change === 0 ? '➖' : '⚠️';
    const changeStr = data.change > 0 ? `+${data.change}` : data.change.toString();

    console.log(`   ${emoji} ${category.padEnd(18)} | ${String(data.old).padStart(6)} | ${String(data.new).padStart(6)} | ${changeStr.padStart(6)} `);
  });
  console.log('');

  // Fixed issues detail
  if (comparison.issueChanges.fixed.length > 0) {
    console.log('───────────────────────────────────────────────────────────');
    console.log(`✅ FIXED ISSUES (${comparison.issueChanges.fixed.length})`);
    console.log('───────────────────────────────────────────────────────────\n');

    comparison.issueChanges.fixed.forEach((issue, idx) => {
      const severityEmoji = {
        'Critical': '🔴',
        'High': '🟠',
        'Medium': '🟡',
        'Low': '🟢',
      }[issue.severity] || '⚪';

      console.log(`${idx + 1}. ${severityEmoji} ${issue.title}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Location: ${issue.location}`);
      console.log('');
    });
  }

  // New issues detail
  if (comparison.issueChanges.new.length > 0) {
    console.log('───────────────────────────────────────────────────────────');
    console.log(`⚠️  NEW ISSUES (${comparison.issueChanges.new.length})`);
    console.log('───────────────────────────────────────────────────────────\n');

    comparison.issueChanges.new.forEach((issue, idx) => {
      const severityEmoji = {
        'Critical': '🔴',
        'High': '🟠',
        'Medium': '🟡',
        'Low': '🟢',
      }[issue.severity] || '⚪';

      console.log(`${idx + 1}. ${severityEmoji} ${issue.title}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Location: ${issue.location}`);
      console.log(`   Description: ${issue.description}`);
      console.log('');
    });
  }

  // Progress score
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏆 PROGRESS SCORE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const fixedScore = comparison.summary.issuesFixed;
  const addedPenalty = comparison.summary.issuesAdded;
  const netScore = fixedScore - addedPenalty;

  let grade = 'F';
  let emoji = '❌';

  if (netScore >= 20) {
    grade = 'A+';
    emoji = '🌟';
  } else if (netScore >= 15) {
    grade = 'A';
    emoji = '🎉';
  } else if (netScore >= 10) {
    grade = 'B';
    emoji = '✅';
  } else if (netScore >= 5) {
    grade = 'C';
    emoji = '👍';
  } else if (netScore >= 1) {
    grade = 'D';
    emoji = '🙂';
  } else if (netScore === 0) {
    grade = 'F';
    emoji = '➖';
  } else {
    grade = 'F';
    emoji = '❌';
  }

  console.log(`   ${emoji} Grade: ${grade}`);
  console.log(`   Net Issues Resolved: ${netScore}\n`);

  if (netScore > 0) {
    console.log('   🎊 Great work! You\'re making progress!\n');
  } else if (netScore === 0) {
    console.log('   😐 No net change. Keep working on those issues!\n');
  } else {
    console.log('   😟 More issues were introduced than fixed. Review recent changes.\n');
  }

  // Recommendations
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const criticalChange = comparison.severityComparison.critical?.change || 0;
  const highChange = comparison.severityComparison.high?.change || 0;

  if (criticalChange > 0) {
    console.log(`   🔴 ${criticalChange} new CRITICAL issues! Address immediately.`);
  }

  if (highChange > 0) {
    console.log(`   🟠 ${highChange} new HIGH severity issues. Prioritize these.`);
  }

  if (comparison.issueChanges.fixed.length > 0) {
    console.log(`   ✅ Good job fixing ${comparison.issueChanges.fixed.length} issues!`);
  }

  if (comparison.issueChanges.new.length > 0) {
    console.log(`   ⚠️  ${comparison.issueChanges.new.length} new issues detected. Run extract-prompts.js to generate fixes.`);
  }

  const worstCategory = Object.entries(comparison.categoryComparison)
    .filter(([_, data]) => data.change > 0)
    .sort((a, b) => b[1].change - a[1].change)[0];

  if (worstCategory) {
    console.log(`   📂 Focus on ${worstCategory[0]} category (${worstCategory[1].change} new issues).`);
  }

  console.log('');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Compare Crawler Reports

Usage:
  node scripts/compare-reports.js <old-report.json> <new-report.json>

Arguments:
  old-report.json    Path to the older report
  new-report.json    Path to the newer report

Example:
  node scripts/compare-reports.js \\
    crawler-reports/2025-01-20-report.json \\
    crawler-reports/issue-report.json

Tip: Save reports with timestamps for easy comparison:
  mv crawler-reports/issue-report.json \\
     crawler-reports/2025-01-23-report.json
    `);
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const oldReportPath = path.resolve(args[0]);
  const newReportPath = path.resolve(args[1]);

  const oldReport = loadReport(oldReportPath);
  const newReport = loadReport(newReportPath);

  const comparison = compareReports(oldReport, newReport);
  displayComparison(comparison);
}

// Run
main();
