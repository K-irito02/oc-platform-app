# Qt 产品发布平台 — 阶段一：MVP 单体应用 详细设计文档

> 本文档从总体架构文档中提取并细化阶段一（MVP）的全部技术方案，作为 12 周开发周期的唯一执行参考。
> 阶段二/三的内容（微服务拆分、K8s、Elasticsearch、支付系统等）不在本文档范围内。

---

## 一、阶段一目标与范围

### 1.1 核心目标

在 **12 周**内交付一个可上线运行的 MVP 版本，具备以下能力：

1. 用户可以浏览、搜索、下载 Qt 软件产品
2. 用户可以注册、登录（邮箱 + GitHub OAuth）、管理个人信息
3. 用户可以对产品进行评论和评分
4. 管理员可以管理产品、版本、评论和用户
5. Qt 客户端可以通过 API 检查更新并下载新版本（支持断点续传）
6. 平台具备现代化 UI 设计和中英文双语支持
7. 系统通过 Docker 容器化部署到腾讯云 CVM

### 1.2 MVP 功能范围（In Scope）

| 模块 | 功能点 | 优先级 |
|------|--------|--------|
| **用户** | 邮箱注册/登录、GitHub OAuth、邮箱验证、密码找回/重置、个人信息管理、头像上传、语言偏好 | P0 |
| **产品** | 产品 CRUD、分类管理、产品列表（分页/筛选/排序）、产品详情、产品搜索（PostgreSQL 模糊搜索） | P0 |
| **版本** | 版本发布、版本列表、语义化版本管理、多平台支持（Windows/Linux/macOS）、灰度发布比例 | P0 |
| **下载** | 文件下载（本地存储）、断点续传、下载计数、SHA256 校验 | P0 |
| **更新** | Qt 客户端更新检查 API、全量更新、增量更新（差量包）、版本回滚 | P0 |
| **评论** | 发表评论/回复、评分（1-5 星）、评论点赞、评论审核 | P1 |
| **通知** | 站内通知（评论回复、系统公告）、通知已读标记 | P1 |
| **后台** | 仪表盘概览、用户管理（封禁/角色）、产品审核、评论管理、分类管理、文件管理、系统配置、审计日志 | P0 |
| **前端** | 现代化 UI 设计、响应式设计（桌面/平板/移动）、中英文切换、SEO 优化 | P0 |
| **部署** | Docker + Docker Compose、Nginx 反向代理、GitHub Actions CI/CD、腾讯云 CVM | P0 |

### 1.3 阶段一不包含（Out of Scope）

- ❌ 微信/QQ OAuth 登录（阶段二）
- ❌ 微信/支付宝支付（阶段二）
- ❌ 订单系统和财务对账（阶段二）
- ❌ VIP 会员订阅（阶段二）
- ❌ Spring Cloud 微服务拆分（阶段二）
- ❌ Elasticsearch 全文搜索（阶段二，MVP 用 PostgreSQL LIKE/ILIKE）
- ❌ 腾讯云 COS 文件存储（阶段二，MVP 用本地存储）
- ❌ CDN 加速（阶段二）
- ❌ Kubernetes 容器编排（阶段三）
- ❌ SkyWalking 链路追踪（阶段二）
- ❌ 多地域部署（阶段三）

---

## 二、阶段一技术栈

### 2.1 技术选型（仅阶段一使用部分）

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | React + TypeScript | 18.2.0+ | SPA 单页应用 |
| **状态管理** | Redux Toolkit + RTK Query | 2.x | 含异步请求管理与自动缓存 |
| **UI 组件库** | Ant Design | 5.x | 现代化主题定制 |
| **构建工具** | Vite | 5.x | 快速 HMR，开发体验好 |
| **样式方案** | CSS Modules + Ant Design Token | — | 主题变量统一管理 |
| **国际化** | react-i18next | 14.x | 中 / 英双语 |
| **前端路由** | React Router | 6.x | 嵌套路由 + 懒加载 |
| **SEO** | react-helmet-async | 2.x | Meta 标签 + 结构化数据 |
| **后端框架** | Spring Boot | 3.2.x | Java 17 LTS |
| **ORM** | MyBatis-Plus + Spring Data JPA | 混合 | 复杂 SQL 用 MyBatis，简单 CRUD 用 JPA |
| **安全** | Spring Security | 6.2.x | JWT + RBAC |
| **API 文档** | SpringDoc OpenAPI | 2.x | Swagger UI 自动生成 |
| **校验** | Bean Validation (Hibernate Validator) | 3.x | 参数校验 |
| **邮件** | Spring Boot Mail | — | 验证码/通知邮件 |
| **主数据库** | PostgreSQL | 15.x | JSONB + 全文检索 + 表分区 |
| **缓存** | Redis | 7.x | 单机模式（MVP 阶段） |
| **容器化** | Docker + Docker Compose | — | 本地开发 + 生产部署 |
| **反向代理** | Nginx | alpine | SSL 终止 + 静态资源 + 限流 |
| **CI/CD** | GitHub Actions | — | 自动构建/测试/部署 |
| **监控** | Spring Boot Actuator + Prometheus + Grafana | — | 基础指标采集 |
| **日志** | Logback + JSON 格式 | — | 阶段一用文件日志，阶段二接入 ELK |

> **说明**：阶段一的 Redis 使用单机模式而非哨兵，降低运维复杂度。消息队列（RabbitMQ）在阶段一使用 Spring `@Async` 替代，避免引入过多中间件。

### 2.2 开发环境搭建

#### 2.2.1 必需软件安装清单

