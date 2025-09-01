import { participationService } from './participationService';
import { ApiResponse } from '../types/database';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  installPromptShownCount: number;
  lastPromptShownAt: Date | null;
  installPromptDismissedAt: Date | null;
}

export class PWAPromotionService {
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private installState: PWAInstallState = {
    isInstallable: false,
    isInstalled: false,
    installPromptEvent: null,
    installPromptShownCount: 0,
    lastPromptShownAt: null,
    installPromptDismissedAt: null
  };

  private readonly PROMPT_COOLDOWN_HOURS = 24;
  private readonly MAX_PROMPT_COUNT = 3;
  private readonly INSTALL_DELAY_MS = 30000; // 30秒後に初回プロンプト

  constructor() {
    this.initializePWADetection();
    this.loadInstallState();
  }

  // PWA検知の初期化
  private initializePWADetection(): void {
    // beforeinstallprompt イベントをリッスン
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.installState.isInstallable = true;
      this.installState.installPromptEvent = this.installPromptEvent;
      
      console.log('PWA installable detected');
      this.scheduleInstallPrompt();
    });

    // アプリがインストールされた時のイベント
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.installState.isInstalled = true;
      this.onPWAInstalled();
    });

    // 既にインストール済みかチェック
    this.checkIfAlreadyInstalled();
  }

  // 既にインストール済みかチェック
  private checkIfAlreadyInstalled(): void {
    // iOS Safari PWA チェック
    if ((navigator as any).standalone === true) {
      this.installState.isInstalled = true;
      return;
    }

    // Android Chrome PWA チェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.installState.isInstalled = true;
      return;
    }

    // その他のPWAチェック
    if (document.referrer.includes('android-app://')) {
      this.installState.isInstalled = true;
      return;
    }
  }

  // インストール状態の保存
  private saveInstallState(): void {
    const stateToSave = {
      installPromptShownCount: this.installState.installPromptShownCount,
      lastPromptShownAt: this.installState.lastPromptShownAt?.toISOString(),
      installPromptDismissedAt: this.installState.installPromptDismissedAt?.toISOString(),
      isInstalled: this.installState.isInstalled
    };
    localStorage.setItem('pwa_install_state', JSON.stringify(stateToSave));
  }

  // インストール状態の読み込み
  private loadInstallState(): void {
    try {
      const saved = localStorage.getItem('pwa_install_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.installState.installPromptShownCount = state.installPromptShownCount || 0;
        this.installState.lastPromptShownAt = state.lastPromptShownAt ? new Date(state.lastPromptShownAt) : null;
        this.installState.installPromptDismissedAt = state.installPromptDismissedAt ? new Date(state.installPromptDismissedAt) : null;
        this.installState.isInstalled = state.isInstalled || false;
      }
    } catch (error) {
      console.error('Error loading install state:', error);
    }
  }

  // インストールプロンプトのスケジュール
  private scheduleInstallPrompt(): void {
    if (!this.shouldShowInstallPrompt()) {
      return;
    }

    // 初回は30秒後、その後はページ読み込み時に即座に
    const delay = this.installState.installPromptShownCount === 0 ? this.INSTALL_DELAY_MS : 5000;
    
    setTimeout(() => {
      this.showInstallPrompt();
    }, delay);
  }

  // インストールプロンプトを表示すべきかチェック
  private shouldShowInstallPrompt(): boolean {
    // 既にインストール済み
    if (this.installState.isInstalled) {
      return false;
    }

    // インストール不可能
    if (!this.installState.isInstallable) {
      return false;
    }

    // 最大表示回数に達している
    if (this.installState.installPromptShownCount >= this.MAX_PROMPT_COUNT) {
      return false;
    }

    // クールダウン期間中
    if (this.installState.lastPromptShownAt) {
      const hoursSinceLastPrompt = (Date.now() - this.installState.lastPromptShownAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastPrompt < this.PROMPT_COOLDOWN_HOURS) {
        return false;
      }
    }

    return true;
  }

  // カスタムインストールプロンプトの表示
  public async showInstallPrompt(): Promise<ApiResponse<boolean>> {
    try {
      if (!this.shouldShowInstallPrompt()) {
        return {
          success: false,
          error: 'Install prompt should not be shown at this time'
        };
      }

      // カスタムUIでプロンプトを表示
      const userWantsToInstall = await this.showCustomInstallDialog();
      
      this.installState.installPromptShownCount++;
      this.installState.lastPromptShownAt = new Date();
      this.saveInstallState();

      // 参加者情報がある場合は記録
      const userId = this.getCurrentUserId();
      const campaignId = this.getCurrentCampaignId();
      if (userId && campaignId) {
        await participationService.recordInstallPromptShown(userId, campaignId);
      }

      if (userWantsToInstall && this.installPromptEvent) {
        // ネイティブプロンプトを表示
        await this.installPromptEvent.prompt();
        
        const choiceResult = await this.installPromptEvent.userChoice;
        
        if (choiceResult.outcome === 'dismissed') {
          this.installState.installPromptDismissedAt = new Date();
          this.saveInstallState();
        }

        return {
          success: true,
          data: choiceResult.outcome === 'accepted'
        };
      }

      return {
        success: true,
        data: false
      };
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return {
        success: false,
        error: 'Failed to show install prompt'
      };
    }
  }

  // カスタムインストールダイアログの表示
  private async showCustomInstallDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      // カスタムモーダルを作成
      const modal = this.createInstallModal();
      document.body.appendChild(modal);

      // イベントリスナーを設定
      const installButton = modal.querySelector('.install-button');
      const cancelButton = modal.querySelector('.cancel-button');
      const closeButton = modal.querySelector('.close-button');

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      installButton?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelButton?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      closeButton?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // 背景クリックで閉じる
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  // インストールモーダルのHTML作成
  private createInstallModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'pwa-install-modal';
    modal.innerHTML = `
      <div class="pwa-install-modal-overlay">
        <div class="pwa-install-modal-content">
          <button class="close-button" aria-label="閉じる">×</button>
          <div class="pwa-install-icon">
            📱
          </div>
          <h2 class="pwa-install-title">アプリをインストールしませんか？</h2>
          <div class="pwa-install-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">🚀</span>
              <span class="benefit-text">アプリのように高速起動</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📢</span>
              <span class="benefit-text">プッシュ通知を受信</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📶</span>
              <span class="benefit-text">オフラインでも基本機能を利用</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎯</span>
              <span class="benefit-text">ホーム画面から直接アクセス</span>
            </div>
          </div>
          <div class="pwa-install-actions">
            <button class="install-button">インストール</button>
            <button class="cancel-button">後で</button>
          </div>
          <p class="pwa-install-note">
            インストールは無料で、いつでもアンインストールできます
          </p>
        </div>
      </div>
    `;

    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .pwa-install-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      
      .pwa-install-modal-content {
        position: relative;
        background: white;
        border-radius: 16px;
        padding: 24px;
        margin: 20px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        text-align: center;
        animation: modalSlideIn 0.3s ease-out;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .close-button {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .close-button:hover {
        background: #f0f0f0;
      }
      
      .pwa-install-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .pwa-install-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #333;
      }
      
      .pwa-install-benefits {
        text-align: left;
        margin-bottom: 24px;
      }
      
      .benefit-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .benefit-icon {
        font-size: 18px;
        margin-right: 12px;
        width: 24px;
        text-align: center;
      }
      
      .benefit-text {
        font-size: 14px;
        color: #555;
      }
      
      .pwa-install-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .install-button {
        flex: 1;
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .install-button:hover {
        background: #0056b3;
      }
      
      .cancel-button {
        flex: 1;
        background: #f8f9fa;
        color: #666;
        border: 1px solid #dee2e6;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .cancel-button:hover {
        background: #e9ecef;
      }
      
      .pwa-install-note {
        font-size: 12px;
        color: #888;
        margin: 0;
      }
    `;
    
    modal.appendChild(style);
    return modal;
  }

  // PWAインストール完了時の処理
  private async onPWAInstalled(): Promise<void> {
    this.installState.isInstalled = true;
    this.saveInstallState();

    // 参加者情報がある場合は更新
    const userId = this.getCurrentUserId();
    const campaignId = this.getCurrentCampaignId();
    if (userId && campaignId) {
      await participationService.updatePwaInstallStatus(userId, campaignId, true);
    }

    // インストール完了の通知を表示
    this.showInstallSuccessMessage();
  }

  // インストール成功メッセージの表示
  private showInstallSuccessMessage(): void {
    const message = document.createElement('div');
    message.className = 'pwa-install-success';
    message.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-text">アプリのインストールが完了しました！</span>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-success {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        animation: successSlideIn 0.3s ease-out;
      }
      
      @keyframes successSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .success-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .success-icon {
        font-size: 18px;
      }
      
      .success-text {
        font-size: 14px;
        font-weight: 500;
      }
    `;

    message.appendChild(style);
    document.body.appendChild(message);

    // 3秒後に自動で削除
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  // 現在のユーザーIDを取得（実装に応じて調整）
  private getCurrentUserId(): string | null {
    // 実際の実装では、認証システムからユーザーIDを取得
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }

  // 現在のキャンペーンIDを取得（実装に応じて調整）
  private getCurrentCampaignId(): string | null {
    // URLパラメータやローカルストレージからキャンペーンIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('campaignId') || localStorage.getItem('currentCampaignId');
  }

  // 公開メソッド：インストール状態の取得
  public getInstallState(): PWAInstallState {
    return { ...this.installState };
  }

  // 公開メソッド：手動でインストールプロンプトを表示
  public async triggerInstallPrompt(): Promise<ApiResponse<boolean>> {
    return await this.showInstallPrompt();
  }

  // 公開メソッド：PWAがインストール済みかチェック
  public isInstalled(): boolean {
    return this.installState.isInstalled;
  }

  // 公開メソッド：PWAがインストール可能かチェック
  public isInstallable(): boolean {
    return this.installState.isInstallable && !this.installState.isInstalled;
  }
}

export const pwaPromotionService = new PWAPromotionService();