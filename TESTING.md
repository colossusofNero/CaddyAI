# Testing Guide

Comprehensive testing documentation for CaddyAI Web application.

## Quick Start

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Testing Framework

### Unit & Integration Tests
- **Framework**: Jest 30.2.0
- **Testing Library**: React Testing Library 16.3.0
- **Environment**: jsdom for browser simulation

### End-to-End Tests
- **Framework**: Playwright 1.56.1
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: iPhone 12, Pixel 5 viewports

## Test Structure

```
caddyai-web/
├── __tests__/              # Unit and integration tests
│   ├── components/
│   │   └── ui/
│   │       ├── Button.test.tsx
│   │       ├── Card.test.tsx
│   │       └── Input.test.tsx
│   ├── lib/
│   └── integration/
├── e2e/                   # End-to-end tests
│   ├── auth.spec.ts
│   ├── homepage.spec.ts
│   └── courses.spec.ts
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup file
└── playwright.config.ts   # Playwright configuration
```

## Current Test Coverage

### Unit Tests - UI Components

#### Button Component (`components/ui/Button.tsx`)
**Coverage**: 100% (statements, branches, functions, lines)

**Test Cases**:
- ✅ Renders with children
- ✅ Applies variants (primary, secondary, outline, ghost, danger)
- ✅ Applies sizes (sm, md, lg)
- ✅ Full width mode
- ✅ Loading state with spinner
- ✅ Disabled state
- ✅ Icon rendering
- ✅ Click event handling
- ✅ Custom className
- ✅ Additional props forwarding
- ✅ Accessibility (ARIA, touch targets, focus states)

#### Card Component (`components/ui/Card.tsx`)
**Coverage**: 100% (statements, branches, functions, lines)

**Test Cases**:
- ✅ Card renders children
- ✅ Variants (default, bordered, elevated)
- ✅ Padding sizes (none, sm, md, lg)
- ✅ CardHeader with title and description
- ✅ CardContent with spacing
- ✅ CardFooter with flex layout
- ✅ Custom className support
- ✅ Integration of all card components

#### Input Component (`components/ui/Input.tsx`)
**Coverage**: 100% (statements, branches, functions, lines)

**Test Cases**:
- ✅ Basic rendering
- ✅ Label association
- ✅ Placeholder text
- ✅ Helper text
- ✅ Error messages
- ✅ Error styling
- ✅ Icon rendering
- ✅ Full width mode
- ✅ Value changes
- ✅ Disabled state
- ✅ Ref forwarding
- ✅ ID handling
- ✅ Custom className
- ✅ HTML attributes
- ✅ Accessibility (labels, focus, touch targets)
- ✅ Form integration (controlled/uncontrolled)

### End-to-End Tests

#### Authentication Flow (`e2e/auth.spec.ts`)
**Test Cases**:
- ✅ Display login and signup links
- ✅ Navigate to login page
- ✅ Navigate to signup page
- ✅ Form validation on empty submission
- ✅ Toggle between login and signup
- ✅ Accessible form labels
- ✅ Password field security
- ✅ Mobile responsive (375x667 viewport)
- ✅ Touch target sizes (min 44px)

#### Homepage (`e2e/homepage.spec.ts`)
**Test Cases**:
- ✅ Page loads successfully
- ✅ Hero section displays
- ✅ Navigation menu present
- ✅ CTA buttons visible
- ✅ Navigate to features page
- ✅ Navigate to pricing page
- ✅ Footer displays
- ✅ Meta description present
- ✅ Mobile responsive (375x667)
- ✅ Tablet responsive (768x1024)
- ✅ Desktop responsive (1920x1080)
- ✅ Load time < 3 seconds

#### Course Search (`e2e/courses.spec.ts`)
**Test Cases**:
- ✅ Courses page displays
- ✅ Search functionality present
- ✅ Course cards display
- ✅ Keyboard navigation accessible
- ✅ Mobile responsive with touch targets

## Writing Tests

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

## Test Best Practices

### Unit Tests
1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test from the user's perspective

2. **Use Testing Library Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Test Accessibility**
   - Verify ARIA attributes
   - Check keyboard navigation
   - Validate focus management

4. **Keep Tests Isolated**
   - Each test should be independent
   - Clean up after each test
   - Don't rely on test execution order

5. **Use Descriptive Names**
   ```typescript
   // Good
   it('shows error message when email is invalid')

   // Bad
   it('works')
   ```

### E2E Tests
1. **Test Critical User Flows**
   - Authentication (signup, login, logout)
   - Core features (search, create, update, delete)
   - Payment flows (if applicable)

2. **Use Meaningful Selectors**
   ```typescript
   // Good
   await page.getByRole('button', { name: 'Sign Up' })

   // Avoid
   await page.click('.btn-primary')
   ```

3. **Handle Async Operations**
   ```typescript
   await page.waitForSelector('[data-testid="dashboard"]')
   await expect(page.locator('.loading')).not.toBeVisible()
   ```

4. **Test Across Browsers and Devices**
   ```typescript
   test.use({ viewport: { width: 375, height: 667 } }) // Mobile
   ```

## Accessibility Testing

### Automated Tests
Tests include accessibility checks for:
- ✅ Semantic HTML structure
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast (via manual review)
- ✅ Touch target sizes (44px minimum)

### Manual Testing Checklist
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces content properly (NVDA/JAWS/VoiceOver)
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Forms have proper labels and error messages
- [ ] Images have alt text
- [ ] Videos have captions

### Tools
- **axe DevTools**: Browser extension for accessibility audits
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools

## Coverage Goals

### Current Coverage
- **UI Components**: 100% (Button, Card, Input)
- **Overall Project**: ~15% (growing as we add more tests)

### Target Coverage
- **Global**: 50% minimum
- **UI Components**: 80% minimum
- **Critical Features**: 90% minimum

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="handles click"

# Update snapshots
npm test -- -u

# Run with verbose output
npm test -- --verbose
```

### E2E Tests
```bash
# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run with UI mode (visual debugging)
npm run test:e2e:ui

# Run with debug mode (step through)
npm run test:e2e:debug

# Run headed (see browser)
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium
```

### Common Issues

**Issue**: Tests fail with "Not wrapped in act(...)"
**Solution**: Ensure async operations use `await` and `waitFor`

**Issue**: Element not found
**Solution**: Use `screen.debug()` to see rendered output

**Issue**: E2E test times out
**Solution**: Increase timeout or check if server is running

## Test Data Management

### Mocking Firebase
Jest setup includes Firebase mocks:

```javascript
jest.mock('./src/lib/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    // ... other mocks
  },
}))
```

### Test Fixtures
Create reusable test data:

```typescript
// __tests__/fixtures/user.ts
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
}
```

## Performance Testing

### Lighthouse CI
Add to package.json:

```json
{
  "scripts": {
    "lighthouse": "lighthouse http://localhost:3000 --view"
  }
}
```

### Core Web Vitals
Monitor in E2E tests:

```typescript
test('meets Core Web Vitals', async ({ page }) => {
  await page.goto('/')

  const metrics = await page.evaluate(() => {
    return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')))
  })

  // Check performance metrics
  expect(metrics[0].loadEventEnd).toBeLessThan(3000)
})
```

## Security Testing

### Input Sanitization
Test XSS prevention:

```typescript
it('sanitizes user input', () => {
  const maliciousInput = '<script>alert("xss")</script>'
  render(<Input value={maliciousInput} />)

  // Verify script doesn't execute
  expect(screen.queryByText('alert')).not.toBeInTheDocument()
})
```

### Authentication
Test protected routes:

```typescript
test('redirects unauthenticated users', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})
```

## Maintenance

### Regular Tasks
- [ ] Review and update tests with code changes
- [ ] Remove obsolete tests
- [ ] Refactor duplicated test code
- [ ] Update snapshots when UI changes
- [ ] Monitor test execution time
- [ ] Keep test dependencies updated

### Test Health Metrics
- **Execution Time**: All tests < 5 minutes
- **Flakiness**: < 1% failure rate
- **Coverage**: Maintain 80%+ for critical code
- **Maintenance**: Update tests within same PR as code changes

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing Guide](https://www.w3.org/WAI/test-evaluate/)

## Getting Help

- Check existing tests for examples
- Review error messages carefully
- Use `screen.debug()` for debugging
- Ask in team chat or open an issue

---

**Last Updated**: 2025-10-21
**Test Suite Version**: 1.0.0
