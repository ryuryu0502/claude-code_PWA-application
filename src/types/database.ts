// 改善されたデータベース型定義
// ハードコーディング問題の解決と参加者管理の正規化

export interface Host {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  // 統計情報
  totalCampaigns: number;
  totalParticipants: number;
}

export interface Campaign {
  id: string;
  hostId: string;
  hostUsername: string; // 非正規化データ（パフォーマンス向上のため）
  title: string;
  description: string;
  giftDescription: string;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  drawDate: Date;
  status: 'draft' | 'active' | 'ended' | 'drawn';
  createdAt: Date;
  updatedAt: Date;
  // 追跡情報
  uniqueLink: string;
  accessCount: number;
  installPromptShown: number;
  installCompleted: number;
  // 参加者統計
  participantCount: number;
  winnerCount: number;
}

// 参加者管理の正規化
export interface UserCampaignParticipation {
  id: string;
  userId: string;
  campaignId: string;
  hostId: string;
  // 参加情報
  participatedAt: Date;
  referralSource: string; // リンク追跡用
  // PWA関連
  isPwaInstalled: boolean;
  pwaInstalledAt?: Date;
  installPromptShownAt?: Date;
  installPromptDismissedAt?: Date;
  // 通知関連
  notificationEnabled: boolean;
  notificationToken?: string;
  // 抽選結果
  isWinner: boolean;
  wonAt?: Date;
  prizeClaimedAt?: Date;
}

// リンク追跡システム
export interface CampaignLink {
  id: string;
  campaignId: string;
  hostId: string;
  uniqueCode: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: Date;
  // 追跡統計
  clickCount: number;
  uniqueVisitors: number;
  conversionRate: number; // 参加率
  installRate: number; // PWAインストール率
}

// アクセス追跡
export interface AccessLog {
  id: string;
  campaignId: string;
  linkId?: string;
  userId?: string;
  // アクセス情報
  accessedAt: Date;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  // PWA関連
  isPwaAccess: boolean;
  installPromptShown: boolean;
  installCompleted: boolean;
}

// ユーザー情報の拡張
export interface User {
  id: string;
  email?: string;
  displayName?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  // PWA関連
  isPwaInstalled: boolean;
  pwaInstalledAt?: Date;
  installPromptCount: number;
  lastInstallPromptAt?: Date;
  // 通知関連
  notificationEnabled: boolean;
  notificationToken?: string;
  // 参加統計
  totalParticipations: number;
  totalWins: number;
}

// 分析・統計用
export interface CampaignAnalytics {
  campaignId: string;
  date: string; // YYYY-MM-DD format
  // アクセス統計
  totalAccess: number;
  uniqueVisitors: number;
  // 参加統計
  newParticipants: number;
  totalParticipants: number;
  // PWA統計
  installPromptShown: number;
  installCompleted: number;
  installRate: number;
  // 通知統計
  notificationsSent: number;
  notificationClickRate: number;
}

// ホスト分析用
export interface HostAnalytics {
  hostId: string;
  date: string; // YYYY-MM-DD format
  // キャンペーン統計
  activeCampaigns: number;
  totalParticipants: number;
  averageParticipantsPerCampaign: number;
  // PWA統計
  totalInstalls: number;
  installConversionRate: number;
  // エンゲージメント
  notificationEngagementRate: number;
}

// 設定管理
export interface AppConfig {
  id: string;
  // PWA設定
  pwaInstallPromptDelay: number; // ミリ秒
  pwaInstallPromptMaxCount: number;
  pwaInstallPromptCooldown: number; // 時間（時）
  // 通知設定
  defaultNotificationEnabled: boolean;
  notificationRetryCount: number;
  // キャンペーン設定
  maxCampaignsPerHost: number;
  maxParticipantsPerCampaign: number;
  // リンク設定
  linkExpirationDays: number;
  shortUrlDomain: string;
  updatedAt: Date;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ページネーション
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// フィルター・ソート
export interface CampaignFilter {
  hostId?: string;
  status?: Campaign['status'];
  startDate?: Date;
  endDate?: Date;
  hasWinners?: boolean;
}

export interface ParticipationFilter {
  userId?: string;
  campaignId?: string;
  hostId?: string;
  isPwaInstalled?: boolean;
  isWinner?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}