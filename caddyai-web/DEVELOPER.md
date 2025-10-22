# CaddyAI Developer Documentation

Complete technical documentation for developers working on CaddyAI Web.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Guide](#setup-guide)
- [Project Structure](#project-structure)
- [Component Library](#component-library)
- [API Reference](#api-reference)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

### Tech Stack

- **Frontend Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Type Safety**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: React Context + Hooks
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel

### Key Design Decisions

1. **Next.js App Router**: Modern routing with server components and layouts
2. **TypeScript**: Strong typing for better developer experience and fewer bugs
3. **Tailwind CSS**: Utility-first CSS for rapid UI development
4. **Firebase**: Serverless backend for authentication and real-time data
5. **Component-Driven**: Reusable UI components with consistent API

## Setup Guide

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+ or yarn 1.22+
- Git
- Firebase project with Firestore and Authentication enabled

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/caddyai-web.git
cd caddyai-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` file:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Set up Firebase**
   - Create a new Firebase project
   - Enable Email/Password and Google authentication
   - Create Firestore database
   - Add security rules

5. **Run development server**
```bash
npm run dev
```

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Clubs
    match /clubs/{clubId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Project Structure

```
caddyai-web/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   ├── login/                 # Auth pages
│   ├── signup/
│   ├── dashboard/             # Protected pages
│   ├── profile/
│   ├── clubs/
│   └── courses/
├── components/                # React components
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── landing/              # Landing page components
│   ├── analytics/            # Analytics components
│   └── ...
├── hooks/                    # Custom React hooks
│   ├── useAuth.tsx          # Authentication hook
│   └── ...
├── lib/                      # Utility functions
│   └── ...
├── src/                      # Source files
│   ├── lib/
│   │   └── firebase.ts      # Firebase configuration
│   └── types/               # TypeScript types
│       ├── user.ts
│       ├── course.ts
│       └── ...
├── __tests__/               # Unit tests
│   ├── components/
│   └── lib/
├── e2e/                     # End-to-end tests
│   ├── auth.spec.ts
│   ├── homepage.spec.ts
│   └── courses.spec.ts
├── public/                  # Static assets
├── .env.local              # Environment variables (gitignored)
├── jest.config.js          # Jest configuration
├── playwright.config.ts    # Playwright configuration
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Component Library

### Base Components

#### Button

**Location**: `components/ui/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  disabled?: boolean
  onClick?: () => void
}
```

**Usage**:
```tsx
import { Button } from '@/components/ui/Button'

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Accessibility**:
- Touch target size: 44px minimum (WCAG 2.1 AAA)
- Focus indicators visible
- Disabled state properly handled
- Loading state with spinner

#### Card

**Location**: `components/ui/Card.tsx`

**Components**:
- `Card` - Main container
- `CardHeader` - Header with title and description
- `CardContent` - Content area
- `CardFooter` - Footer with actions

**Usage**:
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

<Card variant="default" padding="md">
  <CardHeader title="Card Title" description="Description" />
  <CardContent>
    <p>Content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Input

**Location**: `components/ui/Input.tsx`

**Props**:
```typescript
interface InputProps {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  fullWidth?: boolean
  disabled?: boolean
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}
```

**Usage**:
```tsx
import { Input } from '@/components/ui/Input'

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

**Accessibility**:
- Label properly associated with input
- Error messages announced to screen readers
- Minimum font size 16px (prevents iOS zoom)
- Touch-optimized height (44-48px)

### Custom Hooks

#### useAuth

**Location**: `hooks/useAuth.tsx`

**Purpose**: Authentication state management

**Usage**:
```tsx
import { useAuth } from '@/hooks/useAuth'

function Dashboard() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Welcome {user.email}</div>
}
```

**API**:
```typescript
interface UseAuth {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

## API Reference

### Authentication API

#### Sign Up
```typescript
POST /api/auth/signup
Body: { email: string, password: string }
Returns: { user: User, token: string }
```

#### Log In
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Returns: { user: User, token: string }
```

#### Log Out
```typescript
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Returns: { success: boolean }
```

### Clubs API

#### Get User Clubs
```typescript
GET /api/clubs
Headers: { Authorization: Bearer <token> }
Returns: { clubs: Club[] }
```

#### Create Club
```typescript
POST /api/clubs
Headers: { Authorization: Bearer <token> }
Body: { name: string, type: string, distance: number }
Returns: { club: Club }
```

#### Update Club
```typescript
PUT /api/clubs/:id
Headers: { Authorization: Bearer <token> }
Body: Partial<Club>
Returns: { club: Club }
```

#### Delete Club
```typescript
DELETE /api/clubs/:id
Headers: { Authorization: Bearer <token> }
Returns: { success: boolean }
```

### Courses API

#### Search Courses
```typescript
GET /api/courses/search?query=<search>
Returns: { courses: Course[] }
```

#### Get Course Details
```typescript
GET /api/courses/:id
Returns: { course: CourseExtended }
```

## Testing Strategy

### Unit Tests

**Framework**: Jest + React Testing Library

**Coverage Goals**: 80%+ for all code

**Test Location**: `__tests__/`

**Example**:
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

**Running Tests**:
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests

**Framework**: Playwright

**Test Location**: `e2e/`

**Example**:
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

**Running E2E Tests**:
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Testing Checklist

- [ ] Unit tests for all components
- [ ] Unit tests for all utility functions
- [ ] Integration tests for critical flows
- [ ] E2E tests for user journeys
- [ ] Accessibility tests (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Performance testing (Lighthouse)

## Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Select GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Configure production Firebase credentials

4. **Deploy**
   - Automatic deployment on push to main
   - Preview deployments for PRs

### Environment-Specific Configuration

**Development**: `.env.local`
**Staging**: Vercel preview deployments
**Production**: Vercel environment variables

## Contributing Guidelines

### Git Workflow

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing patterns
   - Add tests for new features

3. **Commit Changes**
```bash
git add .
git commit -m "feat: add new feature"
```

**Commit Message Format**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

4. **Push and Create PR**
```bash
git push origin feature/your-feature-name
```

### Code Style

- Use TypeScript for all new files
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful comments
- Keep functions small and focused
- Use descriptive variable names

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers
5. Address review feedback
6. Merge when approved

### Code Review Checklist

- [ ] Code follows project style guide
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Accessibility standards met
- [ ] Performance considerations addressed
- [ ] Security best practices followed

## Performance Optimization

### Best Practices

1. **Image Optimization**
   - Use Next.js Image component
   - Lazy load images
   - Provide appropriate sizes

2. **Code Splitting**
   - Use dynamic imports for large components
   - Lazy load routes

3. **Caching**
   - Configure appropriate cache headers
   - Use SWR for data fetching

4. **Bundle Size**
   - Monitor bundle size with `next build`
   - Remove unused dependencies
   - Use tree-shaking

### Performance Metrics

Target Lighthouse scores:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## Troubleshooting

### Common Issues

**Issue**: Build fails with TypeScript errors
**Solution**: Run `npm run build` locally and fix type errors

**Issue**: Tests fail on CI
**Solution**: Ensure all environment variables are set in CI

**Issue**: Firebase authentication not working
**Solution**: Check Firebase configuration in `.env.local`

**Issue**: Styles not applying
**Solution**: Clear `.next` cache and restart dev server

### Debug Mode

Enable debug logging:
```env
NEXT_PUBLIC_DEBUG=true
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## Support

For questions or issues:
- Open a GitHub issue
- Contact the development team
- Check existing documentation

---

**Last Updated**: 2025-10-21
