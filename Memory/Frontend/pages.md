# 前端页面清单

> 最后更新: 2026-02-27

## 前台页面（9 个）

### Home (`pages/Home/index.tsx`)
- Hero Section: 玻璃拟态大卡片 + 动态背景
- 特性卡片：GlassCard 展示平台亮点
- 精选产品：Grid 布局展示

### Products (`pages/Products/index.tsx`)
- 分类过滤侧栏
- 排序选项（最新/下载量/评分/名称）
- 关键词搜索
- 产品卡片网格

### ProductDetail (`pages/ProductDetail/index.tsx`)
- Tab 页：概述 / 版本列表 / 评论
- 下载侧栏（平台选择 + 版本信息 + 下载按钮）
- 评分统计

### Login (`pages/Login/index.tsx`)
- 邮箱 + 密码登录
- GitHub OAuth 登录按钮
- 玻璃拟态卡片 (GlassCard) + 动态背景
- 极简风格表单
- **AuthPageToolbar**: 语言切换 + 主题切换（亮/暗/系统）

### Register (`pages/Register/index.tsx`)
- 邮箱验证码注册流程
- 用户名 + 邮箱 + 密码 + 验证码
- **AuthPageToolbar**: 语言切换 + 主题切换

### ForgotPassword (`pages/ForgotPassword/index.tsx`)
- 邮箱验证 + 重置密码
- **AuthPageToolbar**: 语言切换 + 主题切换

### Profile (`pages/Profile/index.tsx`)
- 头像上传（AvatarUpload组件：多格式支持、圆形裁剪、5MB限制）
- 个人信息编辑（昵称、简介）
- Tab 页：
  - **个人资料** - 昵称、简介编辑
  - **账号信息** - 用户名、邮箱、角色查看
  - **安全设置** - 修改密码 + 修改邮箱（验证码发送到新邮箱）
  - **外观设置** - 个性化 Glassmorphism 配置
    - 背景类型选择（图片/视频）
    - 背景文件上传
    - 背景模糊度调节 (Blur)
    - 背景透明度调节 (Opacity)
    - 主色调选择
    - 字体切换

### OAuthCallback (`pages/OAuthCallback/index.tsx`)
- GitHub OAuth 回调处理
- 自动跳转

### NotFound (`pages/NotFound/index.tsx`)
- 404 玻璃拟态页面

## 后台页面（6 个）

### Dashboard (`pages/Admin/Dashboard/index.tsx`)
- 统计卡片（用户数/产品数/下载量/评论数）
- 下载趋势折线图

### Users (`pages/Admin/Users/index.tsx`)
- 用户列表（分页 + 搜索 + 状态过滤）
- 用户状态管理（封禁/激活）

### Products (`pages/Admin/Products/index.tsx`)
- 产品列表（分页 + 搜索 + 分类过滤 + 状态过滤）
- 产品审核（发布/下架）
- 产品 CRUD
- 版本发布

### Comments (`pages/Admin/Comments/index.tsx`)
- 评论列表（分页 + 状态过滤）
- 评论审核（通过/拒绝/隐藏）
- 评论删除

### Categories (`pages/Admin/Categories/index.tsx`)
- 分类树形列表
- 分类 CRUD

### Theme (`pages/Admin/Theme/index.tsx`) ✨新增
- 全局主题管理
- 背景设置区域：
  - 背景类型（图片/视频）
  - 背景文件上传
  - 背景透明度调节
- 风格设置区域：
  - 主色调配置
  - 笔画宽度设置
  - 字体配置
- 保存/重置功能
- 配置说明文档

### System (`pages/Admin/System/index.tsx`)
- 系统配置 key-value 编辑
- 审计日志查看
