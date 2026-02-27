# 后端 API 接口清单

> 最后更新: 2026-02-27

## 基础路径

- 开发环境: `http://localhost:8081/api/v1`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

## API 封装（前端 `utils/api.ts` 对应）

### 认证 API (`/api/v1/auth`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 邮箱密码登录 | 否 |
| POST | `/auth/register` | 邮箱注册 | 否 |
| POST | `/auth/logout` | 登出 | 是 |
| POST | `/auth/refresh` | 刷新 Token | 否 |
| POST | `/auth/send-code` | 发送邮箱验证码 | 否 |
| POST | `/auth/reset-password` | 重置密码 | 否 |
| PUT | `/auth/change-password` | 修改密码 | 是 |
| POST | `/auth/send-change-email-code` | 发送修改邮箱验证码 | 是 |
| PUT | `/auth/change-email` | 修改邮箱 | 是 |
| GET | `/auth/oauth/github` | 获取 GitHub 授权 URL | 否 |
| GET | `/auth/oauth/github/callback` | GitHub OAuth 回调 | 否 |

### 用户 API (`/api/v1/users`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/users/profile` | 获取当前用户信息 | 是 |
| PUT | `/users/profile` | 更新用户信息 | 是 |
| PUT | `/users/language` | 切换语言偏好 | 是 |
| GET | `/users/{id}/public` | 获取公开用户信息 | 否 |
| GET | `/users/me/theme` | 获取用户主题配置 | 是 |
| PUT | `/users/me/theme` | 更新用户主题配置 | 是 |
| POST | `/users/me/avatar` | 上传用户头像 | 是 |

### 产品 API (`/api/v1/products`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/products` | 产品列表（分页/筛选/排序） | 否 |
| GET | `/products/featured` | 推荐产品 | 否 |
| GET | `/products/search` | 搜索产品 | 否 |
| GET | `/products/{slug}` | 产品详情 | 否 |
| GET | `/products/{id}/versions` | 版本列表 | 否 |
| GET | `/products/{id}/versions/latest` | 最新版本 | 否 |

### 分类 API (`/api/v1/categories`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/categories` | 分类列表 | 否 |
| GET | `/categories/{id}` | 分类详情 | 否 |

### 评论 API (`/api/v1/comments`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/comments/product/{productId}` | 产品评论列表 | 否 |
| POST | `/comments/product/{productId}` | 创建评论 | 是 |
| PUT | `/comments/{id}` | 更新评论 | 是 |
| DELETE | `/comments/{id}` | 删除评论 | 是 |
| POST | `/comments/{id}/like` | 点赞 | 是 |
| DELETE | `/comments/{id}/like` | 取消点赞 | 是 |

### 通知 API (`/api/v1/notifications`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/notifications` | 通知列表 | 是 |
| GET | `/notifications/unread-count` | 未读计数 | 是 |
| PUT | `/notifications/{id}/read` | 标记已读 | 是 |
| PUT | `/notifications/read-all` | 全部已读 | 是 |

### 文件 API (`/api/v1/files`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/files/upload` | 通用文件上传 | 是 |
| POST | `/files/upload/image` | 图片上传 | 是 |

### 系统 API (`/api/v1/system`) - 公开

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/system/theme` | 获取全局主题配置 | 否 |
| GET | `/system/info` | 获取系统信息 | 否 |

### 更新检查 API (`/api/v1/updates`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/updates/check` | Qt 客户端检查更新 | 否 |

### 下载 API (`/api/v1/downloads`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/downloads/{versionId}` | 下载文件（支持断点续传） | 否 |

### 管理后台 API (`/api/v1/admin`)（需 ADMIN 角色）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/dashboard/stats` | 仪表盘统计 |
| GET | `/admin/users` | 用户列表 |
| GET | `/admin/users/{id}` | 用户详情 |
| PUT | `/admin/users/{id}/status` | 更新用户状态 |
| GET | `/admin/products` | 产品列表 |
| GET | `/admin/products/{id}` | 产品详情 |
| POST | `/admin/products` | 创建产品 |
| PUT | `/admin/products/{id}` | 更新产品 |
| DELETE | `/admin/products/{id}` | 删除产品 |
| PUT | `/admin/products/{id}/audit` | 产品审核 |
| POST | `/admin/products/{productId}/versions` | 创建版本 |
| PUT | `/admin/products/versions/{versionId}/publish` | 发布版本 |
| GET | `/admin/comments` | 评论列表 |
| PUT | `/admin/comments/{id}/audit` | 评论审核 |
| DELETE | `/admin/comments/{id}` | 删除评论 |
| POST | `/admin/products/categories` | 创建分类 |
| PUT | `/admin/products/categories/{id}` | 更新分类 |
| DELETE | `/admin/products/categories/{id}` | 删除分类 |
| GET | `/admin/system/configs` | 系统配置列表 |
| PUT | `/admin/system/configs/{key}` | 更新系统配置 |
| GET | `/admin/audit-logs` | 审计日志 |

## 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

分页响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [...],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
```
