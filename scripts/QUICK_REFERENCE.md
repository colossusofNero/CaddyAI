# Crawler Quick Reference Card

## 🚀 Basic Commands

```bash
# Run full crawler (all 25 pages)
node scripts/comprehensive-crawler.js

# Run quick test (3 pages only)
node scripts/test-crawler.js

# Extract critical issue prompts
node scripts/extract-prompts.js

# Extract high severity prompts
node scripts/extract-prompts.js --severity high

# Compare two reports
node scripts/compare-reports.js old.json new.json
```

## 📁 Output Files

| File | Location | Purpose |
|------|----------|---------|
| Full JSON Report | `crawler-reports/issue-report.json` | Complete data |
| Markdown Report | `crawler-reports/issue-report.md` | Human-readable |
| Agent Prompts | `crawler-reports/agent-prompts.json` | AI fix prompts |
| Screenshots | `crawler-reports/screenshots/*.png` | Visual reference |

## 🎯 Issue Severity Levels

| Level | Emoji | Meaning | Action |
|-------|-------|---------|--------|
| Critical | 🔴 | Breaks core functionality | Fix immediately |
| High | 🟠 | Significant impact | Fix this sprint |
| Medium | 🟡 | Moderate impact | Fix soon |
| Low | 🟢 | Minor issue | Nice to have |

## 📂 Issue Categories

1. **UI/UX** - Visual and usability issues
2. **Functionality** - Broken features and errors
3. **Accessibility** - WCAG compliance issues
4. **Performance** - Speed and optimization
5. **Data Integrity** - Database and sync issues
6. **Security** - Vulnerabilities
7. **Content** - Broken links and missing content
8. **SEO** - Meta tags and structure

## 🔍 Filter Examples

```bash
# All critical issues
node scripts/extract-prompts.js --severity critical

# All accessibility issues
node scripts/extract-prompts.js --category accessibility

# Issues on specific page
node scripts/extract-prompts.js --page /login

# First 5 high severity issues
node scripts/extract-prompts.js --severity high --limit 5

# Export as JSON
node scripts/extract-prompts.js --format json > fixes.json

# Export as Markdown
node scripts/extract-prompts.js --format markdown > fixes.md
```

## ⚙️ Configuration

### Change Site URL

```bash
# For deployed site
SITE_URL=https://your-site.com node scripts/comprehensive-crawler.js

# For localhost (default)
node scripts/comprehensive-crawler.js
```

### Headless Mode

Edit `comprehensive-crawler.js`:

```javascript
this.browser = await puppeteer.launch({
  headless: true,  // Change to true for CI/CD
});
```

## 🔄 Typical Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Run crawler (separate terminal)
node scripts/comprehensive-crawler.js

# 3. View report
cat crawler-reports/issue-report.md

# 4. Get critical prompts
node scripts/extract-prompts.js --severity critical

# 5. Copy prompt and paste to Claude Code

# 6. After fixes, run again
node scripts/comprehensive-crawler.js

# 7. Compare results
node scripts/compare-reports.js old.json new.json
```

## 📊 Report Analysis

```bash
# Count issues by severity
node -e "
const r = require('./crawler-reports/issue-report.json');
console.log('Critical:', r.summary.issuesBySeverity.critical);
console.log('High:', r.summary.issuesBySeverity.high);
console.log('Medium:', r.summary.issuesBySeverity.medium);
console.log('Low:', r.summary.issuesBySeverity.low);
"

# List all critical issues
node -e "
const r = require('./crawler-reports/issue-report.json');
r.issues
  .filter(i => i.severity === 'Critical')
  .forEach(i => console.log('-', i.title));
"

# Export to CSV
node -e "
const r = require('./crawler-reports/issue-report.json');
console.log('Severity,Category,Title');
r.issues.forEach(i => {
  console.log(\`\${i.severity},\${i.category},\"\${i.title}\"\`);
});
" > issues.csv
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Report not found" | Run crawler first: `node scripts/comprehensive-crawler.js` |
| "Browser failed to launch" | Install Chrome/Chromium dependencies |
| "Timeout waiting for page" | Check dev server is running: `npm run dev` |
| "No issues detected" | Good! Or check crawler actually ran (see screenshots/) |

## 📝 Notes

- First run creates test user for protected routes
- Screenshots saved for every page
- Default timeout: 30 seconds per page
- Headless: false (shows browser) for debugging
- Change to headless: true for CI/CD

## 🎯 Priority Fix Order

1. 🔴 **Critical Functionality** - App broken
2. 🔴 **Critical Security** - Data exposed
3. 🟠 **High Accessibility** - WCAG violations
4. 🟠 **High Functionality** - Features broken
5. 🟡 **Medium Performance** - Slow pages
6. 🟡 **Medium SEO** - Missing meta tags
7. 🟢 **Low UI/UX** - Polish issues

## 💡 Pro Tips

✅ **Save baseline reports**: `cp issue-report.json baseline-$(date +%F).json`

✅ **Focus on one category**: `--category accessibility`

✅ **Fix page-by-page**: `--page /login` then fix all issues on that page

✅ **Track weekly progress**: Run Friday, compare to previous Friday

✅ **Block critical in CI**: Fail builds if critical > 0

✅ **Review screenshots**: Visual context helps understand UI issues

---

**Full Docs**: `scripts/CRAWLER_README.md`
**Implementation Guide**: `scripts/IMPLEMENTATION_SUMMARY.md`
