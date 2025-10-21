import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CaddyAI/i)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    // Check for main headline
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/')

    // Check for navigation links
    await expect(page.getByRole('link', { name: /features/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible()
  })

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/')

    // Look for call-to-action buttons
    const ctaButton = page.getByRole('link', { name: /get started/i }).first()
    await expect(ctaButton).toBeVisible()
  })

  test('should navigate to features page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /features/i }).first().click()
    await expect(page).toHaveURL('/features')
  })

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /pricing/i }).first().click()
    await expect(page).toHaveURL('/pricing')
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/')

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for footer content
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('should have meta description', async ({ page }) => {
    await page.goto('/')

    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /.+/)
  })
})

test.describe('Homepage - Responsive', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that key elements are visible on mobile
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Check for mobile menu toggle if navigation is collapsed
    // This depends on your implementation
  })

  test('should be tablet-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('should be desktop-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })
})

test.describe('Homepage - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Should load in less than 3 seconds on good connection
    expect(loadTime).toBeLessThan(3000)
  })
})
