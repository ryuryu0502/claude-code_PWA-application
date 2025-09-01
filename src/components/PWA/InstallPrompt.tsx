import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Zap, Bell, Wifi } from 'lucide-react';
import { pwaPromotionService } from '../../services/pwaPromotionService';
import styles from './InstallPrompt.module.css';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  campaignId?: string;
  variant?: 'banner' | 'modal' | 'floating';
  title?: string;
  description?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss,
  campaignId,
  variant = 'banner',
  title = 'アプリをインストールしませんか？',
  description = 'より快適にご利用いただけます'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // PWAインストール可能性をチェック
    const checkInstallability = async () => {
      const canInstall = await pwaPromotionService.canShowInstallPrompt();
      if (canInstall) {
        setIsVisible(true);
        // インストールプロンプト表示をログ
        if (campaignId) {
          await pwaPromotionService.logInstallPromptShown(campaignId);
        }
      }
    };

    checkInstallability();

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [campaignId]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // ブラウザ固有のインストール手順を表示
      showManualInstallInstructions();
      return;
    }

    setIsInstalling(true);

    try {
      // ネイティブインストールプロンプトを表示
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // インストール成功をログ
        if (campaignId) {
          await pwaPromotionService.recordInstallation(campaignId);
        }
        onInstall?.();
        setIsVisible(false);
      }
    } catch (error) {
      console.error('インストールエラー:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    if (campaignId) {
      await pwaPromotionService.dismissInstallPrompt(campaignId);
    }
    onDismiss?.();
  };

  const showManualInstallInstructions = () => {
    // ブラウザ別のインストール手順を表示
    const userAgent = navigator.userAgent;
    let instructions = '';

    if (userAgent.includes('Chrome')) {
      instructions = 'メニュー（⋮）→「アプリをインストール」をタップしてください';
    } else if (userAgent.includes('Safari')) {
      instructions = '共有ボタン（□↗）→「ホーム画面に追加」をタップしてください';
    } else if (userAgent.includes('Firefox')) {
      instructions = 'メニュー（⋮）→「ホーム画面に追加」をタップしてください';
    } else {
      instructions = 'ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください';
    }

    alert(instructions);
  };

  if (!isVisible) return null;

  const benefits = [
    { icon: Zap, text: 'アプリのように高速起動' },
    { icon: Bell, text: 'プッシュ通知を受信' },
    { icon: Wifi, text: 'オフラインでも基本機能利用可能' }
  ];

  return (
    <>
      {variant === 'banner' && (
        <div className={`${styles.installPrompt} ${styles.banner} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerInfo}>
              <div className={styles.bannerIcon}>
                <Smartphone size={24} />
              </div>
              <div className={styles.bannerText}>
                <h3 className={styles.bannerTitle}>{title}</h3>
                <p className={styles.bannerDescription}>{description}</p>
              </div>
            </div>
            <div className={styles.bannerActions}>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className={styles.installButton}
              >
                {isInstalling ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Download size={16} />
                )}
                <span>{isInstalling ? 'インストール中...' : 'インストール'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {variant === 'modal' && (
        <div className={`${styles.installPrompt} ${styles.modal} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <Smartphone size={40} />
            </div>
            <h2 className={styles.modalTitle}>{title}</h2>
            <p className={styles.modalDescription}>{description}</p>
            <div className={styles.benefitsList}>
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>
                      <Icon size={16} />
                    </div>
                    <span className={styles.benefitText}>{benefit.text}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDismiss}
                className={styles.modalCloseButton}
              >
                後で
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className={styles.modalInstallButton}
              >
                {isInstalling ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Download size={20} />
                )}
                <span>{isInstalling ? 'インストール中...' : 'インストール'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {variant === 'floating' && (
        <div className={`${styles.installPrompt} ${styles.floating} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.floatingHeader}>
            <div className={styles.floatingIcon}>
              <Smartphone size={20} />
            </div>
            <button
              onClick={handleDismiss}
              className={styles.floatingCloseButton}
            >
              <X size={18} />
            </button>
          </div>
          <h3 className={styles.floatingTitle}>{title}</h3>
          <p className={styles.floatingDescription}>{description}</p>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={styles.floatingInstallButton}
          >
            {isInstalling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Download size={16} />
            )}
            <span>{isInstalling ? 'インストール中...' : 'インストール'}</span>
          </button>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;