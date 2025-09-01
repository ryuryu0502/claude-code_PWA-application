import { test, expect } from '@playwright/test'

test.describe('PWA Features Tests', () => {
  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/')
    
    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json')
    
    // Verify manifest content
    const response = await page.request.get('/manifest.json')
    expect(response.status()).toBe(200)
    
    const manifest = await response.json()
    expect(manifest.name).toBe('プレゼント企画アプリ')
    expect(manifest.short_name).toBe('プレゼント')
    expect(manifest.display).toBe('standalone')
  })

  test('should register service worker', async ({ page }) => {
    await page.goto('/')
    
    // Wait for service worker registration
    await page.waitForFunction(() => {
      return navigator.serviceWorker.ready
    })
    
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null
    })
    
    expect(swRegistration).toBeTruthy()
  })

  test('should handle offline state', async ({ page }) => {
    await page.goto('/home')
    
    // Mock offline state
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    
    // Check offline banner appears
    await expect(page.locator('.offline-banner')).toContainText('オフラインモードです')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/home')
    
    // Check mobile layout
    const tabNav = page.locator('.tab-navigation')
    await expect(tabNav).toBeVisible()
    
    const boundingBox = await tabNav.boundingBox()
    expect(boundingBox?.width).toBeLessThanOrEqual(375)
  })

  test('should show installability prompt elements', async ({ page }) => {
    await page.goto('/register')
    
    // Check install instructions are present
    await expect(page.locator('.install-instructions')).toBeVisible()
    await expect(page.locator('.install-instructions h2')).toContainText(['Android', 'iPhone'])
  })
})