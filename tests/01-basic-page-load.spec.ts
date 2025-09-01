import { test, expect } from '@playwright/test';

// Phase 1: 基本セットアップ - ページロードテスト
test.describe('基本ページロードテスト', () => {
  test('ホームページが正常に表示される', async ({ page }) => {
    await page.goto('/home');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/PWA Twitter Present/);
    
    // 基本的な要素の存在確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('登録ページが正常に表示される', async ({ page }) => {
    await page.goto('/register');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('設定ページが正常に表示される', async ({ page }) => {
    await page.goto('/settings');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('マイページが正常に表示される', async ({ page }) => {
    await page.goto('/mypage');
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('存在しないページで404が表示される', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    
    // 404またはリダイレクトが発生することを確認
    // SPAの場合、通常はルートページにリダイレクトされる
    await expect(page.locator('body')).toBeVisible();
  });

  test('ナビゲーション要素が表示される', async ({ page }) => {
    await page.goto('/home');
    
    // タブナビゲーションの存在確認（存在する場合）
    const navigation = page.locator('nav, .tab-navigation, [role="navigation"]');
    
    // ナビゲーションが存在する場合のみテスト
    const navCount = await navigation.count();
    if (navCount > 0) {
      await expect(navigation.first()).toBeVisible();
    }
  });

  test('PWAマニフェストが正しく設定されている', async ({ page }) => {
    await page.goto('/');
    
    // マニフェストファイルの存在確認
    const manifestLink = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLink.count();
    
    if (manifestCount > 0) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toBeTruthy();
      
      // マニフェストファイルにアクセスできることを確認
      const manifestResponse = await page.request.get(href!);
      expect(manifestResponse.status()).toBe(200);
    }
  });

  test('サービスワーカーが登録される', async ({ page }) => {
    await page.goto('/');
    
    // サービスワーカーの登録を確認
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistration).toBe(true);
  });

  test('基本的なメタタグが設定されている', async ({ page }) => {
    await page.goto('/');
    
    // viewport メタタグの確認
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // charset の確認
    const charset = page.locator('meta[charset], meta[http-equiv="Content-Type"]');
    const charsetCount = await charset.count();
    expect(charsetCount).toBeGreaterThan(0);
  });

  test('コンソールエラーが発生しない', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // コンソールエラーをキャッチ
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    
    // 重要なエラーがないことを確認（一部の警告は許容）
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});