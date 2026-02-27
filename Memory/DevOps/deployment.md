# 部署与运维记忆

> 最后更新: 2026-02-27

## 开发环境

### 本地端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8081 | Spring Boot（8080 被 Apache httpd 占用） |
| 前端开发 | 5173 | Vite 开发服务器（可能自动切换到5174） |
| PostgreSQL | 5433 | Docker 容器（映射 5433→5432） |
| Redis | 6380 | Docker 容器（映射 6380→6379） |

### 本地环境版本

| 软件 | 版本 |
|------|------|
| JDK | OpenJDK 17.0.15 (Temurin) |
| Maven | 3.9.12 |
| Node.js | v22.14.0 |
| npm | 10.9.2 |
| Git | 2.49.0 |
| Docker | 29.2.0 |
| Docker Compose | v5.0.2 |

### 开发依赖启动

```bash
# 启动 PostgreSQL + Redis
cd qt-platform
docker compose -f docker-compose.dev.yml up -d

# 验证服务
docker ps  # 确认 qt-dev-postgres 和 qt-dev-redis 运行中
```

## Docker 配置

### 开发环境 (`docker-compose.dev.yml`)

仅启动依赖服务，应用在 IDE 中运行：
- **postgres**: PostgreSQL 15-alpine, 端口 5433（映射 5433→5432）, 数据卷持久化, 自动执行 init.sql
- **redis**: Redis 7-alpine, 端口 6380（映射 6380→6379）, appendonly, maxmemory 128mb

### 生产环境 (`docker-compose.yml`)

全栈部署：
- **postgres**: PostgreSQL 15-alpine
- **redis**: Redis 7-alpine
- **backend**: Spring Boot 多阶段构建 (Dockerfile)
- **frontend**: React 构建 + Nginx (Dockerfile in qt-platform-web)

### Dockerfile

#### 后端 (`qt-platform-app/Dockerfile`)
- 多阶段构建
- Stage 1: Maven 构建
- Stage 2: Eclipse Temurin 17 JRE 运行

#### 前端 (qt-platform-web)
- Stage 1: Node 22 构建 `npm run build`
- Stage 2: Nginx alpine 静态文件服务

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

触发条件:
- Push to `main`, `develop`
- Pull Request to `main`

Pipeline:
1. **后端**: checkout → JDK 17 → Maven build → test → Docker build & push
2. **前端**: checkout → Node 22 → npm install → lint → build → Docker build & push
3. **部署**: SSH 到服务器 → docker compose pull → docker compose up -d

## 环境变量模板

参见 `qt-platform/.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=qt_platform
DB_USER=qt_user
DB_PASSWORD=3143285505

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=3143285505

# JWT
JWT_SECRET=your-64-char-secret-key
JWT_ACCESS_EXPIRATION=7200
JWT_REFRESH_EXPIRATION=604800

# Mail
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USERNAME=
MAIL_PASSWORD=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:5173/oauth/github/callback

# Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=1073741824
```

## Nginx 配置

- 反向代理: `/api` → 后端
- 静态资源: 前端 build 产物
- SSL 终止（生产环境）
- 限流配置

## 目标部署平台

- **阶段一**: 腾讯云 CVM (Docker Compose)
- **阶段二**: 腾讯云 COS (文件存储) + CDN
- **阶段三**: Kubernetes 容器编排
