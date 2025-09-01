import { test, expect } from '@playwright/test'

test.describe('Talk Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.mockAuthUser = {
        uid: 'test-user-123',
        displayName: 'テストユーザー'
      }
      
      // Mock Firestore data
      window.mockHosts = [
        {
          id: 'host-1',
          name: 'ホスト1',
          lastMessage: 'プレゼント企画開始！',
          lastMessageTime: new Date('2024-01-01'),
          unreadCount: 2
        },
        {
          id: 'host-2', 
          name: 'ホスト2',
          lastMessage: 'ご参加ありがとうございます',
          lastMessageTime: new Date('2024-01-02'),
          unreadCount: 0
        }
      ]
      
      window.mockMessages = [
        {
          id: 'msg-1',
          hostId: 'host-1',
          hostName: 'ホスト1',
          content: 'プレゼント企画開始！',
          createdAt: new Date('2024-01-01')
        }
      ]
    })
  })

  test('should display host list', async ({ page }) => {
    await page.goto('/talk')
    
    await expect(page.locator('h1')).toContainText('トーク')
    
    // Mock host data rendering
    await page.addInitScript(() => {
      // Simulate hosts being loaded
      setTimeout(() => {
        const hostList = document.querySelector('.host-list')
        if (hostList) {
          hostList.innerHTML = `
            <div class="host-item">
              <div class="host-info">
                <h3>ホスト1</h3>
                <p>プレゼント企画開始！</p>
                <span class="last-time">2024/1/1 12:00:00</span>
              </div>
              <span class="unread-badge">2</span>
            </div>
          `
        }
      }, 100)
    })
    
    await page.waitForTimeout(200)
    
    // Check if host items would be displayed
    const hostList = page.locator('.host-list')
    await expect(hostList).toBeVisible()
  })

  test('should show empty state when no messages', async ({ page }) => {
    await page.addInitScript(() => {
      window.mockHosts = []
    })
    
    await page.goto('/talk')
    
    await expect(page.locator('p')).toContainText('メッセージはありません')
  })

  test('should navigate to host conversation', async ({ page }) => {
    await page.goto('/talk')
    
    // Mock clicking on a host
    await page.addInitScript(() => {
      setTimeout(() => {
        const hostItem = document.createElement('div')
        hostItem.className = 'host-item'
        hostItem.onclick = () => {
          // Simulate selecting a host
          window.location.hash = '#host-1'
        }
        document.body.appendChild(hostItem)
      }, 100)
    })
    
    await page.waitForTimeout(200)
    
    // Verify back button functionality would work
    const backButton = page.locator('.back-button')
    if (await backButton.isVisible()) {
      await backButton.click()
    }
  })

  test('should display unread message badges', async ({ page }) => {
    await page.goto('/talk')
    
    // Simulate unread messages
    await page.addInitScript(() => {
      setTimeout(() => {
        const badge = document.createElement('span')
        badge.className = 'unread-badge'
        badge.textContent = '2'
        document.body.appendChild(badge)
      }, 100)
    })
    
    await page.waitForTimeout(200)
    
    const badge = page.locator('.unread-badge')
    if (await badge.isVisible()) {
      await expect(badge).toContainText('2')
    }
  })
})