| 软件 | 版本 | 安装方式 | 用途 |
|------|------|---------|------|
| **JDK** | OpenJDK 17 (Temurin) | [adoptium.net](https://adoptium.net) | 后端运行环境 |
| **Node.js** | 22.x LTS | nvm-windows 管理 | 前端运行环境 |
| **Docker Desktop** | Latest | 官网安装，启用 WSL2 | 容器化开发 |
| **Git** | Latest | 官网安装 | 版本控制 |
| **IntelliJ IDEA** | Ultimate (推荐) | JetBrains | 后端 IDE |
| **Postman** | Latest | 官网安装 | API 调试 |

#### 2.2.2 本地开发环境 Docker Compose

```yaml
# docker-compose.dev.yml — 仅启动依赖服务，应用在 IDE 中运行
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: qt-dev-postgres
    environment:
      POSTGRES_DB: qt_platform
      POSTGRES_USER: qt_user
      POSTGRES_PASSWORD: qt_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qt_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: qt-dev-redis
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_dev_data:
  redis_dev_data:
```

---

## 三、系统架构

### 3.1 阶段一架构图

```
                         ┌──────────────────┐
                         │  Nginx 反向代理   │
                         │  (SSL 终止/静态)  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌─────────────────┐        ┌─────────────────┐
          │   React SPA     │        │  Spring Boot    │
          │   前端静态资源   │        │   单体应用      │
          │                 │        │                 │
          │ - 用户界面      │        │ - 用户模块      │
          │ - 产品展示      │        │ - 产品模块      │
          │ - 管理后台      │        │ - 评论模块      │
          │ - 现代化 UI 设计   │        │ - 下载模块      │
          │ - 中英文切换    │        │ - 文件模块      │
          └─────────────────┘        │ - 后台管理模块  │
                                     └────────┬────────┘
                                              │
                                ┌─────────────┼─────────────┐
                                ▼             ▼             ▼
                      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                      │ PostgreSQL   │ │    Redis     │ │  本地文件系统 │
                      │   15.x      │ │   7.x 单机  │ │  (软件包)    │
                      └──────────────┘ └──────────────┘ └──────────────┘
```

### 3.2 后端模块化代码结构

为未来微服务拆分做准备，阶段一采用模块化单体架构：

```
qt-platform/
├── qt-platform-common/          # 公共模块
│   ├── src/main/java/.../common/
│   │   ├── exception/           # 全局异常定义与处理
│   │   │   ├── BusinessException.java
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── ErrorCode.java
│   │   ├── response/            # 统一响应格式
│   │   │   ├── ApiResponse.java
│   │   │   └── PageResponse.java
│   │   ├── util/                # 工具类
│   │   │   ├── JwtUtil.java
│   │   │   ├── FileUtil.java
│   │   │   ├── SemanticVersion.java
│   │   │   └── IpUtil.java
│   │   ├── config/              # 通用配置
│   │   │   ├── RedisConfig.java
│   │   │   ├── JacksonConfig.java
│   │   │   └── AsyncConfig.java
│   │   ├── constant/            # 常量定义
│   │   └── validation/          # 自定义校验注解
│   └── pom.xml
│
├── qt-platform-user/            # 用户模块
│   ├── src/main/java/.../user/
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── OAuthController.java
│   │   │   └── UserController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── OAuthService.java
│   │   │   ├── UserService.java
│   │   │   └── EmailService.java
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/                 # 请求/响应 DTO
│   │   ├── vo/                  # 视图对象
│   │   └── security/            # Spring Security 相关
│   │       ├── SecurityConfig.java
│   │       ├── JwtAuthenticationFilter.java
│   │       ├── JwtAuthenticationEntryPoint.java
│   │       ├── JwtAccessDeniedHandler.java
│   │       └── SecurityService.java
│   └── pom.xml
│
├── qt-platform-product/         # 产品模块
│   ├── src/main/java/.../product/
│   │   ├── controller/
│   │   │   ├── ProductController.java
│   │   │   ├── VersionController.java
│   │   │   ├── CategoryController.java
│   │   │   ├── DownloadController.java
│   │   │   └── UpdateController.java
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   └── vo/
│   └── pom.xml
│
├── qt-platform-comment/         # 评论模块
│   ├── src/main/java/.../comment/
│   │   ├── controller/
│   │   │   └── CommentController.java
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   └── pom.xml
│
├── qt-platform-file/            # 文件模块
│   ├── src/main/java/.../file/
│   │   ├── controller/
│   │   │   └── FileController.java
│   │   ├── service/
│   │   │   ├── FileStorageService.java     # 本地存储（阶段二扩展为 COS）
│   │   │   └── ChecksumService.java
│   │   ├── entity/
│   │   └── config/
│   │       └── StorageConfig.java
│   └── pom.xml
│
├── qt-platform-admin/           # 后台管理模块
│   ├── src/main/java/.../admin/
│   │   ├── controller/
│   │   │   ├── AdminDashboardController.java
│   │   │   ├── AdminUserController.java
│   │   │   ├── AdminProductController.java
│   │   │   ├── AdminCommentController.java
│   │   │   ├── AdminCategoryController.java
│   │   │   ├── AdminFileController.java
│   │   │   ├── AdminStatsController.java
│   │   │   └── AdminSystemController.java
│   │   ├── service/
│   │   └── vo/
│   └── pom.xml
│
├── qt-platform-app/             # 主应用启动模块（聚合所有模块）
│   ├── src/main/java/.../
│   │   └── QtPlatformApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml           # 主配置
│   │   ├── application-dev.yml       # 开发环境
│   │   ├── application-prod.yml      # 生产环境
│   │   └── logback-spring.xml        # 日志配置
│   └── pom.xml
│
├── qt-platform-web/             # 前端项目（独立目录）
│   └── ...
│
├── sql/                         # 数据库脚本
│   ├── init.sql                 # 建表 + 初始化数据
│   └── migration/               # 增量迁移脚本（Flyway）
│
├── docker/                      # Docker 相关文件
│   ├── Dockerfile               # 后端 Dockerfile
│   ├── Dockerfile.web           # 前端 Dockerfile
│   └── docker-compose.yml       # 生产部署
│
├── nginx/                       # Nginx 配置
│   └── nginx.conf
│
├── .github/workflows/           # CI/CD
│   └── deploy.yml
│
├── docker-compose.dev.yml       # 本地开发
├── .env.example                 # 环境变量模板
├── .gitignore
├── README.md
└── pom.xml                      # 父 POM
```

### 3.3 Spring Boot 主配置文件

```yaml
# qt-platform-app/src/main/resources/application.yml
server:
  port: 8080
  servlet:
    context-path: /
  compression:
    enabled: true
    mime-types: application/json,text/html,text/css,application/javascript

spring:
  application:
    name: qt-platform
  profiles:
    active: dev

  # Jackson
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false

  # 文件上传
  servlet:
    multipart:
      max-file-size: 1024MB
      max-request-size: 1100MB

  # 数据库
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:qt_platform}
    username: ${DB_USER:qt_user}
    password: ${DB_PASSWORD:qt_dev_password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 600000
      connection-timeout: 30000

  # JPA
  jpa:
    hibernate:
      ddl-auto: validate           # 不自动建表，用 SQL 脚本管理
    show-sql: false
    open-in-view: false            # 关闭 OSIV，避免懒加载问题
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  # Redis
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 4

  # 邮件
  mail:
    host: ${MAIL_HOST:smtp.example.com}
    port: ${MAIL_PORT:465}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          ssl:
            enable: true
          starttls:
            enable: false

# MyBatis-Plus
mybatis-plus:
  mapper-locations: classpath*:mapper/**/*.xml
  type-aliases-package: com.qtplatform.*.entity
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: false
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: true
      logic-not-delete-value: false

# JWT 配置
jwt:
  secret: ${JWT_SECRET:dev-only-secret-key-must-be-changed-in-production-64chars}
  access-expiration: ${JWT_ACCESS_EXPIRATION:7200}      # 2小时
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800}   # 7天

# 文件存储
storage:
  upload-path: ${UPLOAD_PATH:./uploads}
  max-file-size: ${MAX_FILE_SIZE:1073741824}            # 1GB
  allowed-extensions:
    - exe
    - zip
    - 7z
    - tar.gz
    - dmg
    - AppImage
    - msi
    - deb
    - rpm

# OAuth
oauth:
  github:
    client-id: ${GITHUB_CLIENT_ID:}
    client-secret: ${GITHUB_CLIENT_SECRET:}
    redirect-uri: ${GITHUB_REDIRECT_URI:http://localhost:5173/oauth/github/callback}

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true

# SpringDoc
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true
    path: /swagger-ui.html

# 限流配置
rate-limit:
  login:
    attempts-per-minute: 5
    lockout-duration-minutes: 15
  register:
    attempts-per-hour-per-ip: 10
  verification-code:
    attempts-per-minute-per-email: 1
    attempts-per-hour-per-email: 10
  upload:
    requests-per-hour: 50

# 日志级别
logging:
  level:
    root: INFO
    com.qtplatform: DEBUG
    org.springframework.security: WARN
```

```yaml
# qt-platform-app/src/main/resources/application-dev.yml
spring:
  jpa:
    show-sql: true
  devtools:
    restart:
      enabled: true

springdoc:
  swagger-ui:
    enabled: true

logging:
  level:
    com.qtplatform: DEBUG
    org.hibernate.SQL: DEBUG
```

```yaml
# qt-platform-app/src/main/resources/application-prod.yml
spring:
  jpa:
    show-sql: false

springdoc:
  swagger-ui:
    enabled: false                 # 生产环境关闭 Swagger
  api-docs:
    enabled: false

logging:
  level:
    root: WARN
    com.qtplatform: INFO
```

---

## 四、数据库设计

> 阶段一使用 PostgreSQL 15.x，通过 SQL 脚本管理表结构（`sql/init.sql`），不依赖 JPA 自动建表。
> 订单表（`orders`）和订阅表（`subscriptions`）在阶段一仅建表占位，不开发相关业务逻辑。

### 4.1 用户相关表

```sql
-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),                -- 第三方登录用户可为空
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             VARCHAR(500),                -- 个人简介
    status          VARCHAR(20) DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    language        VARCHAR(10) DEFAULT 'zh-CN',
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- 角色表（RBAC 多角色设计）
-- ============================================================
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,    -- ANONYMOUS, USER, VIP, ADMIN, SUPER_ADMIN
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 用户-角色关联表
-- ============================================================
CREATE TABLE user_roles (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================================
-- 权限表
-- ============================================================
CREATE TABLE permissions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(100) UNIQUE NOT NULL,   -- e.g. PRODUCT:CREATE, COMMENT:DELETE
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

-- ============================================================
-- 角色-权限关联表
-- ============================================================
CREATE TABLE role_permissions (
    id            BIGSERIAL PRIMARY KEY,
    role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- ============================================================
-- 第三方登录绑定表
-- ============================================================
CREATE TABLE user_oauth_bindings (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    oauth_provider VARCHAR(50) NOT NULL,        -- GITHUB（阶段一仅 GitHub）
    oauth_id       VARCHAR(200) NOT NULL,
    oauth_username VARCHAR(200),
    oauth_avatar   VARCHAR(500),
    access_token   TEXT,                         -- 加密存储
    refresh_token  TEXT,                         -- 加密存储
    expires_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(oauth_provider, oauth_id)
);

CREATE INDEX idx_oauth_user_id ON user_oauth_bindings(user_id);

-- ============================================================
-- 邮箱验证码表
-- ============================================================
CREATE TABLE email_verifications (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(100) NOT NULL,
    code       VARCHAR(10) NOT NULL,
    type       VARCHAR(30) NOT NULL,             -- REGISTER, RESET_PASSWORD, CHANGE_EMAIL
    is_used    BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verify ON email_verifications(email, type);
```

### 4.2 产品相关表

```sql
-- ============================================================
-- 产品分类表
-- ============================================================
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),                    -- 英文名称
    slug        VARCHAR(100) UNIQUE NOT NULL,     -- URL 友好的标识
    parent_id   BIGINT REFERENCES categories(id),
    sort_order  INTEGER DEFAULT 0,
    icon        VARCHAR(200),
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 产品表
-- ============================================================
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200),                -- 英文名称
    slug            VARCHAR(200) UNIQUE NOT NULL, -- URL 友好的标识
    description     TEXT,
    description_en  TEXT,                         -- 英文描述
    category_id     BIGINT REFERENCES categories(id),
    developer_id    BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED')),
    icon_url        VARCHAR(500),
    banner_url      VARCHAR(500),                -- 横幅图
    screenshots     JSONB DEFAULT '[]',          -- [{url, caption, sort_order}]
    demo_video_url  VARCHAR(500),                -- 演示视频 URL
    homepage_url    VARCHAR(500),                -- 项目主页
    source_url      VARCHAR(500),                -- 源码地址
    license         VARCHAR(100),                -- 开源协议
    download_count  BIGINT DEFAULT 0,
    rating_average  DECIMAL(2,1) DEFAULT 0.0,    -- 1.0 ~ 5.0 范围
    rating_count    INTEGER DEFAULT 0,
    view_count      BIGINT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,       -- 是否推荐
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_developer ON products(developer_id);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_download ON products(download_count DESC);
CREATE INDEX idx_products_rating ON products(rating_average DESC);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================================
-- 产品版本表
-- ============================================================
CREATE TABLE product_versions (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_number  VARCHAR(50) NOT NULL,        -- 语义化版本号 e.g. 1.2.3
    version_code    INTEGER,                     -- 递增的数字版本号，用于版本比较
    version_type    VARCHAR(20) DEFAULT 'RELEASE'
                    CHECK (version_type IN ('ALPHA', 'BETA', 'RC', 'RELEASE')),
    platform        VARCHAR(50) NOT NULL
                    CHECK (platform IN ('WINDOWS', 'LINUX', 'MACOS')),
    architecture    VARCHAR(20) DEFAULT 'x64'
                    CHECK (architecture IN ('x86', 'x64', 'arm64')),
    min_os_version  VARCHAR(50),                 -- 最低操作系统版本
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    file_path       VARCHAR(500) NOT NULL,       -- 本地存储路径
    file_url        VARCHAR(500),                -- CDN/COS 下载 URL（阶段二启用）
    checksum_md5    VARCHAR(32),
    checksum_sha256 VARCHAR(64) NOT NULL,
    signature       TEXT,                        -- 数字签名
    download_count  BIGINT DEFAULT 0,
    is_mandatory    BOOLEAN DEFAULT FALSE,       -- 是否强制更新
    is_latest       BOOLEAN DEFAULT FALSE,       -- 当前最新版本标记
    release_notes   TEXT,
    release_notes_en TEXT,
    status          VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'REVOKED')),
    -- 灰度发布
    rollout_percentage INTEGER DEFAULT 100       -- 灰度比例 0-100
                    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMPTZ,
    UNIQUE(product_id, version_number, platform, architecture)
);

CREATE INDEX idx_versions_product ON product_versions(product_id, status);
CREATE INDEX idx_versions_latest ON product_versions(product_id, platform, is_latest)
    WHERE is_latest = TRUE;

-- ============================================================
-- 增量更新包表
-- ============================================================
CREATE TABLE delta_updates (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    from_version_id BIGINT NOT NULL REFERENCES product_versions(id),
    to_version_id   BIGINT NOT NULL REFERENCES product_versions(id),
    platform        VARCHAR(50) NOT NULL,
    architecture    VARCHAR(20) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_version_id, to_version_id, platform, architecture)
);
```

### 4.3 评论相关表

```sql
-- ============================================================
-- 评论表
-- ============================================================
CREATE TABLE product_comments (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    parent_id   BIGINT REFERENCES product_comments(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    rating      INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 仅顶级评论可评分
    status      VARCHAR(20) DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN')),
    like_count  INTEGER DEFAULT 0,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_product ON product_comments(product_id, status);
CREATE INDEX idx_comments_user ON product_comments(user_id);
CREATE INDEX idx_comments_parent ON product_comments(parent_id);

-- ============================================================
-- 评论点赞表（防重复点赞）
-- ============================================================
CREATE TABLE comment_likes (
    id         BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);
```

### 4.4 通知与消息

```sql
-- ============================================================
-- 系统通知表
-- ============================================================
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,            -- SYSTEM, COMMENT_REPLY, DOWNLOAD, UPDATE
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    link        VARCHAR(500),                    -- 点击跳转链接
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### 4.5 下载统计与日志

```sql
-- ============================================================
-- 下载记录表（PostgreSQL 原生表分区，按月分区）
-- ============================================================
CREATE TABLE download_records (
    id           BIGSERIAL,
    product_id   BIGINT NOT NULL,
    version_id   BIGINT,
    user_id      BIGINT,                         -- 匿名下载时为 NULL
    ip_address   INET,
    user_agent   TEXT,
    country      VARCHAR(10),
    region       VARCHAR(100),
    download_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    file_size    BIGINT,
    PRIMARY KEY (id, download_at)
) PARTITION BY RANGE (download_at);

-- 创建初始月度分区（后续通过定时任务或 pg_partman 自动创建）
CREATE TABLE download_records_2026_01 PARTITION OF download_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE download_records_2026_02 PARTITION OF download_records
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE download_records_2026_03 PARTITION OF download_records
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE INDEX idx_downloads_product ON download_records(product_id, download_at DESC);
CREATE INDEX idx_downloads_user ON download_records(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 用户访问日志表（PostgreSQL 原生表分区，按月分区）
-- ============================================================
CREATE TABLE user_access_logs (
    id              BIGSERIAL,
    user_id         BIGINT,
    ip_address      INET,
    user_agent      TEXT,
    request_method  VARCHAR(10),
    request_path    VARCHAR(500),
    query_string    TEXT,
    response_status INTEGER,
    response_time   INTEGER,                     -- 毫秒
    country         VARCHAR(10),
    referer         VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
```

### 4.6 系统配置与文件管理

```sql
-- ============================================================
-- 系统配置表
-- ============================================================
CREATE TABLE system_configs (
    id           BIGSERIAL PRIMARY KEY,
    config_key   VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description  VARCHAR(500),
    updated_by   BIGINT REFERENCES users(id),
    updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 文件管理表
-- ============================================================
CREATE TABLE file_records (
    id              BIGSERIAL PRIMARY KEY,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       VARCHAR(100),
    checksum_sha256 VARCHAR(64),
    storage_type    VARCHAR(20) DEFAULT 'LOCAL'
                    CHECK (storage_type IN ('LOCAL', 'COS')),
    uploaded_by     BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_path ON file_records(file_path);

-- ============================================================
-- 操作审计日志表
-- ============================================================
CREATE TABLE audit_logs (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT REFERENCES users(id),
    action       VARCHAR(100) NOT NULL,          -- USER_LOGIN, PRODUCT_PUBLISH, VERSION_ROLLBACK...
    target_type  VARCHAR(50),                    -- USER, PRODUCT, VERSION...
    target_id    BIGINT,
    detail       JSONB,                          -- 操作详情
    ip_address   INET,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- ============================================================
-- 多语言内容表
-- ============================================================
CREATE TABLE i18n_messages (
    id            BIGSERIAL PRIMARY KEY,
    language_code VARCHAR(10) NOT NULL,
    message_key   VARCHAR(200) NOT NULL,
    message_value TEXT NOT NULL,
    module        VARCHAR(50),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(language_code, message_key)
);

CREATE INDEX idx_i18n_lang ON i18n_messages(language_code);
```

### 4.7 阶段二预留表（阶段一仅建表，不实现业务）

```sql
-- ============================================================
-- 订单表（阶段二实现支付时启用）
-- ============================================================
CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    order_no        VARCHAR(50) UNIQUE NOT NULL,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    product_id      BIGINT REFERENCES products(id),
    order_type      VARCHAR(20) NOT NULL
                    CHECK (order_type IN ('DONATION', 'SUBSCRIPTION', 'PURCHASE')),
    amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency        VARCHAR(10) DEFAULT 'CNY',
    payment_method  VARCHAR(50),
    payment_status  VARCHAR(20) DEFAULT 'PENDING'
                    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED')),
    trade_no        VARCHAR(100),
    payment_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    refund_reason   TEXT,
    remark          TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_orders_no ON orders(order_no);

-- ============================================================
-- VIP 会员订阅表（阶段二实现支付时启用）
-- ============================================================
CREATE TABLE subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    plan_type       VARCHAR(20) NOT NULL
                    CHECK (plan_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    status          VARCHAR(20) DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    start_at        TIMESTAMPTZ NOT NULL,
    expire_at       TIMESTAMPTZ NOT NULL,
    auto_renew      BOOLEAN DEFAULT TRUE,
    order_id        BIGINT REFERENCES orders(id),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
```

### 4.8 初始化数据

```sql
-- 初始化角色数据
INSERT INTO roles (code, name, description) VALUES
    ('ANONYMOUS',   '匿名用户',   '未登录访客，可浏览和下载'),
    ('USER',        '普通用户',   '已注册用户，可评论和评分'),
    ('VIP',         'VIP 用户',   '付费用户，优先下载和专属内容'),
    ('ADMIN',       '管理员',     '内容审核和用户管理'),
    ('SUPER_ADMIN', '超级管理员', '系统配置和权限管理');

-- 初始化权限数据
INSERT INTO permissions (code, name) VALUES
    ('PRODUCT:READ',      '查看产品'),
    ('PRODUCT:CREATE',    '创建产品'),
    ('PRODUCT:UPDATE',    '更新产品'),
    ('PRODUCT:DELETE',    '删除产品'),
    ('PRODUCT:AUDIT',     '审核产品'),
    ('VERSION:CREATE',    '创建版本'),
    ('VERSION:ROLLBACK',  '回滚版本'),
    ('COMMENT:CREATE',    '发表评论'),
    ('COMMENT:DELETE',    '删除评论'),
    ('COMMENT:AUDIT',     '审核评论'),
    ('USER:READ',         '查看用户'),
    ('USER:UPDATE',       '管理用户'),
    ('USER:BAN',          '封禁用户'),
    ('ORDER:READ',        '查看订单'),
    ('ORDER:REFUND',      '订单退款'),
    ('SYSTEM:CONFIG',     '系统配置'),
    ('STATS:VIEW',        '查看统计');

-- 初始化角色-权限关联（示例：ADMIN 拥有审核类权限，SUPER_ADMIN 拥有全部权限）
-- ADMIN 权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.code IN (
    'PRODUCT:READ', 'PRODUCT:CREATE', 'PRODUCT:UPDATE', 'PRODUCT:AUDIT',
    'VERSION:CREATE', 'COMMENT:CREATE', 'COMMENT:DELETE', 'COMMENT:AUDIT',
    'USER:READ', 'USER:UPDATE', 'USER:BAN', 'ORDER:READ', 'STATS:VIEW'
);

-- SUPER_ADMIN 拥有全部权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN';

-- USER 基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'USER' AND p.code IN ('PRODUCT:READ', 'COMMENT:CREATE');

-- 初始化超级管理员账号（密码: Admin@123456，BCrypt hash）
INSERT INTO users (username, email, password_hash, nickname, status, email_verified) VALUES
    ('admin', 'admin@qtplatform.com',
     '$2a$12$LJ3m4ys0Z9Xqf3RVx7FvXOQF4qBv5L5HZ5Wd6mN8aX3V2S6P0KJi',
     '超级管理员', 'ACTIVE', TRUE);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.code = 'SUPER_ADMIN';

-- 初始化系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
    ('site.name',           'Qt 产品发布平台',        '站点名称'),
    ('site.name_en',        'Qt Product Platform',   '站点英文名称'),
    ('site.description',    'Qt 软件产品发布与分发',   '站点描述'),
    ('upload.max_file_size', '1073741824',            '最大上传文件大小（字节）'),
    ('comment.auto_approve', 'false',                 '评论是否自动通过审核'),
    ('register.enabled',     'true',                  '是否开放注册');
```

### 4.9 updated_at 自动更新触发器

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON product_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_i18n_updated_at
    BEFORE UPDATE ON i18n_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.10 阶段一数据库表总览

| 表名 | 用途 | 阶段一状态 |
|------|------|-----------|
| `users` | 用户信息 | ✅ 完整实现 |
| `roles` | 角色定义 | ✅ 完整实现 |
| `user_roles` | 用户-角色关联 | ✅ 完整实现 |
| `permissions` | 权限定义 | ✅ 完整实现 |
| `role_permissions` | 角色-权限关联 | ✅ 完整实现 |
| `user_oauth_bindings` | 第三方登录绑定 | ✅ 仅 GitHub |
| `email_verifications` | 邮箱验证码 | ✅ 完整实现 |
| `categories` | 产品分类 | ✅ 完整实现 |
| `products` | 产品信息 | ✅ 完整实现 |
| `product_versions` | 版本信息 | ✅ 完整实现 |
| `delta_updates` | 增量更新包 | ✅ 完整实现 |
| `product_comments` | 评论 | ✅ 完整实现 |
| `comment_likes` | 评论点赞 | ✅ 完整实现 |
| `notifications` | 站内通知 | ✅ 完整实现 |
| `download_records` | 下载记录（分区） | ✅ 完整实现 |
| `user_access_logs` | 访问日志（分区） | ✅ 完整实现 |
| `system_configs` | 系统配置 | ✅ 完整实现 |
| `file_records` | 文件管理 | ✅ 完整实现 |
| `audit_logs` | 操作审计 | ✅ 完整实现 |
| `i18n_messages` | 多语言内容 | ✅ 完整实现 |
| `orders` | 订单 | ⏳ 仅建表 |
| `subscriptions` | VIP 订阅 | ⏳ 仅建表 |

---

## 五、API 设计

> 阶段一实现除支付相关以外的全部 API。API 统一以 `/api/v1` 为前缀，遵循 RESTful 规范。

### 5.1 阶段一 API 清单

#### 5.1.1 认证与账号

```
POST   /api/v1/auth/register                     # 邮箱注册
POST   /api/v1/auth/login                        # 邮箱密码登录
POST   /api/v1/auth/logout                       # 登出
POST   /api/v1/auth/refresh                      # 刷新 Token
POST   /api/v1/auth/send-code                    # 发送邮箱验证码
POST   /api/v1/auth/verify-email                 # 验证邮箱
POST   /api/v1/auth/forgot-password              # 忘记密码（发送重置链接）
POST   /api/v1/auth/reset-password               # 重置密码
PUT    /api/v1/auth/change-password              # 修改密码（已登录用户）
```

#### 5.1.2 OAuth2.0 第三方登录（阶段一仅 GitHub）

```
GET    /api/v1/auth/oauth/github                 # 获取 GitHub 授权 URL
GET    /api/v1/auth/oauth/github/callback        # GitHub OAuth 回调
POST   /api/v1/auth/oauth/bind                   # 绑定第三方账号
DELETE /api/v1/auth/oauth/unbind/{provider}      # 解绑第三方账号
```

#### 5.1.3 用户

```
GET    /api/v1/users/profile                     # 获取当前用户信息
PUT    /api/v1/users/profile                     # 更新用户信息
POST   /api/v1/users/avatar                      # 上传头像
PUT    /api/v1/users/language                    # 切换语言偏好
GET    /api/v1/users/{id}/public                 # 获取公开用户信息
GET    /api/v1/users/notifications               # 获取通知列表
PUT    /api/v1/users/notifications/{id}/read     # 标记通知已读
PUT    /api/v1/users/notifications/read-all      # 全部标记已读
GET    /api/v1/users/downloads                   # 我的下载记录
```

#### 5.1.4 产品（公开）

```
GET    /api/v1/products                          # 产品列表（分页/筛选/排序）
GET    /api/v1/products/featured                 # 推荐产品
GET    /api/v1/products/search?q={keyword}       # 搜索产品（PostgreSQL ILIKE）
GET    /api/v1/products/{slug}                   # 产品详情（slug）
GET    /api/v1/products/{id}/versions            # 版本列表
GET    /api/v1/products/{id}/versions/latest     # 最新版本信息
GET    /api/v1/categories                        # 分类列表
```

#### 5.1.5 产品管理（需 ADMIN 角色）

```
POST   /api/v1/products                          # 创建产品
PUT    /api/v1/products/{id}                     # 更新产品
DELETE /api/v1/products/{id}                     # 删除产品
POST   /api/v1/products/{id}/versions            # 创建新版本
PUT    /api/v1/products/{id}/versions/{vid}      # 更新版本
POST   /api/v1/products/{id}/versions/{vid}/rollback  # 版本回滚
```

#### 5.1.6 下载

```
GET    /api/v1/downloads/{productId}/{versionId}    # 下载指定版本
GET    /api/v1/downloads/{productId}/latest          # 下载最新版本
HEAD   /api/v1/downloads/{productId}/{versionId}     # 获取文件信息（断点续传预检）
```

#### 5.1.7 更新检查（供 Qt 客户端调用）

```
GET    /api/v1/updates/check                     # 检查更新
       ?product={productId}
       &version={currentVersion}
       &platform={platform}
       &arch={architecture}
POST   /api/v1/updates/report                    # 上报更新结果
```

#### 5.1.8 评论

```
GET    /api/v1/products/{id}/comments            # 产品评论列表（分页）
POST   /api/v1/products/{id}/comments            # 发表评论/回复（需认证）
PUT    /api/v1/comments/{id}                     # 编辑评论（需认证，仅自己）
DELETE /api/v1/comments/{id}                     # 删除评论（自己或管理员）
POST   /api/v1/comments/{id}/like                # 点赞评论（需认证）
DELETE /api/v1/comments/{id}/like                # 取消点赞（需认证）
```

#### 5.1.9 管理后台（需 ADMIN / SUPER_ADMIN 角色）

```
# 仪表盘
GET    /api/v1/admin/dashboard                   # 后台概览数据

# 用户管理
GET    /api/v1/admin/users                       # 用户列表（分页/搜索）
GET    /api/v1/admin/users/{id}                  # 用户详情
PUT    /api/v1/admin/users/{id}/status           # 修改用户状态（封禁/解封）
PUT    /api/v1/admin/users/{id}/roles            # 修改用户角色

# 产品审核
GET    /api/v1/admin/products                    # 产品列表
GET    /api/v1/admin/products/pending            # 待审核产品
PUT    /api/v1/admin/products/{id}/audit         # 审核产品（通过/拒绝）
GET    /api/v1/admin/versions/pending            # 待审核版本
PUT    /api/v1/admin/versions/{id}/audit         # 审核版本

# 评论管理
GET    /api/v1/admin/comments                    # 评论列表
GET    /api/v1/admin/comments/pending            # 待审核评论
PUT    /api/v1/admin/comments/{id}/audit         # 审核评论
DELETE /api/v1/admin/comments/{id}               # 删除评论

# 统计分析
GET    /api/v1/admin/stats/overview              # 总览统计
GET    /api/v1/admin/stats/users                 # 用户统计
GET    /api/v1/admin/stats/downloads             # 下载统计
GET    /api/v1/admin/stats/access                # 访问统计

# 系统配置（需 SUPER_ADMIN 角色）
GET    /api/v1/admin/system/configs              # 获取系统配置
PUT    /api/v1/admin/system/configs/{key}        # 更新系统配置
GET    /api/v1/admin/system/audit-logs           # 操作审计日志

# 内容管理
POST   /api/v1/admin/categories                  # 创建分类
PUT    /api/v1/admin/categories/{id}             # 更新分类
DELETE /api/v1/admin/categories/{id}             # 删除分类

# 文件管理
POST   /api/v1/admin/files/upload                # 通用文件上传
GET    /api/v1/admin/files                       # 文件列表
DELETE /api/v1/admin/files/{id}                  # 删除文件
```

#### 5.1.10 阶段二延后的 API

```
# 以下 API 阶段一不实现，阶段二开发
POST   /api/v1/orders                            # 创建订单
GET    /api/v1/orders/{orderNo}                  # 获取订单详情
POST   /api/v1/orders/{orderNo}/cancel           # 取消订单
POST   /api/v1/payments/wechat/create            # 创建微信支付
POST   /api/v1/payments/alipay/create            # 创建支付宝支付
POST   /api/v1/payments/*/notify                 # 支付回调
GET    /api/v1/users/orders                      # 我的订单列表
GET    /api/v1/admin/orders                      # 订单管理
GET    /api/v1/admin/stats/revenue               # 收入统计
POST   /api/v1/admin/orders/{orderNo}/refund     # 退款
```

### 5.2 API 响应格式

```json
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { },
  "timestamp": "2026-01-01T00:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}

// 分页响应
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}

// 错误响应
{
  "code": 40001,
  "message": "参数验证失败",
  "errors": [
    { "field": "email", "message": "邮箱格式不正确" }
  ],
  "timestamp": "2026-01-01T00:00:00Z",
  "requestId": "uuid"
}
```

> **规则**：业务码 `code` = `0` 表示成功（不使用 HTTP 200 作为业务码），错误码按模块分段。

### 5.3 错误码规范

| 错误码范围 | 说明 | 示例 |
|-----------|------|------|
| 0 | 成功 | — |
| 10001 – 19999 | 认证 / 授权 | 10001 未登录，10002 Token 过期，10003 权限不足 |
| 20001 – 29999 | 用户模块 | 20001 用户不存在，20002 邮箱已注册，20003 验证码错误 |
| 30001 – 39999 | 产品模块 | 30001 产品不存在，30002 版本号已存在 |
| 40001 – 49999 | 参数 / 请求 | 40001 参数验证失败，40002 请求过于频繁 |
| 60001 – 69999 | 文件 / 下载 | 60001 文件不存在，60002 文件校验失败 |
| 90001 – 99999 | 系统内部 | 90001 服务不可用，90002 数据库错误 |

---

## 六、安全设计

### 6.1 JWT 双 Token 认证

```
Access Token:  有效期 2 小时，存储在前端内存（非 localStorage，防 XSS）
Refresh Token: 有效期 7 天，存储在 Redis，通过 HttpOnly Cookie 传递
```

```json
// Access Token Payload
{
  "sub": "12345",
  "username": "john_doe",
  "roles": ["USER", "VIP"],
  "iat": 1640995200,
  "exp": 1641002400
}
```

**Token 刷新流程**：

```
1. 前端检测到 Access Token 即将过期（提前 5 分钟）
2. 携带 Refresh Token 请求 /api/v1/auth/refresh
3. 后端验证 Refresh Token 有效性（Redis 中是否存在且未过期）
4. 签发新 Access Token + 新 Refresh Token（旧 Refresh Token 立即失效）
5. 前端更新内存中的 Access Token
```

### 6.2 Spring Security 配置

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // 开启方法级权限控制
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // JWT 无状态架构，必须禁用 CSRF
            .csrf(AbstractHttpConfigurer::disable)
            // CORS 跨域配置
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 安全响应头
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self' data:; " +
                        "connect-src 'self' https://api.github.com"))
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                    .preload(true))
            )
            // 无状态会话
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 权限配置
            .authorizeHttpRequests(auth -> auth
                // 公开接口
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/updates/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/downloads/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/v1/downloads/**").permitAll()
                // 管理后台
                .requestMatchers("/api/v1/admin/system/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                // 其他接口需认证
                .anyRequest().authenticated()
            )
            // JWT 过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // 异常处理
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                .accessDeniedHandler(new JwtAccessDeniedHandler())
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "https://your-domain.com",
            "http://localhost:5173"   // 开发环境 Vite 默认端口
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Content-Disposition", "Content-Range", "Accept-Ranges"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### 6.3 方法级权限控制

```java
// 仅管理员可发布产品
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public Product createProduct(CreateProductRequest request) { ... }

// 仅自己或管理员可编辑评论
@PreAuthorize("hasRole('ADMIN') or @securityService.isCommentOwner(#commentId, authentication)")
public void updateComment(Long commentId, UpdateCommentRequest request) { ... }

// 仅超级管理员可修改系统配置
@PreAuthorize("hasRole('SUPER_ADMIN')")
public void updateSystemConfig(String key, String value) { ... }
```

### 6.4 API 限流策略

```yaml
rate-limit:
  login:
    attempts-per-minute: 5               # 登录：每分钟 5 次（防暴力破解）
    lockout-duration-minutes: 15         # 超限后锁定 15 分钟
  register:
    attempts-per-hour-per-ip: 10         # 注册：每 IP 每小时 10 次
  verification-code:
    attempts-per-minute-per-email: 1     # 验证码：每邮箱每分钟 1 次
    attempts-per-hour-per-email: 10      # 验证码：每邮箱每小时 10 次
  upload:
    requests-per-hour: 50               # 文件上传：每小时 50 次
```

### 6.5 数据安全

**传输加密**：
- TLS 1.2/1.3 强制 HTTPS
- HSTS 响应头，max-age = 1 年

**存储加密**：
- 密码：BCrypt 哈希（cost factor = 12）
- OAuth Token：AES-256-GCM 加密存储
- 敏感配置：环境变量注入，不硬编码

**文件安全**：
- 上传文件类型白名单：`.exe`, `.zip`, `.7z`, `.tar.gz`, `.dmg`, `.AppImage`, `.msi`, `.deb`, `.rpm`
- 文件大小限制：单文件最大 1GB
- 文件名清洗：过滤路径穿越字符（`../`、`..\\`）
- 存储隔离：上传目录与应用目录分离
- 更新包校验：SHA256 哈希 + 可选 RSA 数字签名

### 6.6 XSS / SQL 注入防护

```java
// XSS 防护：全局输入过滤
@Component
public class XssFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(new XssHttpServletRequestWrapper((HttpServletRequest) request), response);
    }
}

public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {
    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        return value != null ? HtmlUtils.htmlEscape(value) : null;
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] values = super.getParameterValues(name);
        if (values == null) return null;
        return Arrays.stream(values)
            .map(HtmlUtils::htmlEscape)
            .toArray(String[]::new);
    }
}
```

**SQL 注入防护**：
- MyBatis 使用 `#{}` 参数绑定（预编译），禁止使用 `${}`
- JPA 使用参数化查询，禁止字符串拼接 SQL
- 所有用户输入使用 `@Valid` + Bean Validation 校验

**日志脱敏**：
- 邮箱：`j***@example.com`
- IP：`192.168.***.**`
- Token：仅记录前 8 位

---

## 七、缓存策略

### 7.1 Redis 缓存 Key 规范

```
格式: {服务}:{模块}:{标识}
示例: qt:user:session:{userId}
```

| Key 模式 | 用途 | TTL | 更新策略 |
|---------|------|-----|---------|
| `qt:auth:session:{userId}` | Refresh Token | 7 天 | 登录时写入，登出时删除 |
| `qt:auth:blacklist:{tokenId}` | Token 黑名单 | 2 小时 | 登出时写入 |
| `qt:user:info:{userId}` | 用户信息缓存 | 1 小时 | 用户更新时清除 |
| `qt:product:detail:{productId}` | 产品详情 | 30 分钟 | 产品更新时清除 |
| `qt:product:list:{hash}` | 产品列表（查询参数哈希） | 15 分钟 | 产品变更时清除 |
| `qt:product:featured` | 推荐产品 | 1 小时 | 定时刷新 |
| `qt:version:latest:{productId}:{platform}` | 最新版本 | 10 分钟 | 新版本发布时清除 |
| `qt:stats:download:{productId}` | 下载计数缓冲 | 5 分钟 | 定时批量写回 DB |
| `qt:stats:view:{productId}` | 浏览计数缓冲 | 5 分钟 | 定时批量写回 DB |
| `qt:limit:login:{ip}` | 登录限流 | 15 分钟 | 自动过期 |
| `qt:limit:api:{userId}` | API 限流 | 1 小时 | 滑动窗口 |
| `qt:verify:code:{email}:{type}` | 邮箱验证码 | 10 分钟 | 使用后删除 |

### 7.2 缓存更新策略（Cache-Aside）

```java
@Service
public class ProductServiceImpl implements ProductService {

    // 读：先查缓存，未命中查数据库并回填
    @Cacheable(value = "qt:product:detail", key = "#productId")
    public ProductVO getProductById(Long productId) {
        return productRepository.findByIdWithDetails(productId);
    }

    // 写：先更新数据库，再删除缓存（延迟双删保证一致性）
    @CacheEvict(value = "qt:product:detail", key = "#productId")
    @Transactional
    public void updateProduct(Long productId, UpdateProductRequest request) {
        productRepository.update(productId, request);
        CompletableFuture.delayedExecutor(500, TimeUnit.MILLISECONDS)
            .execute(() -> cacheManager.getCache("qt:product:detail").evict(productId));
    }
}

// 缓存预热：应用启动时加载热数据
@Component
public class CacheWarmer implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        productService.getFeaturedProducts();
    }
}
```

### 7.3 缓存穿透 / 雪崩 / 击穿防护

| 问题 | 解决方案 |
|------|---------|
| **缓存穿透**（查询不存在的数据） | 空值缓存（TTL 2 分钟） |
| **缓存雪崩**（大量 Key 同时过期） | TTL 加随机偏移量（± 10%） |
| **缓存击穿**（热 Key 过期瞬间高并发） | 互斥锁（Redis SETNX） |

---

## 八、前端架构设计

### 8.1 前端项目结构

```
qt-platform-web/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/                    # 静态资源
│   │   ├── fonts/                 # 字体文件（书法字体等）
│   │   ├── images/                # 图片资源（背景、纹理等）
│   │   └── icons/                 # 图标
│   ├── components/                # 通用组件
│   │   ├── Layout/                # 布局组件
│   │   │   ├── Header.tsx         # 页头（导航、语言切换、用户菜单）
│   │   │   ├── Footer.tsx         # 页脚
│   │   │   ├── Sidebar.tsx        # 侧边栏（管理后台）
│   │   │   └── MainLayout.tsx     # 主布局
│   │   ├── UI/                    # 基础 UI 组件（现代化风格封装）
│   │   │   ├── ModernButton.tsx   # 现代化按钮
│   │   │   ├── ModernCard.tsx     # 现代化卡片
│   │   │   ├── ModernDivider.tsx  # 分割线
│   │   │   └── ModernLoading.tsx  # 加载动画
│   │   ├── Business/              # 业务组件
│   │   │   ├── ProductCard.tsx    # 产品卡片
│   │   │   ├── VersionList.tsx    # 版本列表
│   │   │   ├── CommentList.tsx    # 评论列表
│   │   │   ├── RatingStars.tsx    # 评分星级
│   │   │   └── DownloadButton.tsx # 下载按钮
│   │   └── Common/                # 公共组件
│   │       ├── ErrorBoundary.tsx  # 错误边界
│   │       ├── PrivateRoute.tsx   # 需认证路由守卫
│   │       ├── AdminRoute.tsx     # 管理员路由守卫
│   │       └── SEOHead.tsx        # SEO Head 管理
│   ├── pages/                     # 页面组件
│   │   ├── Home/                  # 首页
│   │   ├── Products/              # 产品列表 / 详情
│   │   ├── Auth/                  # 登录 / 注册 / 密码找回
│   │   ├── User/                  # 用户中心
│   │   └── Admin/                 # 管理后台
│   │       ├── Dashboard/         # 仪表盘
│   │       ├── Users/             # 用户管理
│   │       ├── Products/          # 产品管理
│   │       ├── Comments/          # 评论管理
│   │       ├── Stats/             # 数据统计
│   │       └── System/            # 系统设置
│   ├── store/                     # Redux 状态管理
│   │   ├── index.ts               # Store 配置
│   │   ├── slices/                # 状态切片
│   │   │   ├── authSlice.ts       # 认证状态
│   │   │   └── uiSlice.ts         # UI 状态（主题、语言、侧边栏）
│   │   └── api/                   # RTK Query API
│   │       ├── baseApi.ts         # 基础 API 配置
│   │       ├── authApi.ts         # 认证 API
│   │       ├── productApi.ts      # 产品 API
│   │       ├── commentApi.ts      # 评论 API
│   │       └── adminApi.ts        # 管理后台 API
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAuth.ts             # 认证状态
│   │   ├── usePermission.ts       # 权限判断
│   │   ├── useResponsive.ts       # 响应式断点
│   │   └── useDebounce.ts         # 防抖
│   ├── utils/                     # 工具函数
│   │   ├── request.ts             # Axios 封装（拦截器、Token 注入）
│   │   ├── storage.ts             # 本地存储封装
│   │   ├── format.ts              # 格式化工具（日期、文件大小等）
│   │   └── validator.ts           # 表单验证规则
│   ├── styles/                    # 样式文件
│   │   ├── theme/                 # Ant Design 主题定制
│   │   │   ├── modernTheme.ts    # 现代化主题 Token
│   │   │   └── darkTheme.ts       # 暗色主题
│   │   ├── global.css             # 全局样式
│   │   ├── variables.css          # CSS 变量
│   │   └── animations.css         # 现代化动画
│   ├── locales/                   # 国际化文件
│   │   ├── zh-CN/                 # 中文
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── product.json
│   │   │   └── admin.json
│   │   ├── en-US/                 # 英文
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── product.json
│   │   │   └── admin.json
│   │   └── index.ts               # i18n 配置
│   ├── router/                    # 路由配置
│   │   ├── index.tsx              # 路由定义
│   │   └── routes.ts              # 路由表
│   ├── App.tsx                    # 根组件
│   ├── main.tsx                   # 入口文件
│   └── vite-env.d.ts              # Vite 类型声明
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

### 8.2 路由设计

```typescript
// router/routes.ts
import { lazy } from 'react';

// 前台页面（懒加载）
const Home           = lazy(() => import('@/pages/Home'));
const ProductList    = lazy(() => import('@/pages/Products/List'));
const ProductDetail  = lazy(() => import('@/pages/Products/Detail'));
const Login          = lazy(() => import('@/pages/Auth/Login'));
const Register       = lazy(() => import('@/pages/Auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('@/pages/Auth/ResetPassword'));
const UserProfile    = lazy(() => import('@/pages/User/Profile'));
const UserSettings   = lazy(() => import('@/pages/User/Settings'));
const UserDownloads  = lazy(() => import('@/pages/User/Downloads'));

// 管理后台（懒加载）
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminUsers     = lazy(() => import('@/pages/Admin/Users'));
const AdminProducts  = lazy(() => import('@/pages/Admin/Products'));
const AdminComments  = lazy(() => import('@/pages/Admin/Comments'));
const AdminStats     = lazy(() => import('@/pages/Admin/Stats'));
const AdminSystem    = lazy(() => import('@/pages/Admin/System'));

export const routes = [
  // ============ 前台路由 ============
  { path: '/',                   element: <Home /> },
  { path: '/products',           element: <ProductList /> },
  { path: '/products/:slug',     element: <ProductDetail /> },
  { path: '/login',              element: <Login /> },
  { path: '/register',           element: <Register /> },
  { path: '/forgot-password',    element: <ForgotPassword /> },
  { path: '/reset-password',     element: <ResetPassword /> },

  // ============ 用户中心（需认证） ============
  { path: '/user/profile',       element: <PrivateRoute><UserProfile /></PrivateRoute> },
  { path: '/user/settings',      element: <PrivateRoute><UserSettings /></PrivateRoute> },
  { path: '/user/downloads',     element: <PrivateRoute><UserDownloads /></PrivateRoute> },

  // ============ 管理后台（需 ADMIN 角色） ============
  { path: '/admin',              element: <AdminRoute><AdminDashboard /></AdminRoute> },
  { path: '/admin/users',        element: <AdminRoute><AdminUsers /></AdminRoute> },
  { path: '/admin/products',     element: <AdminRoute><AdminProducts /></AdminRoute> },
  { path: '/admin/comments',     element: <AdminRoute><AdminComments /></AdminRoute> },
  { path: '/admin/stats',        element: <AdminRoute><AdminStats /></AdminRoute> },
  { path: '/admin/system',       element: <SuperAdminRoute><AdminSystem /></SuperAdminRoute> },

  // ============ 404 ============
  { path: '*',                   element: <NotFound /> },
];
```

### 8.3 现代化设计规范

#### 8.3.1 色彩体系

```css
/* styles/variables.css */
:root {
  /* ===== 主色系 ===== */
  --primary-blue:    #1890ff;     /* 主色 — 按钮、链接 */
  --primary-light:   #40a9ff;     /* 浅色 — 悬停状态 */
  --primary-dark:    #096dd9;     /* 深色 - 激活状态 */
  
  /* ===== 辅助色系 ===== */
  --success-green:   #52c41a;     /* 成功 */
  --warning-orange:  #faad14;     /* 警告 */
  --error-red:       #ff4d4f;     /* 错误 */
  
  /* ===== 中性色系 ===== */
  --text-primary:    #262626;     /* 主要文字 */
  --text-secondary:  #595959;     /* 次要文字 */
  --text-disabled:   #bfbfbf;     /* 禁用文字 */
  --border-base:     #d9d9d9;     /* 基础边框 */
  --background-light: #fafafa;    /* 浅色背景 */
  --background-white: #ffffff;    /* 白色背景 */
  --paper-cream:     #f5f0e8;     /* 米黄纸 — 卡片背景 */
  --paper-warm:      #ede6d6;     /* 暖纸色 — 高亮区域 */

  /* ===== 点缀色 ===== */
  --cinnabar:        #c23a30;     /* 朱砂红 — 主要强调/CTA 按钮 */
  --cinnabar-light:  #d4524a;     /* 浅朱砂 — Hover 状态 */
  --cinnabar-dark:   #a02a22;     /* 深朱砂 — Active 状态 */
  --indigo:          #2f4f6f;     /* 靛蓝 — 链接/辅助强调 */
  --indigo-light:    #3d6a8f;     /* 浅靛蓝 — Hover 状态 */
  --jade-green:      #2d6a4f;     /* 玉绿 — 成功状态 */
  --gold:            #b8860b;     /* 金色 — VIP/高亮 */
  --vermilion:       #e74c3c;     /* 朱红 — 错误/警告 */

  /* ===== 功能色 ===== */
  --color-success:   var(--jade-green);
  --color-error:     var(--vermilion);
  --color-warning:   #d4a017;
  --color-info:      var(--indigo);
}
```

#### 8.3.2 字体体系

```css
:root {
  /* 标题字体：宋体/衬线体 — 体现书法韵味 */
  --font-heading: 'Noto Serif SC', 'Source Han Serif CN', 'SimSun', serif;

  /* 正文字体：黑体/无衬线体 — 保证可读性 */
  --font-body: 'Noto Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif;

  /* 英文字体 */
  --font-english: 'Inter', 'Roboto', sans-serif;

  /* 等宽字体：代码/版本号 */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 字号体系 */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  36px;
  --text-5xl:  48px;

  /* 行高 */
  --leading-tight:  1.25;
  --leading-normal: 1.6;
  --leading-loose:  1.8;
}

#### 8.3.3 现代化动画效果

```css
/* styles/animations.css */

/* 淡入入场动画 */
@keyframes fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

/* 上滑入场动画 */
@keyframes slide-up {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 缩放入场动画 */
@keyframes scale-in {
  0%   { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

/* 按钮涟漪效果 */
@keyframes ripple {
  0%   { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
}

/* 使用示例 */
.fade-enter    { animation: fade-in 0.3s ease-out; }
.slide-up-enter { animation: slide-up 0.4s ease-out; }
.scale-enter    { animation: scale-in 0.2s ease-out; }
```

#### 8.3.4 布局原则

- **大量留白**：内容区域两侧留白 ≥ 10%，段落间距宽松
- **对称与平衡**：页面整体呈中轴对称，卡片网格均匀分布
- **层次感**：通过颜色深浅区分信息层级，避免强烈色块
- **圆角与柔和**：卡片圆角 8-12px，避免尖锐直角
- **纹理质感**：背景使用线性渐变，卡片使用微妙阴影

#### 8.3.5 Ant Design 主题定制

```typescript
// styles/theme/modernTheme.ts
import type { ThemeConfig } from 'antd';

export const modernTheme: ThemeConfig = {
  token: {
    // 主色
    colorPrimary: '#1890ff',           // 蓝色
    colorLink: '#1890ff',
    colorSuccess: '#52c41a',           // 绿色
    colorWarning: '#faad14',           // 橙色
    colorError: '#ff4d4f',              // 红色

    // 背景
    colorBgBase: '#fafaf8',            // 浅色背景
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f5f0e8',        // 米黄纸

    // 文字
    colorText: '#1a1a1a',              // 主要文字
    colorTextSecondary: '#595959',     // 次要文字
    colorTextDisabled: '#bfbfbf',     // 禁用文字
    colorBorder: '#d9d9d9',            // 基础边框
    colorBorderSecondary: '#e8e8e8',

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // 字体
    fontFamily: "'Noto Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,

    // 间距
    marginLG: 32,
    marginMD: 24,
    paddingLG: 32,
    paddingMD: 24,
  },
  components: {
    Button: {
      primaryShadow: '0 2px 8px rgba(194, 58, 48, 0.3)',
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#f5f0e8',
      itemSelectedColor: '#c23a30',
    },
  },
};
```

### 8.4 响应式设计

#### 8.4.1 断点定义

| 断点名称 | 宽度范围 | 目标设备 | 布局策略 |
|---------|---------|---------|---------|
| `xs` | < 480px | 手机竖屏 | 单列，精简导航 |
| `sm` | 480 – 768px | 手机横屏 / 小平板 | 单列，展开部分内容 |
| `md` | 768 – 1024px | 平板 | 双列，侧边导航折叠 |
| `lg` | 1024 – 1440px | 笔记本 | 三列，完整导航 |
| `xl` | ≥ 1440px | 桌面 | 四列，最大内容宽度 1200px |

#### 8.4.2 移动端功能精简

| 功能 | 桌面端 | 平板端 | 移动端 |
|-----|--------|--------|--------|
| 产品列表 | 网格 4 列 | 网格 2 列 | 列表 1 列 |
| 产品详情 | 完整展示 | 完整展示 | 精简截图轮播 |
| 评论 | 完整 + 嵌套回复 | 完整 | 折叠回复 |
| 管理后台 | 完整 | 侧边栏可折叠 | 底部 Tab 导航 |
| 统计图表 | 完整大图 | 缩小 | 简化/隐藏 |
| 现代化动画 | 完整 | 简化 | 禁用（性能优先） |

### 8.5 状态管理设计

```typescript
// store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const language = (getState() as RootState).ui.language;
      headers.set('Accept-Language', language);
      return headers;
    },
  }),
  tagTypes: ['Product', 'Comment', 'User', 'Notification'],
  endpoints: () => ({}),
});

// store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// store/slices/uiSlice.ts
interface UIState {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
}
```

### 8.6 错误边界与全局错误处理

```typescript
// components/Common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    errorReportingService.captureException(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// API 错误拦截器（RTK Query baseQuery 封装）
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);
    if (refreshResult.data) {
      api.dispatch(setAccessToken(refreshResult.data.accessToken));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
```

### 8.7 国际化配置

```typescript
// locales/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCommon  from './zh-CN/common.json';
import zhAuth    from './zh-CN/auth.json';
import zhProduct from './zh-CN/product.json';
import zhAdmin   from './zh-CN/admin.json';

import enCommon  from './en-US/common.json';
import enAuth    from './en-US/auth.json';
import enProduct from './en-US/product.json';
import enAdmin   from './en-US/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { common: zhCommon, auth: zhAuth, product: zhProduct, admin: zhAdmin },
      'en-US': { common: enCommon, auth: enAuth, product: enProduct, admin: enAdmin },
    },
    lng: 'zh-CN',
    fallbackLng: 'en-US',
    ns: ['common', 'auth', 'product', 'admin'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### 8.8 SEO 优化

```typescript
// components/Common/SEOHead.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
}

export const SEOHead: React.FC<SEOProps> = ({ title, description, keywords, image, url, type = 'website' }) => (
  <Helmet>
    <title>{title} | Qt 产品平台</title>
    <meta name="description" content={description} />
    {keywords && <meta name="keywords" content={keywords} />}

    {/* Open Graph */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    {image && <meta property="og:image" content={image} />}
    {url && <meta property="og:url" content={url} />}

    {/* 结构化数据 */}
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': type === 'product' ? 'SoftwareApplication' : 'WebSite',
        name: title,
        description: description,
      })}
    </script>
  </Helmet>
);
```

### 8.9 前端性能优化策略

- **代码分割**：React.lazy + Suspense 按路由懒加载
- **图片优化**：WebP 格式 + 懒加载（IntersectionObserver）+ srcset 响应式图片
- **虚拟滚动**：评论长列表使用 react-window
- **缓存策略**：RTK Query 自动缓存 + 标签失效机制
- **预加载**：关键路由使用 `<link rel="prefetch">`
- **Bundle 优化**：Vite Tree Shaking + Ant Design 按需导入
- **字体优化**：font-display: swap + 字体子集化（仅加载使用的字符）
- **现代化动画**：使用 CSS 动画（GPU 加速）而非 JS 动画；移动端降级

---

## 十、部署架构

### 10.1 Docker 容器化

#### 10.1.1 Spring Boot 多阶段构建 Dockerfile

```dockerfile
# ===== 阶段一：构建 =====
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# 先下载依赖（利用 Docker 层缓存）
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests -B

# ===== 阶段二：运行 =====
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="qt-platform"
LABEL version="1.0"

# 安全：创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/target/qt-platform-*.jar app.jar

RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
```

#### 10.1.2 React 前端 Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### 10.1.3 Docker Compose（生产部署）

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - app_uploads:/app/uploads
      - app_logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - frontend
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    env_file:
      - .env.db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 1G
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  app_uploads:
  app_logs:
  nginx_logs:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

#### 10.1.4 环境变量文件模板

```bash
# .env.example（复制为 .env 并填写实际值，加入 .gitignore）

# 数据库
DB_HOST=postgres
DB_PORT=5432
DB_NAME=qt_platform
DB_USER=qt_user
DB_PASSWORD=<替换为强密码>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<替换为强密码>

# JWT
JWT_SECRET=<替换为64位随机字符串>
JWT_ACCESS_EXPIRATION=7200
JWT_REFRESH_EXPIRATION=604800

# OAuth - GitHub
GITHUB_CLIENT_ID=<GitHub OAuth App ID>
GITHUB_CLIENT_SECRET=<GitHub OAuth App Secret>
GITHUB_REDIRECT_URI=https://your-domain.com/api/v1/auth/oauth/github/callback

# 邮件
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=<邮箱密码>

# 文件存储
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=1073741824
```

### 10.2 Nginx 配置

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for" '
                      '$request_time $upstream_response_time';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    client_max_body_size  1100m;

    gzip  on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 限流
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=download:10m rate=10r/m;

    upstream backend {
        server app:8080;
        keepalive 32;
    }

    # HTTP → HTTPS 重定向
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$host$request_uri;
    }

    # HTTPS 主站
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate     /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # 前端静态资源
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;

            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
                expires 30d;
                add_header Cache-Control "public, immutable";
            }
        }

        # API 代理
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_read_timeout 60s;
        }

        # 登录接口限流
        location /api/v1/auth/login {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 下载接口
        location /api/v1/downloads/ {
            limit_req zone=download burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 600s;
            proxy_buffering off;
        }

        # Actuator（仅内部访问）
        location /actuator/ {
            deny all;
        }
    }
}
```

### 10.3 CI/CD 流水线（GitHub Actions）

```yaml
name: Build & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Java Lint
        run: mvn checkstyle:check spotbugs:check
      - name: Frontend Lint
        working-directory: qt-platform-web
        run: npm ci && npm run lint && npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: qt_platform_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Backend Tests
        run: mvn test -Dspring.profiles.active=test
      - name: Frontend Tests
        working-directory: qt-platform-web
        run: npm ci && npm test

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Docker Image
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker build -t $REGISTRY/$IMAGE_NAME:${{ github.sha }} .
          docker push $REGISTRY/$IMAGE_NAME:${{ github.sha }}
          docker tag $REGISTRY/$IMAGE_NAME:${{ github.sha }} $REGISTRY/$IMAGE_NAME:latest
          docker push $REGISTRY/$IMAGE_NAME:latest

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/qt-platform
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
```

---

## 十一、监控与日志

### 11.1 基础监控（阶段一）

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'qt-platform-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['app:8080']
    scrape_interval: 10s
```

### 11.2 告警规则

```yaml
groups:
  - name: 应用告警
    rules:
      - alert: API 错误率过高
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API 5xx 错误率超过 1%"

      - alert: API 响应时间过长
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API P95 响应时间超过 500ms"

      - alert: JVM 堆内存过高
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning
```

### 11.3 日志管理

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"service":"qt-platform","env":"prod"}</customFields>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/app/logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/app/logs/app.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <totalSizeCap>5GB</totalSizeCap>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
    </appender>

    <root level="INFO">
        <appender-ref ref="JSON" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

### 11.4 备份策略

| 组件 | 备份方式 | 频率 | 保留时间 |
|------|---------|------|---------|
| **PostgreSQL** | pg_dump 全量备份 | 每日凌晨 2 点 | 30 天 |
| **Redis** | RDB 快照 + AOF | RDB 每小时 | 7 天 |
| **文件存储** | rsync 增量同步 | 每日 | 30 天 |
| **应用配置** | Git 版本控制 | 每次变更 | 永久 |
| **Docker 镜像** | GitHub Container Registry | 每次构建 | 最近 50 个 |

```bash
#!/bin/bash
# PostgreSQL 自动备份脚本（crontab: 0 2 * * *）
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="qt_platform"

pg_dump -Fc -h localhost -U qt_user $DB_NAME > "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
```

---

## 十二、测试策略

### 12.1 测试金字塔

| 层级 | 工具 | 覆盖率目标 | 说明 |
|------|------|-----------|------|
| **单元测试** | JUnit 5 + Mockito | ≥ 80% | 核心业务逻辑、工具类 |
| **集成测试** | Spring Boot Test + Testcontainers | ≥ 60% | API 端到端、数据库交互 |
| **E2E 测试** | Cypress | 覆盖核心流程 | 登录、产品浏览、下载、管理后台 |
| **性能测试** | JMeter / k6 | — | 压力测试、负载测试 |
| **安全测试** | OWASP ZAP + Dependency-Check | — | 漏洞扫描、依赖安全 |

### 12.2 集成测试示例（Testcontainers）

```java
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("qt_platform_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldGetProductList() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/v1/products", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
```

### 12.3 E2E 测试示例

```typescript
// cypress/e2e/product-download.cy.ts
describe('产品下载流程', () => {
    it('匿名用户可以下载产品', () => {
        cy.visit('/products');
        cy.get('[data-testid=product-card]').first().click();
        cy.get('[data-testid=download-btn]').click();
        cy.get('[data-testid=download-progress]').should('be.visible');
    });

    it('注册用户可以评论和评分', () => {
        cy.login('user@example.com', 'password');
        cy.visit('/products/qt-studio');
        cy.get('[data-testid=rating-stars]').find('[data-value=5]').click();
        cy.get('[data-testid=comment-input]').type('非常好用！');
        cy.get('[data-testid=submit-comment]').click();
        cy.get('[data-testid=comment-list]').should('contain', '非常好用！');
    });
});
```

---

## 十三、性能指标目标

### 13.1 前端性能

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 首屏加载时间 (FCP) | < 1.5 秒 | 首次内容绘制 |
| 最大内容绘制 (LCP) | < 2.5 秒 | Core Web Vitals |
| 首次输入延迟 (FID) | < 100 毫秒 | Core Web Vitals |
| 累积布局偏移 (CLS) | < 0.1 | Core Web Vitals |
| 页面可交互时间 (TTI) | < 3.5 秒 | — |

### 13.2 后端 API 性能

| 指标 | 目标值 |
|------|-------|
| 平均响应时间 | < 200 毫秒 |
| P95 响应时间 | < 500 毫秒 |
| P99 响应时间 | < 1000 毫秒 |
| 错误率 (5xx) | < 0.1% |
| 可用性 | > 99.9% |
| 初期并发用户数 | 1000 |

### 13.3 数据库性能

| 指标 | 目标值 |
|------|-------|
| 查询响应时间 | < 100 毫秒 |
| 连接池利用率 | 60% – 80% |
| 缓存命中率 | > 90% |
| 慢查询比例 | < 1% |

### 13.4 文件下载性能

| 文件大小 | 目标时间 | 说明 |
|---------|---------|------|
| < 10 MB | < 5 秒 | 小型工具 |
| 10 – 100 MB | < 30 秒 | 中型应用 |
| 100 MB – 1 GB | < 5 分钟 | 大型应用（10Mbps 带宽） |

---

## 十四、项目管理

### 14.1 Git 分支策略

```
main            ← 生产环境，仅接受 release 和 hotfix 合并
  │
  ├── develop   ← 开发主分支，接受 feature 合并
  │     │
  │     ├── feature/user-auth
  │     ├── feature/product-list
  │     └── feature/admin-panel
  │
  ├── release/1.0.0
  │
  └── hotfix/fix-login-bug
```

### 14.2 代码规范

**后端**：
- 静态分析：SonarQube
- 代码规范：Checkstyle + Google Java Style
- 代码格式化：Spotless
- 依赖安全：OWASP Dependency-Check
- 测试覆盖率：JaCoCo ≥ 80%

**前端**：
- 代码规范：ESLint + Airbnb 规则
- 代码格式化：Prettier
- 类型检查：TypeScript strict mode
- 提交检查：Husky + lint-staged
- 提交规范：Conventional Commits

### 14.3 API 文档

- Swagger / OpenAPI 3.0 自动生成
- 访问地址：`/swagger-ui.html`（仅开发 / 测试环境）
- 生产环境关闭 Swagger UI

---

## 十五、实施路线图（12 周）

### 15.1 详细周计划

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **第 1 – 2 周** | 环境搭建：IDEA + Docker + PostgreSQL + Redis；项目初始化：Spring Boot 多模块 + React + Vite；代码规范配置；Git 仓库建立；数据库建表 + 初始数据 | 可运行的空项目骨架 |
| **第 3 – 4 周** | API 框架搭建（统一响应 + 全局异常 + Swagger）；Spring Security + JWT 认证；RBAC 权限模型实现 | 用户注册/登录可用 |
| **第 5 – 6 周** | 用户模块：注册/登录/GitHub OAuth/邮箱验证/密码找回；多语言切换；用户信息管理 | 用户系统完整可用 |
| **第 7 – 8 周** | 产品模块：CRUD + 分类管理 + 版本管理；下载模块：文件上传/下载/断点续传/计数；更新检查 API | 产品发布和下载可用 |
| **第 9 – 10 周** | 评论模块：评论/评分/点赞/审核；后台管理：仪表盘/用户管理/产品审核/评论管理/分类管理/系统配置 | 评论和后台可用 |
| **第 11 – 12 周** | 前端现代化 UI 开发；响应式设计适配；Docker 容器化；腾讯云部署 | **MVP 上线** |

### 15.2 里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|---------|
| **M1：基础架构就绪** | 第 4 周末 | 项目骨架搭建完成；数据库建表完成；JWT 认证可用；Swagger 文档可访问；前后端可联调 |
| **M2：核心功能完成** | 第 8 周末 | 全部阶段一功能可用；定制主题 UI 完成；中英文切换正常；Docker 容器化完成；腾讯云部署成功；核心流程 E2E 测试通过；性能指标达标 |
| **M3：MVP 版本上线** | 第 12 周末 | 全部阶段一功能可用；定制主题 UI 完成；中英文切换正常；Docker 容器化完成；腾讯云部署成功；核心流程 E2E 测试通过；性能指标达标 |

---

## 十六、风险评估与成本

### 16.1 阶段一风险

| 风险 | 等级 | 影响 | 应对措施 |
|------|------|------|---------|
| 单人开发进度延迟 | 高 | 上线时间推迟 | MVP 功能优先级排序，砍掉非核心功能 |
| 大文件上传/下载稳定性 | 高 | 用户体验差 | 断点续传 + 校验重试 + 充分压测 |
| 安全漏洞 | 高 | 数据泄露/攻击 | 安全扫描自动化 + 定期渗透测试 |
| 技术栈学习成本 | 中 | 开发效率低 | 选择熟悉的技术，逐步引入新技术 |
| 数据库性能瓶颈 | 中 | 响应变慢 | 合理索引 + Redis 缓存 + 分区表 |
| 腾讯云服务故障 | 低 | 服务中断 | 本地备份 + 快速恢复脚本 |

### 16.2 MVP 阶段腾讯云月度成本估算

| 资源 | 规格 | 月费用（估算） |
|------|------|---------------|
| CVM 应用服务器 | 标准型 S5，2 核 4G | ¥ 200 |
| CVM 数据库服务器 | 标准型 S5，2 核 4G | ¥ 200 |
| 系统盘 | 50GB SSD × 2 | ¥ 40 |
| 数据盘 | 200GB SSD | ¥ 60 |
| 带宽 | 按流量计费，预估 100GB/月 | ¥ 80 |
| SSL 证书 | Let's Encrypt 免费 | ¥ 0 |
| 域名 | .com | ¥ 5 |
| **合计** | | **≈ ¥ 585 / 月** |

> 可通过包年包月、预留实例等方式降低 30% – 50% 成本。

---

## 总结

本文档完整定义了 Qt 产品发布平台**阶段一（MVP）**的全部技术方案，覆盖：

1. **目标与范围**：12 周交付 MVP，明确 In/Out Scope
2. **技术栈**：React 18 + Spring Boot 3.2 + PostgreSQL 15 + Redis 7
3. **系统架构**：模块化单体架构，为微服务拆分预留
4. **数据库设计**：22 张表，完整索引、约束、分区、触发器、初始数据
5. **API 设计**：70+ RESTful 接口，统一响应格式与错误码
6. **安全设计**：JWT 双 Token + RBAC + CORS + 限流 + XSS/SQL 注入防护
7. **缓存策略**：Redis Key 规范 + Cache-Aside + 穿透/雪崩/击穿防护
8. **前端架构**：现代化设计规范 + 完整路由 + 响应式 + 状态管理 + SEO + i18n
9. **更新机制**：Qt 客户端自动更新 + 灰度发布 + 增量更新 + 断点续传
10. **部署架构**：Docker 多阶段构建 + Nginx + GitHub Actions CI/CD
11. **测试策略**：测试金字塔（单元 → 集成 → E2E）
12. **实施路线**：3 个里程碑，12 周从零到上线

```
