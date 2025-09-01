import { test, expect } from '@playwright/test'

test.describe('Authentication Tests', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/プレゼント企画アプリ/)
    await expect(page.locator('h1')).toContainText('ログイン')
    await expect(page.locator('.google-login')).toBeVisible()
    await expect(page.locator('.twitter-login')).toBeVisible()
  })

  test('should redirect to register page from root', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/register/)
  })

  test('should show install instructions after login', async ({ page }) => {
    await page.goto('/register')
    
    // Mock successful authentication
    await page.addInitScript(() => {
      const mockUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー',
        email: 'test@example.com'
      }
      
      // Mock Firebase auth state
      window.mockAuthUser = mockUser
    })
    
    await page.reload()
    
    // Check if install instructions are shown
    await expect(page.locator('h1')).toContainText('アプリをインストール')
    await expect(page.locator('.install-instructions')).toBeVisible()
  })

  test('should handle Google login button click', async ({ page }) => {
    await page.goto('/register')
    
    // Intercept Firebase auth calls
    await page.route('https://accounts.google.com/**', (route) => {
      route.fulfill({
        status: 200,
        body: 'Mock Google auth response'
      })
    })
    
    const loginButton = page.locator('.google-login')
    await expect(loginButton).toBeVisible()
    
    // Click should not throw error
    await loginButton.click()
  })

  test('should show notification warning when not enabled', async ({ page }) => {
    await page.goto('/register')
    
    // Mock authenticated user without notifications
    await page.addInitScript(() => {
      window.mockAuthUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー'
      }
      window.mockProfile = {
        notificationEnabled: false
      }
    })
    
    await page.reload()
    
    await expect(page.locator('.notification-warning')).toContainText('通知を有効にしてください')
  })
})