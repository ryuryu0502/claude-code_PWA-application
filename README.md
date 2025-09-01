# 🎁 プレゼント企画PWAアプリ

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blue)](https://claude.ai)

X(Twitter)でのプレゼント企画に参加できるPWA（Progressive Web App）です。

## 🚀 プレビューリンク

**ライブデモ**: https://push-manager-2acdb.web.app

## 概要

PWA形式でインストール可能なTwitterプレゼント企画アプリです。ユーザーはアプリをインストールして企画に参加し、ホストから送信される通知を受け取ることができます。

## 主要機能

### 🔐 認証システム
- Google/Xアカウントでのサインイン
- インストールリンクのトラッキング
- ユーザープロフィール管理

### 📱 PWA機能
- オフライン対応
- プッシュ通知
- ホーム画面へのインストール対応

### 🎁 プレゼント企画
- 企画参加システム
- 抽選機能
- 当選者通知

### 💬 メッセージング
- ホストからの一斉通知
- メッセージ履歴表示
- リアルタイム通知

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **PWA**: Vite PWA Plugin + Service Worker
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Testing**: Playwright
- **Styling**: CSS Modules

## セットアップ

### 前提条件
- Node.js 18以上
- Firebase プロジェクト

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルにFirebaseの設定を記述

# 開発サーバーの起動
npm run dev
```

### 環境変数

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run typecheck

# リント
npm run lint

# E2Eテスト実行
npx playwright test
```

## Firebase設定

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /campaigns/{campaignId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isHost == true;
    }
  }
}
```

## アプリ構造

### ページ構成
- **登録**: アプリインストール方法・認証
- **ホーム**: お知らせ・企画一覧
- **トーク**: 通知・メッセージ履歴
- **設定**: プロフィール・通知設定

### 主要コンポーネント
- `src/App.tsx`: メインアプリケーション
- `src/hooks/useAuth.ts`: 認証ロジック
- `src/stores/authStore.ts`: 認証状態管理
- `src/services/notificationService.ts`: プッシュ通知

## デプロイ

Firebase Hostingを使用してデプロイ：

```bash
# Firebase CLI のインストール
npm install -g firebase-tools

# ログイン
firebase login

# ビルド
npm run build

# デプロイ
firebase deploy
```

## ライセンス

MIT License

## 開発者

Claude Codeとのライブコーディングセッションで作成されました。