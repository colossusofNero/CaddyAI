import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
  })

  test('should display login and signup links', async ({ page }) => {
    // Check for authentication links in navigation
    const loginLink = page.getByRole('link', { name: /log in/i })
    const signupLink = page.getByRole('link', { name: /sign up/i })

    await expect(loginLink).toBeVisible()
    await expect(signupLink).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).first().click()
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).first().click()
    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
  })

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /log in/i })
    await submitButton.click()

    // Check for validation errors
    // Note: This depends on your form validation implementation
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test('should show validation errors on empty signup form', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign up/i })
    await submitButton.click()

    // Check for validation errors
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test('should toggle between login and signup', async ({ page }) => {
    // Start at login
    await page.goto('/login')
    await expect(page).toHaveURL('/login')

    // Navigate to signup
    const signupLink = page.getByRole('link', { name: /sign up/i })
    await signupLink.click()
    await expect(page).toHaveURL('/signup')

    // Navigate back to login
    const loginLink = page.getByRole('link', { name: /log in/i })
    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login')

    // Check that form inputs have associated labels
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should have password field with type password', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })
})

test.describe('Authentication - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/login')

    // Check that form is visible and usable on mobile
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible()

    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /log in/i })

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    // Check that inputs are large enough for touch targets (min 44px)
    const emailBox = await emailInput.boundingBox()
    expect(emailBox?.height).toBeGreaterThanOrEqual(44)
  })
})
