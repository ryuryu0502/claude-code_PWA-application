import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'

const ProfileForm: React.FC = () => {
  const { profile, updateProfile } = useAuthStore()
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [avatar, setAvatar] = useState(profile?.avatar || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    if (!profile) return
    
    await updateProfile({
      nickname: nickname.trim() || 'ユーザー',
      avatar
    })
    setIsEditing(false)
  }

  if (!profile) {
    return <div>プロフィール情報を読み込み中...</div>
  }

  return (
    <div className="profile-form">
      <div className="profile-header">
        <h2>プロフィール</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="edit-button"
        >
          {isEditing ? 'キャンセル' : '編集'}
        </button>
      </div>

      <div className="profile-content">
        <div className="avatar-section">
          <img 
            src={avatar || '/default-avatar.png'} 
            alt="アバター" 
            className="avatar"
          />
          {isEditing && (
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="アバターURL"
              className="avatar-input"
            />
          )}
        </div>

        <div className="nickname-section">
          <label>ニックネーム</label>
          {isEditing ? (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネーム"
              className="nickname-input"
            />
          ) : (
            <p className="nickname-display">{profile.nickname}</p>
          )}
        </div>

        <div className="install-info">
          <label>インストール元</label>
          <p>{profile.installLink || 'direct'}</p>
        </div>

        {isEditing && (
          <button onClick={handleSave} className="save-button">
            保存
          </button>
        )}
      </div>
    </div>
  )
}

export default ProfileForm