import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../stores/authStore'
import { useHostStore } from '../stores/hostStore'

const MyPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile } = useAuthStore()
  const { hostProfile } = useHostStore()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
          <p className="text-gray-600">このページを表示するにはログインしてください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6 mb-8">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="プロフィール画像"
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.nickname || user.displayName || 'ユーザー'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ユーザー情報 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ユーザー情報</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">ユーザーID:</span>
                    <p className="text-gray-900 font-mono text-sm">{user.uid}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">登録日:</span>
                    <p className="text-gray-900">
                      {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('ja-JP') : '不明'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">通知設定:</span>
                    <p className="text-gray-900">
                      {profile?.notificationEnabled ? '有効' : '無効'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">インストール元:</span>
                    <p className="text-gray-900">{profile?.installLink || 'direct'}</p>
                  </div>
                </div>
              </div>

              {/* ホスト情報 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ホスト情報</h2>
                {hostProfile ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">ホスト名:</span>
                      <p className="text-gray-900">{hostProfile.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">説明:</span>
                      <p className="text-gray-900">{hostProfile.description}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">ウェブサイト:</span>
                      <p className="text-gray-900">{hostProfile.website || '未設定'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">ホスト登録日:</span>
                      <p className="text-gray-900">
                        {new Date(hostProfile.createdAt.seconds * 1000).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">ホストとして登録されていません</p>
                )}
              </div>

              {/* 認証状態 */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-green-900 mb-4">認証状態</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-900 font-medium">ログイン中</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">認証プロバイダー:</span>
                    <p className="text-green-900">
                      {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'メール'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">最終ログイン:</span>
                    <p className="text-green-900">
                      {user.metadata.lastSignInTime ? 
                        new Date(user.metadata.lastSignInTime).toLocaleString('ja-JP') : 
                        '不明'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* アクション */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">アクション</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    ログアウト
                  </button>
                  <button
                    onClick={() => window.location.href = '/settings'}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    設定画面へ
                  </button>
                  {hostProfile && (
                    <button
                      onClick={() => window.location.href = '/host-dashboard'}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      ホストダッシュボードへ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPage