# Contributing to CaddyAI

Thank you for your interest in contributing to CaddyAI! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together towards common goals
- **Be Professional**: Maintain professional conduct in all interactions
- **Be Inclusive**: Welcome diverse perspectives and backgrounds
- **Be Constructive**: Provide constructive feedback and suggestions

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: v18.17 or higher
- **npm**: v9 or higher (or yarn/pnpm)
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### First Contribution

If this is your first contribution:

1. Look for issues labeled `good-first-issue` or `help-wanted`
2. Read through the existing code to understand patterns
3. Start with small, focused changes
4. Ask questions if anything is unclear

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/caddyai-web.git
cd caddyai-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Code Style Guide

### TypeScript

- **Always use TypeScript** for new code
- **Define explicit types** for function parameters and return values
- **Use interfaces** for object shapes
- **Use type aliases** for unions and complex types
- **Avoid `any`** - use `unknown` if type is truly unknown

#### Good Example

```typescript
interface UserProfile {
  uid: string;
  email: string;
  handicap: number;
  preferences: UserPreferences;
}

function updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  // Implementation
}
```

#### Bad Example

```typescript
function updateProfile(userId: any, profile: any): any {
  // Implementation
}
```

### React Components

- **Use functional components** with hooks
- **Use TypeScript for props** with interfaces
- **Keep components small** and focused (< 200 lines)
- **Extract reusable logic** into custom hooks
- **Use meaningful component names** in PascalCase

#### Component Structure

```typescript
import { useState, useEffect } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  disabled = false
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Naming Conventions

- **Files**: Use kebab-case for files (`club-card.tsx`, `use-auth.ts`)
- **Components**: Use PascalCase (`ClubCard`, `UserProfile`)
- **Functions**: Use camelCase (`getUserData`, `calculateDistance`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_CLUBS`, `API_BASE_URL`)
- **Interfaces/Types**: Use PascalCase with descriptive names (`UserProfile`, `ClubData`)

### Tailwind CSS

- **Use Tailwind utility classes** instead of custom CSS
- **Follow mobile-first approach**: Base styles for mobile, then `md:`, `lg:` for larger screens
- **Use design system values**: Colors from `tailwind.config.ts`
- **Group related classes**: Layout → spacing → colors → typography
- **Extract repeated patterns** into reusable components

#### Good Example

```tsx
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-6 md:p-8 lg:gap-8">
  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Title</h1>
</div>
```

### File Organization

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth group routes
│   ├── api/               # API routes
│   └── [page]/            # Public pages
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and helpers
│   ├── firebase.ts       # Firebase config
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

---

## Git Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (`feature/club-recommendations`)
- `fix/` - Bug fixes (`fix/login-redirect`)
- `docs/` - Documentation (`docs/api-guide`)
- `refactor/` - Code refactoring (`refactor/auth-context`)
- `test/` - Test additions (`test/club-component`)
- `chore/` - Maintenance tasks (`chore/update-deps`)

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(clubs): Add club distance calculator

Implemented calculator that adjusts club distances based on
elevation, wind, and temperature conditions.

Closes #123
```

```
fix(auth): Resolve login redirect issue

Fixed bug where users were not redirected to dashboard after
successful login with Google OAuth.

Fixes #456
```

### Workflow Steps

1. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**

Write your code, following the style guide and testing requirements.

3. **Commit Changes**

```bash
git add .
git commit -m "feat(scope): Add feature description"
```

4. **Keep Branch Updated**

```bash
git fetch origin
git rebase origin/main
```

5. **Push to Your Fork**

```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**

Open a PR on GitHub from your fork to the main repository.

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guide
- [ ] All tests pass (`npm test`)
- [ ] Test coverage maintained or improved
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No console errors or warnings
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### PR Title and Description

**Title Format:**
```
<type>(<scope>): Brief description
```

**Description Template:**

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
Add screenshots or GIFs demonstrating the changes

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
   - TypeScript compilation
   - ESLint checks
   - Unit tests
   - E2E tests
   - Build verification

2. **Code Review**: Maintainers will review your PR
   - Address all review comments
   - Make requested changes
   - Respond to questions

3. **Approval**: PR needs approval from at least one maintainer

4. **Merge**: Maintainer will merge once approved

### After Merge

- Delete your branch: `git branch -d feature/your-feature-name`
- Update your fork: `git pull origin main`

---

## Testing Requirements

### Unit Tests Required

All new components and functions must have unit tests:

- **Components**: Test rendering, user interactions, edge cases
- **Utilities**: Test all functions with various inputs
- **Hooks**: Test state changes and side effects

### Test Coverage

- **Minimum coverage**: 80% overall
- **Critical paths**: 100% coverage required
  - Authentication flows
  - Payment processing
  - Data persistence

### Writing Tests

#### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- Button.test.tsx

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## Issue Reporting

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check documentation and FAQs
- Verify the bug is reproducible
- Test on the latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g., Windows 11, macOS 13]
 - Browser: [e.g., Chrome 120, Safari 17]
 - Version: [e.g., 0.1.0]

**Additional context**
Add any other context about the problem here.
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

---

## Documentation

### Documentation Standards

- **Keep it current**: Update docs with code changes
- **Be clear**: Write for beginners and experts
- **Use examples**: Provide code examples
- **Add comments**: Explain complex logic in code
- **Use JSDoc**: Document functions with JSDoc comments

### JSDoc Example

```typescript
/**
 * Calculates the adjusted distance for a club based on conditions
 *
 * @param baseDistance - The club's base distance in yards
 * @param elevation - Elevation change in feet (positive for uphill)
 * @param windSpeed - Wind speed in mph (positive for headwind)
 * @param temperature - Temperature in Fahrenheit
 * @returns The adjusted distance in yards
 *
 * @example
 * ```typescript
 * const distance = calculateAdjustedDistance(150, 10, 5, 72);
 * console.log(distance); // 158
 * ```
 */
export function calculateAdjustedDistance(
  baseDistance: number,
  elevation: number,
  windSpeed: number,
  temperature: number
): number {
  // Implementation
}
```

---

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community server (coming soon)
- **Stack Overflow**: Tag questions with `caddyai`
- **Email**: support@caddyai.com

### Stay Updated

- **Watch the repo**: Get notifications for new releases
- **Follow on Twitter**: @CaddyAI
- **Subscribe**: Newsletter at caddyai.com

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project credits

---

## License

By contributing to CaddyAI, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## Questions?

If you have any questions about contributing, please:
1. Check this guide thoroughly
2. Search existing issues and discussions
3. Ask in GitHub Discussions
4. Email us at developers@caddyai.com

**Thank you for contributing to CaddyAI!**

We appreciate your time and effort in making this project better for everyone.
