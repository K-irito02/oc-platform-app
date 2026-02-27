# 安全体系记忆

> 最后更新: 2026-02-27

## 认证方案

### JWT (JSON Web Token)
- **实现**: `com.qtplatform.common.util.JwtUtil`
- **Access Token**: 有效期 2 小时
- **Refresh Token**: 有效期 7 天
- **Claims**: userId, username, roles
- **存储**: 前端 localStorage (access_token / refresh_token)

### 密码加密
- **算法**: BCrypt (strength=12)
- **实现**: `SecurityConfig.passwordEncoder()`

### OAuth 2.0
- **阶段一**: 仅 GitHub OAuth
- **实现**: `OAuthController` + `OAuthService`
- **回调 URL**: `http://localhost:5173/oauth/github/callback`

## 授权方案

### RBAC (基于角色的访问控制)

| 角色 | 代码 | 权限 |
|------|------|------|
| 匿名用户 | ANONYMOUS | 浏览、下载 |
| 普通用户 | USER | 评论、评分、个人信息管理 |
| VIP 用户 | VIP | 优先下载、专属内容（阶段二） |
| 管理员 | ADMIN | 内容审核、用户管理 |
| 超级管理员 | SUPER_ADMIN | 系统配置、权限管理 |

### Spring Security 配置 (`SecurityConfig.java`)

公开接口:
- `/api/v1/auth/**` — 认证相关
- `GET /api/v1/products/**` — 产品浏览
- `GET /api/v1/categories/**` — 分类浏览
- `GET /api/v1/comments/**` — 评论浏览
- `/api/v1/updates/check` — 更新检查
- `/api/v1/downloads/**` — 文件下载
- `GET /api/v1/system/theme` — 全局主题配置
- `/uploads/**` — 静态资源（头像等）
- Swagger UI + Actuator health/info

管理员接口:
- `/api/v1/admin/**` — 需要 ADMIN 角色

其他接口:
- 需要认证 (JWT Bearer Token)

### JWT 认证过滤器 (`JwtAuthenticationFilter.java`)
- 从 `Authorization: Bearer {token}` 提取 token
- 解析 userId, username, roles
- 设置 `SecurityContextHolder` 上下文
- 认证失败不阻断请求（允许匿名访问公开接口）

## 限流策略

| 场景 | 限制 | 实现 |
|------|------|------|
| 登录 | 5次/分钟/IP | Redis incr + expire |
| 注册 | 10次/小时/IP | Redis |
| 验证码 | 1次/分钟/邮箱, 10次/小时/邮箱 | Redis |
| 文件上传 | 50次/小时 | Redis |

## CORS 配置

- 允许来源: `http://localhost:5173`, `http://localhost:3000`
- 允许方法: GET, POST, PUT, DELETE, PATCH, OPTIONS
- 允许凭证: true
- 预检缓存: 3600s

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin@qtplatform.com | Admin@123456 |
| 普通用户 | zhangsan@example.com | Test@123456 |
