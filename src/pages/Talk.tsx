import React, { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from '../stores/authStore'

interface Message {
  id: string
  hostId: string
  hostName: string
  content: string
  createdAt: Date
}

interface Host {
  id: string
  name: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
}

const Talk: React.FC = () => {
  const { user } = useAuthStore()
  const [hosts, setHosts] = useState<Host[]>([])
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!user) return

    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hostMap = new Map<string, Host>()
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const hostId = data.hostId
        
        if (!hostMap.has(hostId)) {
          hostMap.set(hostId, {
            id: hostId,
            name: data.hostName,
            lastMessage: data.content,
            lastMessageTime: data.createdAt.toDate(),
            unreadCount: data.isRead ? 0 : 1
          })
        } else {
          const host = hostMap.get(hostId)!
          if (!data.isRead) {
            host.unreadCount++
          }
        }
      })

      setHosts(Array.from(hostMap.values()))
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || !selectedHost) return

    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('recipientId', '==', user.uid),
      where('hostId', '==', selectedHost),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hostMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Message[]
      
      setMessages(hostMessages)
    })

    return () => unsubscribe()
  }, [user, selectedHost])

  if (selectedHost) {
    return (
      <div className="talk-page">
        <div className="message-header">
          <button onClick={() => setSelectedHost(null)} className="back-button">
            ← 戻る
          </button>
          <h2>{hosts.find(h => h.id === selectedHost)?.name}</h2>
        </div>
        
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className="message">
              <p>{message.content}</p>
              <span className="message-time">
                {message.createdAt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="talk-page">
      <h1>トーク</h1>
      
      <div className="host-list">
        {hosts.length === 0 ? (
          <p>メッセージはありません</p>
        ) : (
          hosts.map((host) => (
            <div 
              key={host.id} 
              className="host-item"
              onClick={() => setSelectedHost(host.id)}
            >
              <div className="host-info">
                <h3>{host.name}</h3>
                <p>{host.lastMessage}</p>
                <span className="last-time">
                  {host.lastMessageTime?.toLocaleString()}
                </span>
              </div>
              {host.unreadCount > 0 && (
                <span className="unread-badge">{host.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Talk