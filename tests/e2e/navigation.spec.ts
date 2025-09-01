import { test, expect } from '@playwright/test'

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.mockAuthUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー'
      }
    })
  })

  test('should show tab navigation for authenticated users', async ({ page }) => {
    await page.goto('/home')
    
    const tabNav = page.locator('.tab-navigation')
    await expect(tabNav).toBeVisible()
    
    // Check all tabs are present
    await expect(page.locator('.tab').nth(0)).toContainText('登録')
    await expect(page.locator('.tab').nth(1)).toContainText('ホーム')
    await expect(page.locator('.tab').nth(2)).toContainText('トーク')
    await expect(page.locator('.tab').nth(3)).toContainText('設定')
  })

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/home')
    
    // Navigate to Talk tab
    await page.locator('a[href="/talk"]').click()
    await expect(page).toHaveURL(/\/talk/)
    await expect(page.locator('h1')).toContainText('トーク')
    
    // Navigate to Settings tab
    await page.locator('a[href="/settings"]').click()
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.locator('h1')).toContainText('設定')
  })

  test('should show active tab styling', async ({ page }) => {
    await page.goto('/home')
    
    const homeTab = page.locator('a[href="/home"]')
    await expect(homeTab).toHaveClass(/active/)
    
    // Navigate to another tab
    await page.locator('a[href="/talk"]').click()
    const talkTab = page.locator('a[href="/talk"]')
    await expect(talkTab).toHaveClass(/active/)
  })

  test('should redirect unauthenticated users to register', async ({ page }) => {
    // Clear auth mock
    await page.addInitScript(() => {
      window.mockAuthUser = null
    })
    
    await page.goto('/home')
    await expect(page).toHaveURL(/\/register/)
    
    await page.goto('/talk')
    await expect(page).toHaveURL(/\/register/)
    
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/register/)
  })
})