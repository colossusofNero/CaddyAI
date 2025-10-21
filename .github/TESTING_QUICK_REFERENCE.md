# Testing Quick Reference

Quick reference guide for running tests in CaddyAI Web.

## 🚀 Quick Commands

```bash
# Run all unit tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests with visual UI
npm run test:e2e:ui

# Debug E2E tests (step through)
npm run test:e2e:debug
```

## 📊 Current Test Stats

- **Unit Tests**: 61 tests ✅
- **E2E Tests**: 28 scenarios ✅
- **Test Suites**: 3 passed
- **Coverage**: 100% for UI components

## 🎯 What's Tested

### UI Components (100% Coverage)
- ✅ Button (24 tests)
- ✅ Card (20 tests)
- ✅ Input (17 tests)

### User Flows (E2E)
- ✅ Authentication (signup, login)
- ✅ Homepage navigation
- ✅ Course search
- ✅ Mobile responsive

## 🔍 Running Specific Tests

```bash
# Run tests for a specific file
npm test Button.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="handles click"

# Run E2E tests for specific file
npm run test:e2e auth.spec.ts

# Run E2E on specific browser
npx playwright test --project=chromium
```

## 📈 Coverage Commands

```bash
# Generate and view coverage
npm run test:coverage

# Open HTML coverage report (after running coverage)
# Mac/Linux
open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

## 🐛 Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="test name" --no-coverage

# Run E2E in headed mode (see browser)
npx playwright test --headed

# Run E2E with debug
npm run test:e2e:debug
```

## ✅ Pre-Commit Checklist

Before committing code:

```bash
# 1. Run all unit tests
npm test

# 2. Check test coverage
npm run test:coverage

# 3. Run E2E tests (if applicable)
npm run test:e2e

# 4. Lint code
npm run lint

# 5. Build project
npm run build
```

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { render, screen } from '@testing-library/react'
import { YourComponent } from '@/components/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test('describe your test', async ({ page }) => {
  await page.goto('/your-page')
  await expect(page.getByRole('heading')).toBeVisible()
})
```

## 🚨 Common Issues

**Issue**: Tests fail with module not found
**Solution**: Check import paths use `@/` aliases

**Issue**: E2E tests timeout
**Solution**: Ensure dev server is running (`npm run dev`)

**Issue**: Coverage too low
**Solution**: Add more tests or adjust thresholds in `jest.config.js`

## 📚 Documentation

- **Full Testing Guide**: [TESTING.md](../TESTING.md)
- **QA Checklist**: [QA_CHECKLIST.md](../QA_CHECKLIST.md)
- **Developer Docs**: [DEVELOPER.md](../DEVELOPER.md)

## 🎓 Best Practices

1. **Write tests first** (TDD) when adding features
2. **Test behavior**, not implementation
3. **Use descriptive test names**
4. **Keep tests independent**
5. **Mock external dependencies**
6. **Test accessibility** (keyboard, screen readers)

## 🔗 Useful Links

- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)

---

**Need Help?** Check [TESTING.md](../TESTING.md) for detailed documentation.
