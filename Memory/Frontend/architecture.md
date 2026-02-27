# 前端架构记忆

> 最后更新: 2026-02-27

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0+ | UI 框架 |
| TypeScript | ~5.6.2 | 类型安全 |
| Vite | 5.x | 构建工具 + HMR |
| Tailwind CSS | 3.x | 实用优先 CSS 框架 |
| Ant Design | 5.x | UI 组件库（Glassmorphism 风格） |
| Redux Toolkit | 2.x | 状态管理 |
| React Router DOM | 6.x | 路由（懒加载） |
| react-i18next | 14.x / i18next 23.x | 国际化（中/英） |
| Axios | 1.x | HTTP 请求 |
| Day.js | 1.x | 日期处理 |
| @ant-design/icons | 5.x | 图标库 |
| react-easy-crop | 1.x | 头像裁剪 |

## 项目路径

`qt-platform/qt-platform-web/`

## 目录结构

```
src/
├── main.tsx              # 入口：Provider + i18n + CSS
├── App.tsx               # 根组件：ConfigProvider + ThemeProvider + DynamicBackground + RouterProvider
├── index.css             # 全局 CSS (Tailwind directives + Glassmorphism 变量)
├── vite-env.d.ts
├── assets/               # 静态资源
├── components/           # 共享组件
│   ├── ui/               # 基础 UI 组件 (GlassCard, GlassButton)
│   ├── layout/           # 布局组件 (Sidebar, Header, Navbar, Footer, AdminHeader)
│   ├── AvatarUpload/     # 头像上传组件（多格式、圆形裁剪）
│   ├── AuthPageToolbar/  # 认证页面工具栏（语言/主题切换）
│   ├── ThemeProvider.tsx # 主题上下文
│   └── DynamicBackground.tsx  # 动态背景 (Video/Image)
├── layouts/              # 页面布局
│   ├── MainLayout.tsx    # 前台布局 (Glass Sidebar + Header)
│   └── AdminLayout.tsx   # 后台布局 (Dark Glass Sidebar)
├── locales/              # 国际化
│   ├── index.ts           # i18n 初始化（localStorage 持久化语言选择）
│   ├── zh-CN.json         # 中文翻译
│   └── en-US.json         # 英文翻译
├── pages/                # 页面组件（见 pages.md）
│   ├── ComingSoon/       # 即将推出页面
│   └── ...
├── router/
│   └── index.tsx          # 路由配置（createBrowserRouter + 懒加载）
├── store/                # Redux 状态管理
│   ├── index.ts           # configureStore (auth + theme)
│   ├── hooks.ts           # useAppDispatch / useAppSelector
│   └── slices/
│       ├── authSlice.ts   # 认证状态
│       └── themeSlice.ts  # 主题状态 (Glassmorphism 配置)
├── theme/
│   └── antdTheme.ts       # Ant Design ConfigProvider (配合 Glassmorphism)
└── utils/
    ├── api.ts             # API 封装（authApi/userApi/productApi/categoryApi/commentApi/notificationApi/fileApi/updateApi/adminApi/systemApi）
    ├── request.ts         # Axios 实例（baseURL=/api/v1，拦截器：token 注入 + 401 刷新 + FormData 处理）
    └── mock.ts            # 前端 Mock 数据拦截器（已废弃）
```

## 路由结构

### 前台路由（MainLayout）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页（英雄区 + 特性卡片 + 精选产品） |
| `/products` | Products | 产品列表（过滤 + 排序 + 产品卡片） |
| `/products/:slug` | ProductDetail | 产品详情（概述/版本/评论 tabs） |
| `/login` | Login | 登录（paper-card + seal stamp） |
| `/register` | Register | 注册 |
| `/forgot-password` | ForgotPassword | 忘记密码 |
| `/profile` | Profile | 个人中心（头像 + tabs） |
| `/oauth/github/callback` | OAuthCallback | GitHub OAuth 回调 |
| `/404` | NotFound | 404 页面 |

### 后台路由（AdminLayout）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/admin` | Dashboard | 仪表盘（统计卡片 + 下载趋势图） |
| `/admin/users` | Users | 用户管理 |
| `/admin/products` | Products | 产品管理 |
| `/admin/comments` | Comments | 评论管理 |
| `/admin/categories` | Categories | 分类管理 |
| `/admin/system` | System | 系统配置 |

## 状态管理

- **authSlice**: `isAuthenticated`, `user`, `accessToken`, `refreshToken`（localStorage 持久化）
- **themeSlice**: `userConfig`, `systemConfig`, `currentTheme`（深度合并，支持用户自定义主题覆盖）

## 开发命令

```bash
cd qt-platform/qt-platform-web
npm install          # 安装依赖
npm run dev          # 启动开发服务器 → http://localhost:5173（可能自动切换到5174）
npm run build        # 构建生产版本（tsc + vite build）
npm run lint         # ESLint 检查
npm run preview      # 预览生产构建
```

## Vite 配置要点

- 路径别名: `@` → `src/`
- 代理: `/api` → `http://localhost:8081`（后端端口 8081，因本机 8080 被 Apache httpd 占用）
- 代理: `/uploads` → `http://localhost:8081`（静态资源访问）

## 已知注意事项

- Ant Design 主包 >500KB（正常，build 警告可忽略）
- Glassmorphism 的 backdrop-blur 性能在低端设备上可能受影响
