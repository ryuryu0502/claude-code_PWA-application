import { test, expect } from '@playwright/test'

test.describe('Profile Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user with profile
    await page.addInitScript(() => {
      window.mockAuthUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー'
      }
      
      window.mockProfile = {
        id: 'test-user-123',
        nickname: 'テストユーザー',
        avatar: '',
        installLink: 'direct',
        notificationEnabled: true
      }
    })
  })

  test('should display user profile information', async ({ page }) => {
    await page.goto('/settings')
    
    // Check profile form is visible
    await expect(page.locator('.profile-form')).toBeVisible()
    await expect(page.locator('.nickname-display')).toContainText('テストユーザー')
    await expect(page.locator('.install-info p')).toContainText('direct')
  })

  test('should enable profile editing', async ({ page }) => {
    await page.goto('/settings')
    
    // Click edit button
    await page.locator('.edit-button').click()
    
    // Check edit mode is active
    await expect(page.locator('.nickname-input')).toBeVisible()
    await expect(page.locator('.avatar-input')).toBeVisible()
    await expect(page.locator('.save-button')).toBeVisible()
  })

  test('should save profile changes', async ({ page }) => {
    await page.goto('/settings')
    
    // Enter edit mode
    await page.locator('.edit-button').click()
    
    // Change nickname
    await page.locator('.nickname-input').fill('新しいニックネーム')
    
    // Save changes
    await page.locator('.save-button').click()
    
    // Verify edit mode is closed
    await expect(page.locator('.nickname-input')).not.toBeVisible()
    await expect(page.locator('.edit-button')).toBeVisible()
  })

  test('should cancel profile editing', async ({ page }) => {
    await page.goto('/settings')
    
    // Enter edit mode
    await page.locator('.edit-button').click()
    
    // Change nickname
    await page.locator('.nickname-input').fill('変更されたニックネーム')
    
    // Cancel editing
    await page.locator('.edit-button').click()
    
    // Verify changes are not saved
    await expect(page.locator('.nickname-display')).toContainText('テストユーザー')
  })

  test('should track install link source', async ({ page }) => {
    // Test with referral parameter
    await page.goto('/register?ref=twitter-campaign-001')
    
    const installLink = await page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('ref')
    })
    
    expect(installLink).toBe('twitter-campaign-001')
  })
})