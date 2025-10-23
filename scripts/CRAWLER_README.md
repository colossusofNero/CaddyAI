# CaddyAI Comprehensive Issue Crawler

A powerful Puppeteer-based tool that automatically crawls your application, identifies issues across multiple categories, and generates actionable prompts for AI agents to fix them.

## 🎯 Features

### Issue Detection Categories

1. **UI/UX Issues**
   - Broken layouts
   - Missing elements
   - Poor visual hierarchy
   - Responsive design problems
   - Inconsistent styling

2. **Functionality Issues**
   - Broken features
   - JavaScript errors
   - Failed network requests
   - Missing form elements
   - Non-functional buttons

3. **Accessibility Issues**
   - Missing alt text on images
   - Missing form labels
   - Poor color contrast
   - Missing ARIA attributes
   - Keyboard navigation problems
   - WCAG 2.1 violations

4. **Performance Issues**
   - Slow page loads (>5s)
   - Large bundle sizes
   - Too many network requests
   - Unoptimized images
   - Poor Core Web Vitals

5. **Data Integrity Issues**
   - Firebase sync problems
   - Missing user data
   - Broken database operations

6. **Security Issues**
   - Exposed sensitive data
   - Insecure practices

7. **Content Issues**
   - Broken links
   - Missing content
   - Typos and formatting errors

8. **SEO Issues**
   - Missing meta tags
   - Missing Open Graph tags
   - Missing canonical URLs
   - Poor heading structure

### Severity Levels

- 🔴 **Critical**: Breaks core functionality, must fix immediately
- 🟠 **High**: Significant impact on user experience or compliance
- 🟡 **Medium**: Moderate impact, should fix soon
- 🟢 **Low**: Minor issues, nice to have fixes

## 📦 Installation

The script uses Puppeteer which is already installed in the project.

```bash
npm install  # If dependencies are missing
```

## 🚀 Usage

### Basic Usage

Run against localhost (default):

```bash
node scripts/comprehensive-crawler.js
```

### Run Against Deployed Site

```bash
SITE_URL=https://your-site.vercel.app node scripts/comprehensive-crawler.js
```

### Run Against Local Dev Server

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run crawler
SITE_URL=http://localhost:3000 node scripts/comprehensive-crawler.js
```

## 📊 Output Files

All reports are saved to `crawler-reports/`:

### 1. `issue-report.json`
Complete JSON report with:
- All detected issues with full details
- Page-by-page analysis
- Performance metrics
- Accessibility audits
- Console messages
- Network requests

### 2. `issue-report.md`
Human-readable Markdown report with:
- Executive summary
- Issues grouped by severity
- Issues grouped by category
- Detailed descriptions
- Page-by-page breakdown
- Agent fix prompts

### 3. `agent-prompts.json`
Actionable prompts for AI agents:
- One prompt per issue
- Context-aware instructions
- Testing steps
- Success criteria
- File locations

### 4. `screenshots/`
Full-page screenshots of every crawled page for visual reference.

## 📋 Report Structure

### JSON Report Structure

```json
{
  "metadata": {
    "timestamp": "2025-01-23T...",
    "siteUrl": "http://localhost:3000",
    "totalPages": 25,
    "totalIssues": 47,
    "authenticatedUser": "testuser@caddyai.com"
  },
  "summary": {
    "issuesBySeverity": {
      "critical": 3,
      "high": 12,
      "medium": 20,
      "low": 12
    },
    "issuesByCategory": {
      "UI/UX": 8,
      "Functionality": 15,
      "Accessibility": 18,
      "Performance": 3,
      "SEO": 3
    }
  },
  "pages": [...],
  "issues": [...],
  "prompts": [...]
}
```

### Issue Object Structure

```json
{
  "id": 1,
  "timestamp": "2025-01-23T...",
  "category": "Accessibility",
  "severity": "High",
  "title": "Images Missing Alt Text",
  "description": "15 images are missing alt text for screen readers",
  "location": "http://localhost:3000/",
  "details": ["image1.jpg", "image2.jpg", ...]
}
```

### Agent Prompt Structure

```json
{
  "issueId": 1,
  "severity": "High",
  "category": "Accessibility",
  "title": "Images Missing Alt Text",
  "location": "http://localhost:3000/",
  "prompt": "**Issue**: Images Missing Alt Text\n\n**Your Task**:\n1. Locate images...",
  "files": [],
  "testSteps": []
}
```

## 🤖 Using Agent Prompts

The crawler generates ready-to-use prompts for AI coding agents (like Claude Code, GitHub Copilot, etc.).

### Method 1: Manual Copy-Paste

1. Open `crawler-reports/issue-report.md`
2. Find the issue you want to fix
3. Copy the corresponding prompt from the "Agent Fix Prompts" section
4. Paste into your AI assistant

### Method 2: Programmatic Access

```javascript
const report = require('./crawler-reports/issue-report.json');

