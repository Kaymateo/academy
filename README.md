# 拾光学院 · Apple 风格网课平台

一套完整可部署的网课站点：**网课视频系统 + 兑换码解锁系统**，含前台用户端与管理员后台。
视觉风格对标 Apple 官网：极简高级、大量留白、柔和渐变、精致阴影、丝滑动效、全端响应式。

---

## ✨ 功能总览

### 前台（用户端）
| 页面 | 功能 |
|---|---|
| 首页 | Apple 风落地页，介绍项目，引导至课程列表与兑换入口 |
| 课程列表 `/courses` | 卡片式展示全部网课，分类筛选 + 搜索，淡入动画 + 骨架屏 |
| 视频播放 `/watch/:id` | 极简播放器；未解锁展示锁定遮罩 + **免费试看前 60 秒**（ffmpeg 自动切片） |
| 兑换中心 `/redeem` | 兑换码输入（自动格式化大写），成功弹窗 / 失败友好提示 |

### 后台（管理员）
| 模块 | 功能 |
|---|---|
| 概览 | 数据面板：课程数、兑换码存量、兑换次数、最近动态 |
| 课程管理 | 上传视频（自动生成预览片段 + 时长探测）、封面、分类管理、上架/下架、编辑、删除 |
| 兑换码 | 批量生成（数量 / 对应课程 / 解锁时长 / 批次），一键导出 CSV（Excel 中文兼容），按状态/批次/关键字筛选，停用 / 重新启用 |
| 兑换记录 | 全量记录：兑换码、设备、IP、解锁到期时间 |

### 核心业务规则
- **游客无法观看完整视频**：完整视频仅通过受保护流接口提供，必须携带有效解锁 token
- 兑换码**一次性**：兑换后标记已使用并记录设备/IP；未使用可停用，停用后可重新启用
- 兑换码分**指定课程**与**全站通用**两种；解锁有效期按生成时设定的天数计算
- 解锁状态保存在当前设备（localStorage），有效期内可反复观看，支持拖拽进度（Range 请求）

---

## 🛠 技术栈

- **后端**：Node.js ≥ 18 · Express · better-sqlite3（零配置数据库，无需安装数据库服务）
- **前端**：React 18 · Vite · React Router · 原生 CSS 设计系统（无 UI 框架依赖）
- **媒体处理**：ffmpeg（上传时自动生成 60 秒预览片段 + 探测时长）
- **鉴权**：Node 原生 crypto（scrypt 密码哈希 + HMAC 签名 token，零额外依赖）

---

## 📁 目录结构

```
academy/
├── server/                  # 后端
│   ├── index.js             # 入口：路由挂载、静态服务、启动
│   ├── db.js                # SQLite 初始化与建表
│   ├── auth.js              # 管理员会话 / 解锁 token（HMAC）
│   ├── media.js             # ffmpeg 预览切片、时长探测
│   └── routes/
│       ├── public.js        # 前台 API：课程、兑换、解锁校验
│       └── admin.js         # 后台 API：登录、视频、兑换码、记录、统计
├── client/                  # 前端（React + Vite）
│   ├── src/
│   │   ├── pages/           # Home / Courses / Watch / Redeem / Login / admin/*
│   │   ├── components/      # Nav / Toast / Modal / Reveal / VideoCard / Icons
│   │   ├── lib/             # API 封装 / 解锁 token 管理
│   │   └── styles/          # Apple 设计系统（变量、动效、响应式）
│   └── dist/                # 构建产物（已生成）
├── data/                    # SQLite 数据库（首次启动自动创建）
├── uploads/                 # 视频 / 封面 / 预览片段（自动创建）
└── package.json
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖（根目录 + 前端）
npm install
npm run install:client

# 2. 构建前端
npm run build

# 3. 启动
npm start
# → 前台: http://localhost:3000
# → 后台: http://localhost:3000/login
```

首次启动自动创建数据库与默认管理员：

| 账号 | 密码 |
|---|---|
| `admin` | `admin123456` |

