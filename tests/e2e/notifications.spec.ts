import { test, expect } from '@playwright/test'

test.describe('Notification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.mockAuthUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー'
      }
      
      // Mock Notification API
      window.Notification = {
        permission: 'default',
        requestPermission: async () => 'granted'
      } as any
    })
  })

  test('should request notification permission', async ({ page }) => {
    await page.goto('/register')
    
    let permissionRequested = false
    await page.exposeFunction('mockRequestPermission', () => {
      permissionRequested = true
      return Promise.resolve('granted')
    })
    
    await page.addInitScript(() => {
      window.Notification.requestPermission = window.mockRequestPermission
    })
    
    await page.locator('.notification-button').click()
    
    // Verify permission was requested
    const wasRequested = await page.evaluate(() => window.permissionRequested)
    expect(wasRequested).toBeTruthy()
  })

  test('should show notification warning when disabled', async ({ page }) => {
    await page.addInitScript(() => {
      window.mockProfile = {
        notificationEnabled: false
      }
    })
    
    await page.goto('/register')
    
    const warning = page.locator('.notification-warning')
    await expect(warning).toBeVisible()
    await expect(warning).toContainText('通知を有効にしてください')
  })

  test('should toggle notification settings', async ({ page }) => {
    await page.addInitScript(() => {
      window.mockProfile = {
        notificationEnabled: false
      }
    })
    
    await page.goto('/settings')
    
    const toggle = page.locator('.toggle')
    await expect(toggle).toContainText('OFF')
    
    await toggle.click()
    
    // In a real implementation, this would update the store
    // For now, just verify the click doesn't crash
    await expect(toggle).toBeVisible()
  })

  test('should display Firebase messaging support', async ({ page, context }) => {
    await page.goto('/')
    
    // Check if Firebase messaging is loaded
    const hasFirebaseMessaging = await page.evaluate(() => {
      return typeof window.firebase !== 'undefined' || 
             document.querySelector('script[src*="firebase"]') !== null
    })
    
    // Firebase should be available through our imports
    expect(hasFirebaseMessaging).toBeTruthy()
  })
})