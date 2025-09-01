# Playwright テスト環境セットアップタスク

## 目的

Playwrightを使用したテスト環境を段階的に構築し、小さなテストから始めて徐々に拡張する。

## 要件

### 技術要件
- Playwright の最新版を使用
- TypeScript サポート
- 複数ブラウザ対応（Chrome, Firefox, Safari）
- CI/CD 対応
- スクリーンショット機能
- レポート生成機能

### 機能要件
- 認証状態のテスト
- ページ遷移のテスト
- フォーム入力のテスト
- PWA機能のテスト

## 段階的実装計画

### Phase 1: 基本セットアップ
- [ ] Playwright インストール
- [ ] 基本設定ファイル作成
- [ ] 簡単なページロードテスト

### Phase 2: 認証テスト
- [ ] ログインフォームテスト
- [ ] セッション保持テスト
- [ ] ログアウトテスト

### Phase 3: ページ機能テスト
- [ ] マイページ表示テスト
- [ ] 設定ページテスト
- [ ] ナビゲーションテスト

### Phase 4: 高度な機能テスト
- [ ] PWAインストールテスト
- [ ] オフライン機能テスト
- [ ] 通知機能テスト

## 入力ファイル

- `playwright.config.ts` (既存)
- `package.json` (既存)
- アプリケーションソースコード

## 出力ファイル

- `tests/` ディレクトリ内のテストファイル
- テストレポート
- スクリーンショット

## テスト戦略

### 1. 単体テスト（Phase 1）
```typescript
// 例: 基本的なページロードテスト
test('ホームページが正常に表示される', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveTitle(/PWA Twitter Present/);
});
```

### 2. 統合テスト（Phase 2-3）
```typescript
// 例: ログインフローテスト
test('ログインフローが正常に動作する', async ({ page }) => {
  await page.goto('/register');
  // ログイン処理
  await page.goto('/mypage');
  await expect(page.locator('h1')).toContainText('ユーザー');
});
```

### 3. E2Eテスト（Phase 4）
```typescript
// 例: 完全なユーザージャーニーテスト
test('新規ユーザー登録からマイページまでの完全フロー', async ({ page }) => {
  // 完全なユーザージャーニーをテスト
});
```

## 検証手順

1. **Phase 1 検証**
   ```bash
   npm run test:playwright -- --grep "基本"
   ```

2. **Phase 2 検証**
   ```bash
   npm run test:playwright -- --grep "認証"
   ```

3. **Phase 3 検証**
   ```bash
   npm run test:playwright -- --grep "ページ"
   ```

4. **Phase 4 検証**
   ```bash
   npm run test:playwright -- --grep "PWA"
   ```

## 成功基準

- [ ] 各フェーズのテストが100%パスする
- [ ] テスト実行時間が合理的（各フェーズ5分以内）
- [ ] テストレポートが生成される
- [ ] CI/CDパイプラインで実行可能

## 注意事項

- 各フェーズは独立して実行可能であること
- テストデータの準備と後処理を含めること
- 環境変数を適切に設定すること
- セキュリティ情報をハードコードしないこと

## 依存関係

- Node.js 18+
- npm または yarn
- Firebase エミュレータ（テスト用）
- 環境変数設定