// Get all critical issues
const criticalIssues = report.issues.filter(i => i.severity === 'Critical');

// Get prompts for critical issues
const criticalPrompts = report.prompts.filter(p => p.severity === 'Critical');

// Send to agent
criticalPrompts.forEach(prompt => {
  console.log(prompt.prompt);
  // Or send to your agent automation system
});
```

### Method 3: Priority-Based Workflow

```bash
# 1. Run crawler
node scripts/comprehensive-crawler.js

# 2. Review report
cat crawler-reports/issue-report.md

# 3. Extract critical prompts
node -e "
const report = require('./crawler-reports/issue-report.json');
const critical = report.prompts.filter(p => p.severity === 'Critical');
critical.forEach((p, i) => {
  console.log(\`\n=== CRITICAL ISSUE \${i+1} ===\n\${p.prompt}\n\`);
});
"

# 4. Copy and paste each prompt to Claude Code or your AI assistant
```

## 🔧 Configuration

### Modify Routes to Crawl

Edit `comprehensive-crawler.js`:

```javascript
const ROUTES = [
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/your-custom-route', name: 'Custom', requiresAuth: true },
  // Add more routes...
];
```

### Adjust Severity Thresholds

```javascript
// Slow page load threshold (default: 5000ms)
if (pageReport.loadTime > 5000) {
  // Flag as performance issue
}

// Resource count threshold (default: 100)
if (metrics.resourceCount > 100) {
  // Flag as performance issue
}
```

### Headless Mode

For CI/CD or faster execution:

```javascript
this.browser = await puppeteer.launch({
  headless: true,  // Change to true
  // ...
});
```

## 📈 Interpreting Results

### High Priority Issues to Fix First

1. **Critical Severity + Functionality Category**
   - Breaks core features
   - Authentication failures
   - Database errors
   - JavaScript runtime errors

2. **High Severity + Accessibility Category**
   - WCAG violations
   - Missing form labels
   - No keyboard navigation
   - Screen reader incompatibility

3. **High Severity + SEO Category**
   - Missing page titles
   - Missing meta descriptions
   - Broken canonical URLs

### Common Issue Patterns

| Issue Count | Pattern | Action |
|-------------|---------|--------|
| 20+ accessibility issues | Systematic problem | Implement accessibility audit in CI/CD |
| 10+ performance issues | Need optimization pass | Run performance optimization sprint |
| Many missing alt text | Need image component | Create reusable `<Image>` wrapper |
| Multiple broken forms | Validation issues | Audit form validation logic |

## 🧪 Testing the Crawler

### Test on Localhost

```bash
# Terminal 1
npm run dev

# Terminal 2
node scripts/comprehensive-crawler.js
```

### Test on Production

```bash
SITE_URL=https://your-production-site.com node scripts/comprehensive-crawler.js
```

### Verify Output

```bash
# Check reports were generated
ls -lh crawler-reports/

# View summary
head -n 50 crawler-reports/issue-report.md

# Count issues by severity
node -e "
const r = require('./crawler-reports/issue-report.json');
console.log('Critical:', r.summary.issuesBySeverity.critical);
console.log('High:', r.summary.issuesBySeverity.high);
console.log('Medium:', r.summary.issuesBySeverity.medium);
console.log('Low:', r.summary.issuesBySeverity.low);
"
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Crawl and Report Issues

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run crawler
        run: SITE_URL=${{ secrets.PRODUCTION_URL }} node scripts/comprehensive-crawler.js

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: crawler-reports
          path: crawler-reports/

      - name: Comment on PR with issues
        if: github.event_name == 'pull_request'
        run: |
          node -e "
          const report = require('./crawler-reports/issue-report.json');
          const critical = report.summary.issuesBySeverity.critical;
          if (critical > 0) {
            console.log('::error::Found', critical, 'critical issues');
            process.exit(1);
          }
          "
```

## 🐛 Troubleshooting

### Issue: "Browser failed to launch"

```bash
# Install Chromium dependencies (Linux)
sudo apt-get install -y chromium-browser

# Or use system Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Issue: "Timeout waiting for page"

- Increase timeout in `page.goto()` options
- Check if dev server is running
- Verify SITE_URL is correct
- Check network connectivity

### Issue: "Authentication failed"

- Verify Firebase is properly initialized
- Check Firebase Auth is enabled
- Ensure signup form has correct field names
- Review console logs for Firebase errors

### Issue: "No issues detected"

- This might be good! But verify:
  - Crawler actually visited pages (check screenshots)
  - Issue detection logic is working (check console output)
  - Try running against a page with known issues

## 📚 Advanced Usage

### Custom Issue Detection

Add your own custom checks:

```javascript
async checkCustomFeature(pageReport) {
  // Your custom logic
  const hasFeature = await this.page.$('.my-custom-feature');

  if (!hasFeature) {
    this.addIssue({
      category: ISSUE_CATEGORIES.FUNCTIONALITY,
      severity: SEVERITY_LEVELS.HIGH,
      title: 'Missing Custom Feature',
      description: 'The custom feature is not present on this page',
      location: pageReport.url,
    });
  }
}

// Then call it in crawlPage():
await this.checkCustomFeature(pageReport);
```

### Export to CSV

```javascript
const report = require('./crawler-reports/issue-report.json');
const fs = require('fs');

const csv = [
  'ID,Severity,Category,Title,Location',
  ...report.issues.map(i =>
    `${i.id},"${i.severity}","${i.category}","${i.title}","${i.location}"`
  )
].join('\n');

fs.writeFileSync('crawler-reports/issues.csv', csv);
```

### Filter Issues by Page

```javascript
const report = require('./crawler-reports/issue-report.json');

const loginPageIssues = report.issues.filter(i =>
  i.location.includes('/login')
);

console.log('Login page issues:', loginPageIssues.length);
loginPageIssues.forEach(i => console.log('-', i.title));
```

## 🎯 Best Practices

1. **Run Regularly**: Schedule daily or weekly crawls
2. **Fix Critical First**: Always prioritize critical severity issues
3. **Track Over Time**: Compare reports to see improvement
4. **Automate Fixes**: Use agent prompts to speed up fixes
5. **Add Tests**: After fixing, add tests to prevent regression
6. **Document Patterns**: If same issue appears multiple times, fix the root cause
7. **Review Screenshots**: Visual context helps understand issues

## 📞 Support

For issues with the crawler:
1. Check troubleshooting section above
2. Review console output for errors
3. Check `crawler-reports/issue-report.json` for details
4. Open an issue in the repository

## 🔮 Future Enhancements

- [ ] Integration with issue tracking (Jira, Linear, GitHub Issues)
- [ ] Automated fix suggestions with code diffs
- [ ] Performance trend tracking over time
- [ ] Custom rule definitions via config file
- [ ] Slack/Discord notifications
- [ ] Visual regression testing
- [ ] Lighthouse integration
- [ ] WAVE API integration for accessibility
- [ ] Comparison between crawls (regression detection)

---

**Happy Crawling! 🕷️**
