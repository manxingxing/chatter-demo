# Chatter — 即时通讯 Demo

一个基于 WebSocket 的实时聊天应用 Demo，支持一对一私聊、实时消息推送、在线状态与正在输入提示等功能。

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **React 19** + React Router 7 | UI 框架与路由 |
| **Zustand** | 状态管理（Store 按业务拆分） |
| **Socket.IO Client** | WebSocket 实时通信 |
| **Vite** | 构建工具 |

### 后端

| 技术 | 用途 |
|------|------|
| **Express** | HTTP 服务框架 |
| **Socket.IO** | WebSocket 实时通信 |
| **SQLite** | 嵌入式数据库 |
| **Drizzle ORM** | 数据库 ORM |
| **JWT** | 用户认证 |
| **bcrypt** | 密码加密 |

---

## 功能特性

- **用户注册与登录** — 用户名 + 密码，密码经 bcrypt 加密，JWT 鉴权
- **一对一私聊** — 输入用户 ID 发起会话，自动创建或复用已有会话
- **实时消息** — 基于 Socket.IO 的即时消息推送
- **在线状态** — 用户上线/下线实时通知
- **正在输入提示** — 实时展示对方正在输入的内容
- **未读消息** — 会话列表显示未读数量
- **增量消息拉取** — 支持基于消息 ID 的增量同步
- **用户列表** — 查看所有注册用户及其在线状态

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm

### 1. 安装依赖

```bash
# 安装服务器依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd ../server
npm run dev
```

首次启动会自动创建 SQLite 数据库文件 `data/chatter.db`。

### 3. 启动开发服务器

**终端 1 — 启动后端服务（端口 3000）：**

```bash
cd server
npm run dev
```

**终端 2 — 启动前端开发服务器（端口 5173）：**

```bash
cd client
npm run dev
```

### 4. 打开应用

浏览器访问 `http://localhost:5173`。

---

## 项目结构

```
chatter/
├── client/                  # 前端 React 应用
│   └── src/
│       ├── components/      # UI 组件
│       │   ├── AppLayout.jsx        # 后台布局
│       │   ├── ConversationList.jsx # 会话列表
│       │   ├── MessageInputer.jsx   # 消息输入框
│       │   ├── Messages.jsx         # 消息列表
│       │   ├── UserList.jsx         # 用户列表
│       │   ├── ErrorBoundary.jsx    # 错误边界
│       │   └── ToastProvider.jsx    # Toast 通知
│       ├── contexts/        # React Context
│       ├── hooks/           # 自定义 Hooks
│       ├── pages/           # 页面组件
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Chat.jsx
│       ├── stores/          # Zustand 状态仓库
│       │   ├── chatStore.js
│       │   ├── messageStore.js
│       │   └── unreadStore.js
│       ├── config.js        # API 配置
│       ├── loaders.js       # React Router loaders
│       └── routes.jsx       # 路由配置
│
├── server/                  # 后端 Node.js 应用
│   ├── database/
│   │   ├── schema.js        # 数据库表定义
│   │   ├── drizzle.js       # Drizzle 连接
│   │   └── migrate.js       # 迁移脚本
│   ├── middleware/
│   │   └── auth.js          # JWT 鉴权中间件
│   ├── models/
│   │   └── SocketMapper.js  # Socket↔用户映射
│   ├── repository/          # 数据访问层
│   │   ├── UserRepository.js
│   │   └── ConversationRepository.js
│   ├── routes/              # API 路由
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── conversationRoutes.js
│   │   └── index.js
│   ├── service/             # 业务逻辑层
│   │   ├── UserService.js
│   │   └── ConversationService.js
│   ├── socket/
│   │   └── handlers.js      # WebSocket 事件处理
│   └── index.js             # 服务入口
│
└── README.md
```

---

## 数据库表结构

| 表名 | 说明 |
|------|------|
| `users` | 用户（id, 用户名, 密码哈希, 状态, 最后在线时间） |
| `conversations` | 会话（id, 类型: one-onone/group, 名称） |
| `conversation_participants` | 会话参与者（会话 ID, 用户 ID） |
| `messages` | 消息（id, 会话 ID, 发送者 ID, 内容, 时间戳） |

---

## API 接口

### 公开路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录，返回 JWT |

### 需鉴权路由（Authorization: Bearer \<token\>）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 |
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/conversations` | 获取当前用户的所有会话 |
| POST | `/api/conversations` | 创建群聊会话 |
| GET | `/api/conversations/:id/messages` | 获取会话消息 |
| GET | `/api/conversations/:id/messages/since/:msgId` | 增量拉取消息 |

### Socket.IO 事件

| 事件名 | 方向 | 说明 |
|--------|------|------|
| `send_message` | Client → Server | 发送消息 |
| `chat_message` | Server → Client | 接收消息 |
| `request_conversation` | Client → Server | 请求/创建一对一会话 |
| `conversation_opened` | Server → Client | 会话创建成功 |
| `typing` | Client → Server | 正在输入 |
| `stop_typing` | Client → Server | 停止输入 |
| `user_typing` | Server → Client | 对方正在输入 |
| `user_stop_typing` | Server → Client | 对方停止输入 |
| `user_status_changed` | Server → Client | 用户上下线通知 |

---

## 开发说明

### 分支管理

- `main` — 主分支
- 功能开发在 `feature/*` 分支，完成后合入 `main`

### 代码规范

- 前端使用 ESLint + 项目预设规则
- 后端遵循 CommonJS 模块规范
- Store 按业务功能拆分（chatStore / messageStore / unreadStore）
- 会话 ID 规则：`dm_{小ID}_{大ID}`

---

## 许可证

MIT
