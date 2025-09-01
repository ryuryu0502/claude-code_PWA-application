#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import admin from 'firebase-admin'

class PresentAppMCPServer {
  private server: Server
  private firebaseApp: admin.app.App | null = null

  constructor() {
    this.server = new Server(
      {
        name: 'present-app-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupToolHandlers()
  }

  private initializeFirebase() {
    if (!this.firebaseApp) {
      const serviceAccount = {
        type: "service_account",
        project_id: "push-manager-2acdb",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: 'push-manager-2acdb'
      })
    }
    return this.firebaseApp
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'test_firebase_auth',
            description: 'Test Firebase authentication setup',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'send_test_notification',
            description: 'Send a test push notification',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'FCM registration token',
                },
                title: {
                  type: 'string',
                  description: 'Notification title',
                },
                body: {
                  type: 'string',
                  description: 'Notification body',
                },
              },
              required: ['token', 'title', 'body'],
            },
          },
          {
            name: 'create_test_user',
            description: 'Create a test user in Firestore',
            inputSchema: {
              type: 'object',
              properties: {
                uid: {
                  type: 'string',
                  description: 'User ID',
                },
                nickname: {
                  type: 'string',
                  description: 'User nickname',
                },
              },
              required: ['uid', 'nickname'],
            },
          },
        ],
      }
    })

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'test_firebase_auth':
            return await this.testFirebaseAuth()
          
          case 'send_test_notification':
            return await this.sendTestNotification(
              args.token as string,
              args.title as string,
              args.body as string
            )
          
          case 'create_test_user':
            return await this.createTestUser(
              args.uid as string,
              args.nickname as string
            )
          
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    })
  }

  private async testFirebaseAuth() {
    try {
      const app = this.initializeFirebase()
      const auth = admin.auth(app)
      
      const users = await auth.listUsers(1)
      
      return {
        content: [
          {
            type: 'text',
            text: `Firebase認証接続成功！プロジェクトID: ${app.options.projectId}\nユーザー数: ${users.users.length}`,
          },
        ],
      }
    } catch (error) {
      throw new Error(`Firebase認証テスト失敗: ${error}`)
    }
  }

  private async sendTestNotification(token: string, title: string, body: string) {
    try {
      const app = this.initializeFirebase()
      const messaging = admin.messaging(app)

      const message = {
        notification: {
          title,
          body,
        },
        token,
      }

      const response = await messaging.send(message)
      
      return {
        content: [
          {
            type: 'text',
            text: `通知送信成功！メッセージID: ${response}`,
          },
        ],
      }
    } catch (error) {
      throw new Error(`通知送信失敗: ${error}`)
    }
  }

  private async createTestUser(uid: string, nickname: string) {
    try {
      const app = this.initializeFirebase()
      const firestore = admin.firestore(app)

      const userRef = firestore.collection('users').doc(uid)
      await userRef.set({
        id: uid,
        nickname,
        avatar: '',
        installLink: 'test',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        notificationEnabled: false
      })

      return {
        content: [
          {
            type: 'text',
            text: `テストユーザー作成成功！UID: ${uid}, ニックネーム: ${nickname}`,
          },
        ],
      }
    } catch (error) {
      throw new Error(`ユーザー作成失敗: ${error}`)
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Present App MCP Server running on stdio')
  }
}

const server = new PresentAppMCPServer()
server.run().catch(console.error)