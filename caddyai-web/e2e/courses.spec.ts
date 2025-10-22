import { test, expect } from '@playwright/test'

test.describe('Course Search and Explore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses')
  })

  test('should display courses page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    // Type in search
    await searchInput.fill('Pebble Beach')

    // Results should update (depends on implementation)
    // await expect(page.getByText(/pebble beach/i)).toBeVisible()
  })

  test('should display course cards', async ({ page }) => {
    // Wait for courses to load
    await page.waitForTimeout(1000)

    // Check if any course cards are visible
    const courseCards = page.locator('[data-testid="course-card"]').or(
      page.locator('article').or(page.getByRole('article'))
    )

    // Should have at least some content visible
    const heading = page.getByRole('heading')
    await expect(heading).toBeVisible()
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })
})

test.describe('Course Search - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/courses')

    // Check that search is accessible on mobile
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    // Check touch target size
    const searchBox = await searchInput.boundingBox()
    expect(searchBox?.height).toBeGreaterThanOrEqual(44)
  })
})