> ⚠️ **部署后请立即修改密码**：设置环境变量 `ACADEMY_ADMIN_PASS` 后重启即可改密；
> 生产环境务必同时设置 `ACADEMY_SECRET`（token 签名密钥）。

### 环境变量（可选）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务端口 |
| `ACADEMY_ADMIN_USER` | `admin` | 初始管理员账号 |
| `ACADEMY_ADMIN_PASS` | `admin123456` | 初始管理员密码 |
| `ACADEMY_SECRET` | 内置开发密钥 | token 签名密钥，**生产必改** |

### 重置数据

删除 `data/` 与 `uploads/` 目录后重启即可完全重置（账号也会重新初始化）。

---

## 🏭 生产部署建议

### 方式一：直接运行（VPS / 云服务器）

```bash
# 使用 pm2 守护进程
npm install -g pm2
ACADEMY_SECRET=$(openssl rand -hex 32) ACADEMY_ADMIN_PASS='你的强密码' pm2 start server/index.js --name academy
pm2 save && pm2 startup
```

### 方式二：Nginx 反向代理（推荐，支持 HTTPS）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # 大视频文件上传
        client_max_body_size 2g;
        proxy_request_buffering off;
    }
}
```

建议配合 `certbot` 一键启用 HTTPS。

### 数据备份

```bash
# 数据库（含全部业务数据）
cp data/academy.db data/academy.db.bak
# 上传文件
tar czf uploads_backup.tar.gz uploads/
```

---

## 🔐 安全说明

- 管理员接口全部要求 `Authorization: Bearer <token>`，token 12 小时过期
- 密码使用 scrypt 加盐哈希存储
- 完整视频不暴露静态路径，未解锁一律 403；预览片段仅前 60 秒
- 上传仅允许视频/图片类型，单文件上限 2GB（可在 `server/routes/admin.js` 调整）

---

## 🎨 设计说明

- **配色**：Apple 标准灰 `#f5f5f7` / 文字 `#1d1d1f` / 蓝 `#0071e3`，hero 柔和多彩渐变
- **字体**：SF Pro / PingFang SC 系统字体栈，多级字号层级
- **动效**：滚动淡入（IntersectionObserver）、卡片悬停上浮、按钮弹性回弹、弹窗缩放弹出、骨架屏 shimmer、导航毛玻璃吸顶
- **响应式**：手机 / 平板 / 电脑三端自适应，移动端抽屉菜单
- **无障碍**：`prefers-reduced-motion` 降级支持

---

## 📡 API 速览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/videos` | 课程列表（支持 `?category=`） | 公开 |
| GET | `/api/videos/:id` | 课程详情 | 公开 |
| GET | `/api/videos/:id/preview` | 试看片段（前 60 秒） | 公开 |
| GET | `/api/videos/:id/stream?token=` | 完整视频流（Range 支持） | 解锁 token |
| POST | `/api/redeem` | 兑换解锁 | 公开 |
| POST | `/api/verify-unlock` | 校验解锁 token | 公开 |
| POST | `/api/admin/login` | 管理员登录 | 公开 |
| GET/POST | `/api/admin/videos` | 课程列表 / 上传 | 管理 |
| PATCH/DELETE | `/api/admin/videos/:id` | 编辑 / 删除 | 管理 |
| POST | `/api/admin/codes/generate` | 批量生成兑换码 | 管理 |
| GET | `/api/admin/codes` | 兑换码列表（筛选/分页） | 管理 |
| GET | `/api/admin/codes/export` | 导出 CSV | 管理 |
| POST | `/api/admin/codes/:id/disable` · `/enable` | 停用 / 启用 | 管理 |
| GET | `/api/admin/redemptions` | 兑换记录 | 管理 |
| GET | `/api/admin/stats` | 数据面板 | 管理 |

---

## ✅ 已通过端到端验证

覆盖：登录鉴权、错误密码、分类 CRUD、视频上传（自动预览切片 + 时长探测）、前台列表/筛选/详情、无 token 与伪造 token 拒绝（403）、兑换成功/重复兑换拒绝/无效码/停用码拒绝、解锁后完整流 + Range 拖动、兑换码状态流转、CSV 中文导出、统计面板、SPA 路由回退。
