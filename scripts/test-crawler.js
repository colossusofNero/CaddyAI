/**
 * Quick test of the crawler with just a few pages
 */

const ComprehensiveCrawler = require('./comprehensive-crawler.js');

class TestCrawler extends ComprehensiveCrawler {
  async run() {
    try {
      await this.init();

      console.log('🧪 Running quick test with 3 pages...\n');

      // Test just 3 pages
      const testRoutes = [
        { path: '/', name: 'Home', requiresAuth: false },
        { path: '/login', name: 'Login', requiresAuth: false },
        { path: '/features', name: 'Features', requiresAuth: false },
      ];

      for (const route of testRoutes) {
        await this.crawlPage(route);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate reports
      const report = this.generateReport();
      const markdown = this.generateMarkdownReport(report);

      console.log('\n📊 Test Results:\n');
      console.log(`Pages Crawled: ${report.metadata.totalPages}`);
      console.log(`Issues Found: ${report.metadata.totalIssues}`);
      console.log(`  🔴 Critical: ${report.summary.issuesBySeverity.critical}`);
      console.log(`  🟠 High: ${report.summary.issuesBySeverity.high}`);
      console.log(`  🟡 Medium: ${report.summary.issuesBySeverity.medium}`);
      console.log(`  🟢 Low: ${report.summary.issuesBySeverity.low}\n`);

      console.log('✅ Crawler test successful!\n');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

const crawler = new TestCrawler();
crawler.run().catch(console.error);
