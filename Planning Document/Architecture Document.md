# Qt产品发布平台技术架构文档

## 项目概述

本项目是一个基于 React + Spring Boot 的 Qt 产品软件发布平台，采用渐进式微服务架构演进策略（单体 → 微服务），支持软件发布、版本管理、自动更新、用户管理、支付捐赠等核心功能，具备风格定义的界面设计和完整的中英文多语言支持。

---

## 一、技术架构总览

### 1.1 技术栈选型

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | React + TypeScript | 18.2.0+ | SPA 单页应用 |
| **状态管理** | Redux Toolkit + RTK Query | 2.x | 含异步请求管理 |
| **UI 组件库** | Ant Design | 5.x | 定制主题 |
| **构建工具** | Vite | 5.x | 快速 HMR |
| **样式方案** | CSS Modules + Ant Design Token | — | 主题变量统一管理 |
| **国际化** | react-i18next | 14.x | 中 / 英双语 |
| **前端路由** | React Router | 6.x | 嵌套路由 + 懒加载 |
| **后端框架** | Spring Boot | 3.2.x | Java 17 LTS |
| **微服务** | Spring Cloud | 2023.0.x | 渐进式引入 |
| **ORM** | MyBatis-Plus + Spring Data JPA | 混合 | 复杂 SQL 用 MyBatis，简单 CRUD 用 JPA |
| **API 网关** | Spring Cloud Gateway | 4.x | 阶段二引入 |
| **注册中心** | Nacos | 2.3.x | 阶段二引入 |
| **消息队列** | RabbitMQ | 3.13.x | 异步解耦 |
| **主数据库** | PostgreSQL | 15.x | JSONB + 全文检索 |
| **缓存** | Redis | 7.x | 哨兵模式 |
| **搜索引擎** | Elasticsearch | 8.12.x | 阶段二引入 |
| **文件存储** | 本地存储 → 腾讯云 COS | — | 渐进迁移 |
| **容器化** | Docker + Docker Compose → K8s | — | 渐进演进 |
| **CI/CD** | GitHub Actions | — | 自动构建部署 |
| **监控** | Prometheus + Grafana | — | 指标采集 + 可视化 |
| **日志** | ELK Stack | 8.12.x | 集中日志 |
| **链路追踪** | SkyWalking | 9.x | 阶段二引入 |
| **云平台** | 腾讯云 | — | CVM + CLB + COS |

---

## 二、系统架构设计

### 2.1 阶段一：单体架构（MVP）

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
          │ - 风格 UI       │        │ - 下载模块      │
          │ - 中英文切换    │        │ - 文件模块      │
          └─────────────────┘        │ - 后台管理模块  │
                                     └────────┬────────┘
                                              │
                                ┌─────────────┼─────────────┐
                                ▼             ▼             ▼
                      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                      │ PostgreSQL   │ │    Redis     │ │  本地文件系统 │
                      │   15.x      │ │    7.x      │ │  (软件包)    │
                      └──────────────┘ └──────────────┘ └──────────────┘
```

**MVP 模块化代码结构**（为未来微服务拆分做准备）：

```
qt-platform/
├── qt-platform-common/          # 公共模块（工具类、异常、常量）
├── qt-platform-user/            # 用户模块（认证、权限、用户管理）
├── qt-platform-product/         # 产品模块（软件管理、版本控制）
├── qt-platform-comment/         # 评论模块（评论、评分）
├── qt-platform-file/            # 文件模块（上传、下载、存储）
├── qt-platform-admin/           # 后台管理模块
├── qt-platform-app/             # 主应用启动模块（聚合所有模块）
└── pom.xml                      # 父 POM
```

### 2.2 阶段二：微服务架构

```
┌──────────────┐      ┌───────────────────────┐
│  React SPA   │◄────►│  Spring Cloud Gateway │
│ (Nginx/CDN)  │      │ (路由/认证/限流/熔断)  │
└──────────────┘      └───────────┬───────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  用户服务   │     │  产品服务   │     │  文件服务   │
    │ (认证/权限) │     │ (版本/分类) │     │ (COS/CDN)  │
    └─────────────┘     └─────────────┘     └─────────────┘
             │                    │                    │
             ▼                    ▼                    ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  支付服务   │     │  通知服务   │     │  统计服务   │
    │ (订单/对账) │     │ (邮件/推送) │     │ (日志/分析) │
    └─────────────┘     └─────────────┘     └─────────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                         基础设施层                            │
│  ┌────────────┐ ┌────────┐ ┌─────────┐ ┌───────┐ ┌───────┐  │
│  │ PostgreSQL │ │ Redis  │ │RabbitMQ │ │ Nacos │ │  ES   │  │
│  │  主从复制  │ │ 哨兵   │ │  集群   │ │ 集群  │ │ 集群  │  │
│  └────────────┘ └────────┘ └─────────┘ └───────┘ └───────┘  │
│  ┌────────────┐ ┌────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ 腾讯云 COS │ │  CDN   │ │SkyWalking│ │ELK + Prometheus│  │
│  └────────────┘ └────────┘ └──────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**微服务拆分顺序与理由**：

| 拆分顺序 | 服务名称 | 优先理由 |
|---------|---------|---------|
| 第 1 步 | 文件服务 | 高 IO、独立性强、与业务耦合低 |
| 第 2 步 | 用户服务 | 高频访问、通用性高、其他服务依赖 |
| 第 3 步 | 支付服务 | 财务独立、安全要求高、需隔离 |
| 第 4 步 | 产品服务 | 核心业务、依赖文件服务 |
| 第 5 步 | 通知服务 | 异步解耦、可独立扩展 |
| 第 6 步 | 统计服务 | 数据密集、可独立优化 |

---

## 三、数据库设计

### 3.1 核心数据模型

#### 3.1.1 用户相关表

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
    oauth_provider VARCHAR(50) NOT NULL,        -- GITHUB, WECHAT, QQ
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

#### 3.1.2 产品相关表

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

#### 3.1.3 评论相关表

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

#### 3.1.4 订单与支付

```sql
-- ============================================================
-- 订单表
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
    payment_method  VARCHAR(50),                 -- WECHAT, ALIPAY, PAYPAL
    payment_status  VARCHAR(20) DEFAULT 'PENDING'
                    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED')),
    trade_no        VARCHAR(100),                -- 第三方支付流水号
    payment_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,                 -- 订单过期时间
    refund_reason   TEXT,
    remark          TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_orders_no ON orders(order_no);

-- ============================================================
-- VIP 会员订阅表
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

#### 3.1.5 通知与消息

```sql
-- ============================================================
-- 系统通知表
-- ============================================================
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,            -- SYSTEM, COMMENT_REPLY, DOWNLOAD, PAYMENT, UPDATE
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    link        VARCHAR(500),                    -- 点击跳转链接
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

#### 3.1.6 下载与统计

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
    country      VARCHAR(10),                    -- 国家代码
    region       VARCHAR(100),                   -- 地区
    download_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    file_size    BIGINT,
    PRIMARY KEY (id, download_at)
) PARTITION BY RANGE (download_at);

-- 创建月度分区示例
CREATE TABLE download_records_2026_01 PARTITION OF download_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE download_records_2026_02 PARTITION OF download_records
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- 后续月份按需自动创建（可通过定时任务或 pg_partman 扩展管理）

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

#### 3.1.7 系统配置与文件管理

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
    target_type  VARCHAR(50),                    -- USER, PRODUCT, VERSION, ORDER...
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
    module        VARCHAR(50),                   -- 所属模块（便于管理）
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(language_code, message_key)
);

CREATE INDEX idx_i18n_lang ON i18n_messages(language_code);
```

### 3.2 初始化数据

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
```

### 3.3 updated_at 自动更新触发器

```sql
-- PostgreSQL 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要的表创建触发器
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

---

## 四、API 设计规范

### 4.1 完整的 RESTful API 列表

#### 4.1.1 认证与账号 API

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

#### 4.1.2 OAuth2.0 第三方登录 API

```
GET    /api/v1/auth/oauth/github                 # 获取 GitHub 授权 URL
GET    /api/v1/auth/oauth/github/callback        # GitHub OAuth 回调
POST   /api/v1/auth/oauth/bind                   # 绑定第三方账号
DELETE /api/v1/auth/oauth/unbind/{provider}      # 解绑第三方账号
```

#### 4.1.3 用户 API

```
GET    /api/v1/users/profile                     # 获取当前用户信息
PUT    /api/v1/users/profile                     # 更新用户信息
POST   /api/v1/users/avatar                      # 上传头像
PUT    /api/v1/users/language                    # 切换语言偏好
GET    /api/v1/users/{id}/public                 # 获取公开用户信息
GET    /api/v1/users/notifications               # 获取通知列表
PUT    /api/v1/users/notifications/{id}/read     # 标记通知已读
PUT    /api/v1/users/notifications/read-all      # 全部标记已读
GET    /api/v1/users/orders                      # 我的订单列表
GET    /api/v1/users/downloads                   # 我的下载记录
```

#### 4.1.4 产品 API（公开）

```
GET    /api/v1/products                          # 获取产品列表（分页/筛选/排序）
GET    /api/v1/products/featured                 # 获取推荐产品
GET    /api/v1/products/search?q={keyword}       # 搜索产品
GET    /api/v1/products/{slug}                   # 获取产品详情（SEO 友好的 slug）
GET    /api/v1/products/{id}/versions            # 获取版本列表
GET    /api/v1/products/{id}/versions/latest     # 获取最新版本信息
GET    /api/v1/categories                        # 获取分类列表
```

#### 4.1.5 产品 API（需认证 — 管理员）

```
POST   /api/v1/products                          # 创建产品
PUT    /api/v1/products/{id}                     # 更新产品
DELETE /api/v1/products/{id}                     # 删除产品
POST   /api/v1/products/{id}/versions            # 创建新版本
PUT    /api/v1/products/{id}/versions/{vid}      # 更新版本
POST   /api/v1/products/{id}/versions/{vid}/rollback  # 版本回滚
```

#### 4.1.6 下载 API

```
GET    /api/v1/downloads/{productId}/{versionId}    # 下载指定版本
GET    /api/v1/downloads/{productId}/latest          # 下载最新版本
HEAD   /api/v1/downloads/{productId}/{versionId}     # 获取文件信息（断点续传预检）
```

#### 4.1.7 更新检查 API（供 Qt 客户端调用）

```
GET    /api/v1/updates/check                     # 检查更新
       ?product={productId}
       &version={currentVersion}
       &platform={platform}
       &arch={architecture}
```

#### 4.1.8 评论 API

```
GET    /api/v1/products/{id}/comments            # 获取产品评论（分页）
POST   /api/v1/products/{id}/comments            # 发表评论/回复（需认证）
PUT    /api/v1/comments/{id}                     # 编辑评论（需认证，仅自己）
DELETE /api/v1/comments/{id}                     # 删除评论（需认证，自己或管理员）
POST   /api/v1/comments/{id}/like                # 点赞评论（需认证）
DELETE /api/v1/comments/{id}/like                # 取消点赞（需认证）
```

#### 4.1.9 支付 API（需认证）

```
POST   /api/v1/orders                            # 创建订单
GET    /api/v1/orders/{orderNo}                  # 获取订单详情
POST   /api/v1/orders/{orderNo}/cancel           # 取消订单
POST   /api/v1/payments/wechat/create            # 创建微信支付
POST   /api/v1/payments/alipay/create            # 创建支付宝支付
POST   /api/v1/payments/wechat/notify            # 微信支付回调（无需认证，验签保护）
POST   /api/v1/payments/alipay/notify            # 支付宝支付回调（无需认证，验签保护）
```

#### 4.1.10 管理后台 API（需 ADMIN / SUPER_ADMIN 角色）

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
GET    /api/v1/admin/products/pending            # 待审核产品列表
PUT    /api/v1/admin/products/{id}/audit         # 审核产品（通过/拒绝）
GET    /api/v1/admin/versions/pending            # 待审核版本列表
PUT    /api/v1/admin/versions/{id}/audit         # 审核版本

# 评论管理
GET    /api/v1/admin/comments                    # 评论列表（分页/筛选）
GET    /api/v1/admin/comments/pending            # 待审核评论
PUT    /api/v1/admin/comments/{id}/audit         # 审核评论（通过/拒绝/隐藏）
DELETE /api/v1/admin/comments/{id}               # 删除评论

# 订单管理
GET    /api/v1/admin/orders                      # 订单列表
GET    /api/v1/admin/orders/{orderNo}            # 订单详情
POST   /api/v1/admin/orders/{orderNo}/refund     # 退款

# 统计分析
GET    /api/v1/admin/stats/overview              # 总览统计
GET    /api/v1/admin/stats/users                 # 用户统计（注册趋势/活跃/地域分布）
GET    /api/v1/admin/stats/downloads             # 下载统计（趋势/产品分布/平台分布）
GET    /api/v1/admin/stats/revenue               # 收入统计
GET    /api/v1/admin/stats/access                # 访问统计

# 系统配置（需 SUPER_ADMIN 角色）
GET    /api/v1/admin/system/configs              # 获取系统配置
PUT    /api/v1/admin/system/configs/{key}        # 更新系统配置
GET    /api/v1/admin/system/audit-logs           # 操作审计日志

# 内容管理
GET    /api/v1/admin/categories                  # 分类管理
POST   /api/v1/admin/categories                  # 创建分类
PUT    /api/v1/admin/categories/{id}             # 更新分类
DELETE /api/v1/admin/categories/{id}             # 删除分类

# 文件管理
POST   /api/v1/admin/files/upload                # 通用文件上传
GET    /api/v1/admin/files                       # 文件列表
DELETE /api/v1/admin/files/{id}                  # 删除文件
```

### 4.2 API 响应格式

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
  },
  "timestamp": "2026-01-01T00:00:00Z",
  "requestId": "uuid"
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

> **说明**：成功响应的 `code` 为 `0` 而非 HTTP 状态码 `200`。HTTP 状态码由协议层传递，业务码应独立编号，避免混淆。

### 4.3 错误码规范

| 错误码范围 | 说明 | 示例 |
|-----------|------|------|
| 0 | 成功 | — |
| 10001 – 19999 | 认证 / 授权错误 | 10001 = 未登录，10002 = Token 过期，10003 = 权限不足 |
| 20001 – 29999 | 用户模块错误 | 20001 = 用户不存在，20002 = 邮箱已注册，20003 = 验证码错误 |
| 30001 – 39999 | 产品模块错误 | 30001 = 产品不存在，30002 = 版本号已存在，30003 = 审核状态异常 |
| 40001 – 49999 | 参数 / 请求错误 | 40001 = 参数验证失败，40002 = 请求过于频繁，40003 = 请求体过大 |
| 50001 – 59999 | 支付 / 订单错误 | 50001 = 订单不存在，50002 = 支付失败，50003 = 订单已过期 |
| 60001 – 69999 | 文件 / 下载错误 | 60001 = 文件不存在，60002 = 文件校验失败，60003 = 存储空间不足 |
| 90001 – 99999 | 系统内部错误 | 90001 = 服务不可用，90002 = 数据库错误，90003 = 缓存异常 |

---

## 五、安全设计

### 5.1 认证授权机制

**JWT 双 Token 机制**：

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

### 5.2 Spring Security 配置

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
            // 权限配置（注意：精确匹配优先，仅 GET 放行公开接口）
            .authorizeHttpRequests(auth -> auth
                // 公开接口
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/updates/**").permitAll()
                .requestMatchers("/api/v1/payments/*/notify").permitAll()
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

    // CORS 跨域配置
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
        return new BCryptPasswordEncoder(12);  // cost factor = 12
    }
}
```

### 5.3 方法级权限控制

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

### 5.4 API 限流策略

```yaml
# application.yml 限流配置
rate-limit:
  # 全局限流
  global:
    requests-per-second: 1000
  # 用户级限流
  user:
    requests-per-hour: 1000
    burst: 100
  # IP 级限流
  ip:
    requests-per-hour: 5000
    burst: 500
  # 登录专项限流（防暴力破解）
  login:
    attempts-per-minute: 5
    lockout-duration-minutes: 15
  # 注册限流
  register:
    attempts-per-hour-per-ip: 10
  # 验证码限流
  verification-code:
    attempts-per-minute-per-email: 1
    attempts-per-hour-per-email: 10
  # 文件上传限流
  upload:
    requests-per-hour: 50
    max-file-size: 1073741824  # 1GB
```

### 5.5 数据安全策略

**传输加密**：
- TLS 1.3 强制 HTTPS
- HSTS 响应头，max-age = 1 年，includeSubDomains，preload
- 证书自动续签（Let's Encrypt 或腾讯云 SSL）

**存储加密**：
- 密码：BCrypt 哈希（cost factor = 12）
- OAuth Token：AES-256-GCM 加密存储
- 敏感配置：Spring Cloud Config 加密 / Vault

**文件安全**：
- 上传文件类型白名单：`.exe`, `.zip`, `.7z`, `.tar.gz`, `.dmg`, `.AppImage`
- 文件大小限制：单文件最大 1GB
- 文件名清洗：过滤特殊字符、路径穿越攻击
- 存储隔离：上传目录与应用目录分离，禁止目录遍历
- 更新包数字签名：RSA-2048 签名验证

### 5.6 XSS / SQL 注入 / CSRF 防护

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

// XSS 请求包装器：转义 HTML 特殊字符
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
- 输入验证：所有用户输入使用 `@Valid` + Bean Validation 校验

**日志脱敏**：
- 邮箱：`j***@example.com`
- IP：`192.168.***.**`
- Token：仅记录前 8 位

---

## 六、前端架构设计

### 6.1 项目结构

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
│   │   ├── UI/                    # 基础 UI 组件（风格封装）
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
│   │       ├── Orders/            # 订单管理
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
│   │       ├── orderApi.ts        # 订单 API
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
│   │   └── animations.css         # 动画
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

### 6.2 路由设计

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
const UserOrders     = lazy(() => import('@/pages/User/Orders'));

// 管理后台（懒加载）
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const AdminUsers     = lazy(() => import('@/pages/Admin/Users'));
const AdminProducts  = lazy(() => import('@/pages/Admin/Products'));
const AdminComments  = lazy(() => import('@/pages/Admin/Comments'));
const AdminOrders    = lazy(() => import('@/pages/Admin/Orders'));
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
  { path: '/user/orders',        element: <PrivateRoute><UserOrders /></PrivateRoute> },

  // ============ 管理后台（需 ADMIN 角色） ============
  { path: '/admin',              element: <AdminRoute><AdminDashboard /></AdminRoute> },
  { path: '/admin/users',        element: <AdminRoute><AdminUsers /></AdminRoute> },
  { path: '/admin/products',     element: <AdminRoute><AdminProducts /></AdminRoute> },
  { path: '/admin/comments',     element: <AdminRoute><AdminComments /></AdminRoute> },
  { path: '/admin/orders',       element: <AdminRoute><AdminOrders /></AdminRoute> },
  { path: '/admin/stats',        element: <AdminRoute><AdminStats /></AdminRoute> },
  { path: '/admin/system',       element: <SuperAdminRoute><AdminSystem /></SuperAdminRoute> },

  // ============ 404 ============
  { path: '*',                   element: <NotFound /> },
];
```

### 6.3 现代化设计规范

#### 6.3.1 色彩体系

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

#### 6.3.2 字体体系

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
```

#### 6.3.3 现代化动画效果

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

#### 6.3.4 布局原则

- **大量留白**：内容区域两侧留白 ≥ 10%，段落间距宽松
- **对称与平衡**：页面整体呈中轴对称，卡片网格均匀分布
- **层次感**：通过墨色深浅区分信息层级，避免强烈色块
- **圆角与柔和**：卡片圆角 8-12px，避免尖锐直角
- **纹理质感**：背景使用宣纸纹理（subtle noise），卡片使用微妙阴影

#### 6.3.5 Ant Design 主题定制

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
    colorBgBase: '#fafaf8',            // 宣纸白
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f5f0e8',        // 米黄纸

    // 文字
    colorText: '#1a1a1a',              // 浓墨
    colorTextSecondary: '#555555',     // 中墨
    colorTextTertiary: '#888888',      // 淡墨
    colorTextQuaternary: '#bbbbbb',    // 极淡墨

    // 边框
    colorBorder: '#d9d9d9',            // 墨晕
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

### 6.4 响应式设计

#### 6.4.1 断点定义

| 断点名称 | 宽度范围 | 目标设备 | 布局策略 |
|---------|---------|---------|---------|
| `xs` | < 480px | 手机竖屏 | 单列，精简导航 |
| `sm` | 480 – 768px | 手机横屏 / 小平板 | 单列，展开部分内容 |
| `md` | 768 – 1024px | 平板 | 双列，侧边导航折叠 |
| `lg` | 1024 – 1440px | 笔记本 | 三列，完整导航 |
| `xl` | ≥ 1440px | 桌面 | 四列，最大内容宽度 1200px |

#### 6.4.2 移动端功能精简

| 功能 | 桌面端 | 平板端 | 移动端 |
|-----|--------|--------|--------|
| 产品列表 | 网格 4 列 | 网格 2 列 | 列表 1 列 |
| 产品详情 | 完整展示 | 完整展示 | 精简截图轮播 |
| 评论 | 完整 + 嵌套回复 | 完整 | 折叠回复 |
| 管理后台 | 完整 | 侧边栏可折叠 | 底部 Tab 导航 |
| 统计图表 | 完整大图 | 缩小 | 简化/隐藏 |
| 现代化动画 | 完整 | 简化 | 禁用（性能优先） |

### 6.5 状态管理设计

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
      // 传递语言偏好
      const language = (getState() as RootState).ui.language;
      headers.set('Accept-Language', language);
      return headers;
    },
  }),
  tagTypes: ['Product', 'Comment', 'User', 'Order', 'Notification'],
  endpoints: () => ({}),  // 各模块独立注入 endpoints
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

### 6.6 错误边界与全局错误处理

```typescript
// components/Common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 上报错误到监控系统
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
    // 尝试刷新 Token
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);
    if (refreshResult.data) {
      api.dispatch(setAccessToken(refreshResult.data.accessToken));
      result = await baseQuery(args, api, extraOptions);  // 重试原请求
    } else {
      api.dispatch(logout());  // 刷新失败，跳转登录
    }
  }

  return result;
};
```

### 6.7 国际化配置

```typescript
// locales/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 中文
import zhCommon  from './zh-CN/common.json';
import zhAuth    from './zh-CN/auth.json';
import zhProduct from './zh-CN/product.json';
import zhAdmin   from './zh-CN/admin.json';

// 英文
import enCommon  from './en-US/common.json';
import enAuth    from './en-US/auth.json';
import enProduct from './en-US/product.json';
import enAdmin   from './en-US/admin.json';

i18n
  .use(LanguageDetector)           // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { common: zhCommon, auth: zhAuth, product: zhProduct, admin: zhAdmin },
      'en-US': { common: enCommon, auth: enAuth, product: enProduct, admin: enAdmin },
    },
    lng: 'zh-CN',                  // 默认语言
    fallbackLng: 'en-US',          // 回退语言
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

### 6.8 SEO 优化

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

### 6.9 前端性能优化策略

- **代码分割**：React.lazy + Suspense 按路由懒加载
- **图片优化**：WebP 格式 + 懒加载（IntersectionObserver）+ srcset 响应式图片
- **虚拟滚动**：评论长列表使用 react-window
- **缓存策略**：RTK Query 自动缓存 + 标签失效机制
- **预加载**：关键路由使用 `<link rel="prefetch">`
- **Bundle 优化**：Vite Tree Shaking + Ant Design 按需导入
- **字体优化**：font-display: swap + 字体子集化（仅加载使用的字符）
- **现代化动画**：使用 CSS 动画（GPU 加速）而非 JS 动画；移动端降级

---

## 七、缓存策略

### 7.1 Redis 缓存设计

#### 7.1.1 缓存 Key 命名规范

```
格式: {服务}:{模块}:{标识}
示例: qt:user:session:{userId}
```

| Key 模式 | 用途 | TTL | 更新策略 |
|---------|------|-----|---------|
| `qt:auth:session:{userId}` | 用户会话（Refresh Token） | 7 天 | 登录时写入，登出时删除 |
| `qt:auth:blacklist:{tokenId}` | Token 黑名单（已注销的 Access Token） | 2 小时 | 登出时写入 |
| `qt:user:info:{userId}` | 用户信息缓存 | 1 小时 | 用户更新时主动清除 |
| `qt:product:detail:{productId}` | 产品详情缓存 | 30 分钟 | 产品更新时主动清除 |
| `qt:product:list:{hash}` | 产品列表缓存（hash = 查询参数哈希） | 15 分钟 | 任何产品变更时清除所有列表缓存 |
| `qt:product:featured` | 推荐产品缓存 | 1 小时 | 定时刷新 |
| `qt:product:hot` | 热门产品排行 | 1 小时 | 定时计算 |
| `qt:version:latest:{productId}:{platform}` | 最新版本信息 | 10 分钟 | 新版本发布时清除 |
| `qt:stats:download:{productId}` | 下载计数缓存（写入缓冲） | 5 分钟 | 定时批量写回数据库 |
| `qt:stats:view:{productId}` | 浏览计数缓存 | 5 分钟 | 定时批量写回数据库 |
| `qt:limit:login:{ip}` | 登录限流计数器 | 15 分钟 | 自动过期 |
| `qt:limit:api:{userId}` | API 限流计数器 | 1 小时 | 滑动窗口 |
| `qt:verify:code:{email}:{type}` | 邮箱验证码 | 10 分钟 | 使用后删除 |

#### 7.1.2 缓存更新策略

```java
// Cache-Aside 模式（读写穿透）
@Service
public class ProductServiceImpl implements ProductService {

    // 读：先查缓存，未命中查数据库并回填缓存
    @Cacheable(value = "qt:product:detail", key = "#productId")
    public ProductVO getProductById(Long productId) {
        return productRepository.findByIdWithDetails(productId);
    }

    // 写：先更新数据库，再删除缓存（延迟双删保证一致性）
    @CacheEvict(value = "qt:product:detail", key = "#productId")
    @Transactional
    public void updateProduct(Long productId, UpdateProductRequest request) {
        productRepository.update(productId, request);
        // 延迟 500ms 后再次删除缓存（防止并发读导致的脏数据回填）
        CompletableFuture.delayedExecutor(500, TimeUnit.MILLISECONDS)
            .execute(() -> cacheManager.getCache("qt:product:detail").evict(productId));
    }
}

// 缓存预热：应用启动时加载热数据
@Component
public class CacheWarmer implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        // 预热推荐产品
        productService.getFeaturedProducts();
        // 预热热门产品
        productService.getHotProducts();
    }
}

// 定时刷新统计缓存
@Scheduled(cron = "0 0 */6 * * ?")
public void refreshHotProducts() {
    cacheManager.getCache("qt:product:hot").clear();
    productService.getHotProducts();
}
```

#### 7.1.3 缓存穿透 / 雪崩 / 击穿防护

| 问题 | 解决方案 |
|------|---------|
| **缓存穿透**（查询不存在的数据） | 布隆过滤器 + 空值缓存（TTL 2 分钟） |
| **缓存雪崩**（大量 Key 同时过期） | TTL 加随机偏移量（± 10%）+ 多级缓存 |
| **缓存击穿**（热 Key 过期瞬间高并发） | 互斥锁（Redis SETNX）+ 逻辑过期 |

---

## 八、Qt 应用更新机制

### 8.1 更新检查流程

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Qt 应用  │                    │ 更新 API │                    │ 文件服务 │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │  1. 启动时检查更新             │                              │
     │  GET /api/v1/updates/check    │                              │
     │  ?product=xxx                 │                              │
     │  &version=1.0.0               │                              │
     │  &platform=WINDOWS            │                              │
     │  &arch=x64                    │                              │
     │──────────────────────────────►│                              │
     │                               │  2. 查询最新版本              │
     │                               │  （缓存优先）                │
     │                               │                              │
     │  3. 返回更新信息               │                              │
     │◄──────────────────────────────│                              │
     │                               │                              │
     │  [有更新 — 可选更新]           │                              │
     │  4. 用户确认更新              │                              │
     │                               │                              │
     │  [有更新 — 强制更新]           │                              │
     │  4. 弹窗提示必须更新          │                              │
     │                               │                              │
     │  5. 下载更新包                │                              │
     │  GET /downloads/{pid}/{vid}   │                              │
     │  Range: bytes=xxx-xxx         │  ──────────────────────────► │
     │  （支持断点续传）              │                              │
     │◄─────────────────────────────────────────────────────────────│
     │                               │                              │
     │  6. 校验文件完整性            │                              │
     │  SHA256 + 数字签名验证        │                              │
     │                               │                              │
     │  7. 安装更新                  │                              │
     │  （备份旧版本 → 替换 → 重启） │                              │
     │                               │                              │
     │  8. 上报更新结果              │                              │
     │  POST /api/v1/updates/report  │                              │
     │──────────────────────────────►│                              │
     │                               │                              │
```

### 8.2 更新检查 API 实现

```java
@RestController
@RequestMapping("/api/v1/updates")
public class UpdateController {

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<UpdateCheckResponse>> checkUpdate(
            @RequestParam String product,
            @RequestParam String version,
            @RequestParam String platform,
            @RequestParam(defaultValue = "x64") String arch) {

        // 1. 查询最新发布版本（缓存优先）
        ProductVersion latest = versionService.getLatestPublishedVersion(product, platform, arch);

        if (latest == null) {
            return ResponseEntity.ok(ApiResponse.success(
                UpdateCheckResponse.builder().hasUpdate(false).build()));
        }

        // 2. 语义化版本比较
        boolean hasUpdate = SemanticVersion.isNewer(latest.getVersionNumber(), version);

        if (!hasUpdate) {
            return ResponseEntity.ok(ApiResponse.success(
                UpdateCheckResponse.builder().hasUpdate(false).build()));
        }

        // 3. 灰度发布检查：根据请求特征哈希决定是否命中灰度
        if (latest.getRolloutPercentage() < 100) {
            int hash = Math.abs((product + platform + arch).hashCode() % 100);
            if (hash >= latest.getRolloutPercentage()) {
                return ResponseEntity.ok(ApiResponse.success(
                    UpdateCheckResponse.builder().hasUpdate(false).build()));
            }
        }

        // 4. 检查是否有增量更新包
        DeltaUpdate delta = deltaUpdateService.findDelta(product, version, latest.getVersionNumber(), platform, arch);

        // 5. 构建响应
        UpdateCheckResponse response = UpdateCheckResponse.builder()
            .hasUpdate(true)
            .updateType(latest.getIsMandatory() ? "MANDATORY" : "OPTIONAL")
            .version(latest.getVersionNumber())
            .versionCode(latest.getVersionCode())
            .releaseNotes(latest.getReleaseNotes())
            // 全量更新信息
            .fullUpdate(FullUpdateInfo.builder()
                .downloadUrl(buildDownloadUrl(latest))
                .fileSize(latest.getFileSize())
                .checksumSha256(latest.getChecksumSha256())
                .build())
            // 增量更新信息（可选）
            .deltaUpdate(delta != null ? DeltaUpdateInfo.builder()
                .downloadUrl(buildDeltaDownloadUrl(delta))
                .fileSize(delta.getFileSize())
                .checksumSha256(delta.getChecksumSha256())
                .fromVersion(version)
                .build() : null)
            .forceUpdate(latest.getIsMandatory())
            .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

### 8.3 更新检查 API 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "hasUpdate": true,
    "updateType": "OPTIONAL",
    "version": "1.2.0",
    "versionCode": 120,
    "releaseNotes": "1. 修复重要 Bug\n2. 性能提升 30%",
    "fullUpdate": {
      "downloadUrl": "https://cdn.example.com/downloads/product/1.2.0/app_1.2.0_win_x64.zip",
      "fileSize": 104857600,
      "checksumSha256": "a1b2c3d4e5f6..."
    },
    "deltaUpdate": {
      "downloadUrl": "https://cdn.example.com/downloads/product/delta/1.0.0_to_1.2.0_win_x64.zip",
      "fileSize": 10485760,
      "checksumSha256": "f6e5d4c3b2a1...",
      "fromVersion": "1.0.0"
    },
    "forceUpdate": false
  }
}
```

### 8.4 断点续传实现

```java
@GetMapping("/{productId}/{versionId}")
public ResponseEntity<Resource> downloadFile(
        @PathVariable Long productId,
        @PathVariable Long versionId,
        @RequestHeader(value = "Range", required = false) String rangeHeader) {

    ProductVersion version = versionService.getById(versionId);
    Path filePath = Paths.get(version.getFilePath());
    Resource resource = new FileSystemResource(filePath);
    long fileSize = version.getFileSize();

    // 无 Range 请求头：完整下载
    if (rangeHeader == null) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(fileSize)
            .header("Content-Disposition", "attachment; filename=\"" + version.getFileName() + "\"")
            .header("Accept-Ranges", "bytes")
            .body(resource);
    }

    // 解析 Range 请求头：断点续传
    long[] range = parseRange(rangeHeader, fileSize);
    long start = range[0];
    long end = range[1];
    long contentLength = end - start + 1;

    InputStreamResource partialResource = new InputStreamResource(
        new FileInputStream(filePath.toFile()) {{ skip(start); }});

    return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .contentLength(contentLength)
        .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
        .header("Accept-Ranges", "bytes")
        .body(partialResource);
}
```

### 8.5 版本回滚机制

```
回滚流程：
1. 管理员在后台发起回滚请求
2. 系统将目标版本的 is_latest 标记为 FALSE
3. 系统将回滚目标版本的 is_latest 标记为 TRUE
4. 清除版本相关缓存
5. 记录审计日志
6. 已下载旧版本的用户在下次检查更新时，若当前版本高于回滚后的最新版本，不触发更新
```

### 8.6 软件包命名规范

```
格式: {产品名}_{版本号}_{平台}_{架构}.{扩展名}

示例:
  qt-studio_1.2.0_windows_x64.zip
  qt-studio_1.2.0_linux_x64.tar.gz
  qt-studio_1.2.0_macos_arm64.dmg

增量更新包:
  qt-studio_1.0.0_to_1.2.0_windows_x64.zip
```

---

## 九、部署架构

### 9.1 Docker 容器化

#### 9.1.1 Spring Boot 多阶段构建 Dockerfile

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

# 从构建阶段复制 JAR
COPY --from=builder /app/target/qt-platform-*.jar app.jar

# 创建必要目录
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# JVM 优化参数
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
```

#### 9.1.2 React 前端 Dockerfile

```dockerfile
# ===== 阶段一：构建 =====
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== 阶段二：运行 =====
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### 9.1.3 Docker Compose（开发 / 测试环境）

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ===== 应用服务 =====
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    env_file:
      - .env                         # 敏感配置从环境变量文件读取
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - app_uploads:/app/uploads     # 上传文件持久化
      - app_logs:/app/logs           # 日志持久化
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

  # ===== Nginx 反向代理 =====
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

  # ===== PostgreSQL =====
  postgres:
    image: postgres:15-alpine
    env_file:
      - .env.db                      # POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
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

  # ===== Redis =====
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

  # ===== RabbitMQ =====
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    env_file:
      - .env.mq                     # RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS
    ports:
      - "15672:15672"               # 管理界面（仅开发环境暴露）
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  app_uploads:
  app_logs:
  nginx_logs:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true                   # 后端网络不直接暴露到宿主机
```

#### 9.1.4 环境变量文件模板

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
JWT_ACCESS_EXPIRATION=7200          # 2小时（秒）
JWT_REFRESH_EXPIRATION=604800       # 7天（秒）

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
MAX_FILE_SIZE=1073741824            # 1GB
```

### 9.2 Nginx 配置

```nginx
# nginx/nginx.conf
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

    # 日志格式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for" '
                      '$request_time $upstream_response_time';

    access_log  /var/log/nginx/access.log  main;

    # 性能优化
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    client_max_body_size  1100m;     # 略大于最大文件 1GB

    # Gzip 压缩
    gzip  on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=download:10m rate=10r/m;

    # 上游服务
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

        # SSL 证书
        ssl_certificate     /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache   shared:SSL:10m;
        ssl_session_timeout 10m;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # 前端静态资源
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;    # SPA 路由回退

            # 静态资源缓存
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
            proxy_read_timeout 600s;         # 大文件下载超时 10 分钟
            proxy_buffering off;             # 关闭缓冲，直接流式传输
        }

        # Spring Boot Actuator（仅内部访问）
        location /actuator/ {
            deny all;
        }
    }
}
```

### 9.3 Kubernetes 部署（阶段三）

```yaml
# k8s/app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qt-platform-app
  labels:
    app: qt-platform
    component: backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: qt-platform-app
  template:
    metadata:
      labels:
        app: qt-platform-app
    spec:
      containers:
      - name: app
        image: qt-platform/app:latest
        ports:
        - containerPort: 8080
        envFrom:
        - secretRef:
            name: qt-platform-secrets
        - configMapRef:
            name: qt-platform-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        startupProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 12
---
apiVersion: v1
kind: Service
metadata:
  name: qt-platform-app-service
spec:
  selector:
    app: qt-platform-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
# HPA 自动扩缩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: qt-platform-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: qt-platform-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 9.4 CI/CD 流水线（GitHub Actions）

```yaml
# .github/workflows/deploy.yml
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
  # ===== 代码质量检查 =====
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Java Lint
        run: mvn checkstyle:check spotbugs:check
      - name: Frontend Lint
        working-directory: qt-platform-web
        run: npm ci && npm run lint && npm run type-check

  # ===== 测试 =====
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

  # ===== 构建并推送镜像 =====
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

  # ===== 部署到生产环境 =====
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

## 十、监控与运维

### 10.1 监控体系

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'qt-platform-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['app:8080']
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 10.2 告警规则

```yaml
# prometheus/alert-rules.yml
groups:
  - name: 基础设施告警
    rules:
      - alert: CPU 使用率过高
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU 使用率超过 80%"

      - alert: 内存使用率过高
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
        for: 5m
        labels:
          severity: warning

      - alert: 磁盘使用率过高
        expr: (1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical

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

  - name: 数据库告警
    rules:
      - alert: PostgreSQL 连接数过高
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning

      - alert: Redis 内存使用率过高
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
```

### 10.3 日志管理

**日志格式规范**（Spring Boot 应用）：

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

**ELK Stack 日志收集流程**：

```
应用日志（JSON 格式）
    → Filebeat（采集 /app/logs/*.log）
    → Logstash（解析、过滤、转换）
    → Elasticsearch（存储、索引）
    → Kibana（可视化查询）
```

### 10.4 备份与灾备策略

| 组件 | 备份方式 | 频率 | 保留时间 | 恢复目标 |
|------|---------|------|---------|---------|
| **PostgreSQL** | pg_dump 全量备份 + WAL 归档 | 每日凌晨 2 点全量 + 实时 WAL | 全量 30 天，WAL 7 天 | RPO < 15 分钟 |
| **Redis** | RDB 快照 + AOF 日志 | RDB 每小时，AOF 实时 | 7 天 | RPO < 1 小时 |
| **文件存储** | rsync 增量同步到备份盘 | 每日 | 30 天 | RPO < 24 小时 |
| **应用配置** | Git 版本控制 | 每次变更 | 永久 | 即时 |
| **Docker 镜像** | GitHub Container Registry | 每次构建 | 最近 50 个版本 | 即时 |

**恢复目标**：RTO < 1 小时，RPO < 15 分钟

```bash
# PostgreSQL 自动备份脚本（crontab: 0 2 * * *）
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="qt_platform"

# 全量备份
pg_dump -Fc -h localhost -U qt_user $DB_NAME > "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

# 清理超过 30 天的备份
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# 上传到远程存储（腾讯云 COS）
# coscmd upload "$BACKUP_DIR/${DB_NAME}_${DATE}.dump" /backups/postgres/
```

---

## 十一、测试策略

### 11.1 测试金字塔

| 层级 | 工具 | 覆盖率目标 | 说明 |
|------|------|-----------|------|
| **单元测试** | JUnit 5 + Mockito | ≥ 80% | 核心业务逻辑、工具类 |
| **集成测试** | Spring Boot Test + Testcontainers | ≥ 60% | API 端到端、数据库交互 |
| **E2E 测试** | Cypress | 覆盖核心流程 | 登录、产品浏览、下载、管理后台 |
| **性能测试** | JMeter / k6 | — | 压力测试、负载测试 |
| **安全测试** | OWASP ZAP + Dependency-Check | — | 漏洞扫描、依赖安全 |

### 11.2 集成测试（Testcontainers）

```java
// 使用真实 PostgreSQL 而非 H2，避免 SQL 兼容问题
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

### 11.3 E2E 测试

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

## 十二、性能指标目标

### 12.1 前端性能

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 首屏加载时间 (FCP) | < 1.5 秒 | 首次内容绘制 |
| 最大内容绘制 (LCP) | < 2.5 秒 | Core Web Vitals |
| 首次输入延迟 (FID) | < 100 毫秒 | Core Web Vitals |
| 累积布局偏移 (CLS) | < 0.1 | Core Web Vitals |
| 页面可交互时间 (TTI) | < 3.5 秒 | — |

### 12.2 后端 API 性能

| 指标 | 目标值 |
|------|-------|
| 平均响应时间 | < 200 毫秒 |
| P95 响应时间 | < 500 毫秒 |
| P99 响应时间 | < 1000 毫秒 |
| 错误率 (5xx) | < 0.1% |
| 可用性 | > 99.9% |
| 初期并发用户数 | 1000 |
| 扩展后并发用户数 | 10000 |

### 12.3 数据库性能

| 指标 | 目标值 |
|------|-------|
| 查询响应时间 | < 100 毫秒 |
| 连接池利用率 | 60% – 80% |
| 缓存命中率 | > 90% |
| 慢查询比例 | < 1% |

### 12.4 文件下载性能

| 文件大小 | 目标时间 | 说明 |
|---------|---------|------|
| < 10 MB | < 5 秒 | 小型工具 |
| 10 – 100 MB | < 30 秒 | 中型应用 |
| 100 MB – 1 GB | < 5 分钟 | 大型应用（10Mbps 带宽） |

---

## 十三、项目管理

### 13.1 Git 分支策略

```
main            ← 生产环境，仅接受 release 和 hotfix 合并，自动部署
  │
  ├── develop   ← 开发主分支，接受 feature 合并，自动部署到测试环境
  │     │
  │     ├── feature/user-auth     ← 功能分支，完成后 PR 回 develop
  │     ├── feature/product-list
  │     └── feature/admin-panel
  │
  ├── release/1.0.0               ← 发布准备，完成后合并到 main + develop
  │
  └── hotfix/fix-login-bug        ← 紧急修复，完成后合并到 main + develop
```

### 13.2 代码规范

**后端**：
- 静态分析：SonarQube（集成到 CI）
- 代码规范：Checkstyle + Google Java Style
- 代码格式化：Spotless（自动格式化）
- 依赖安全：OWASP Dependency-Check
- 测试覆盖率：JaCoCo ≥ 80%

**前端**：
- 代码规范：ESLint + Airbnb 规则
- 代码格式化：Prettier
- 类型检查：TypeScript strict mode
- 提交检查：Husky + lint-staged
- 提交规范：Conventional Commits

### 13.3 API 文档

- Swagger / OpenAPI 3.0 自动生成
- 访问地址：`/swagger-ui.html`（仅开发 / 测试环境开放）
- 生产环境关闭 Swagger UI

---

## 十四、实施路线图

### 14.1 第一阶段：MVP 单体应用（12 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **第 1 – 2 周** | 环境搭建：IDEA + Docker + PostgreSQL + Redis；项目初始化：Spring Boot + React + Vite；代码规范配置；Git 仓库建立 | 可运行的空项目骨架 |
| **第 3 – 4 周** | 数据库设计落地；API 框架搭建（RESTful + Swagger）；Spring Security + JWT 认证 | 用户注册/登录可用 |
| **第 5 – 6 周** | 用户模块：注册/登录/GitHub OAuth/邮箱验证/密码找回；多语言切换 | 用户系统完整可用 |
| **第 7 – 8 周** | 产品模块：上传/展示/版本管理；下载模块：文件下载/断点续传/计数 | 产品发布和下载可用 |
| **第 9 – 10 周** | 评论模块：评论/评分/审核；后台管理：用户管理/产品审核/评论管理 | 评论和后台可用 |
| **第 11 – 12 周** | 前端现代化 UI 开发；响应式设计适配；Docker 容器化；腾讯云部署 | **MVP 上线** |

**里程碑 M1**：第 4 周 — 基础架构就绪
**里程碑 M2**：第 8 周 — 核心功能完成
**里程碑 M3**：第 12 周 — **MVP 版本上线**

### 14.2 第二阶段：微服务拆分与扩展（16 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **第 13 – 16 周** | 基础设施：Spring Cloud + Nacos + Gateway；文件服务拆分 + 腾讯云 COS 集成 + CDN | 文件服务独立运行 |
| **第 17 – 20 周** | 用户服务拆分；Redis 集群；OAuth 完善（预留微信/QQ） | 用户服务独立运行 |
| **第 21 – 24 周** | 支付服务拆分；微信/支付宝集成；订单系统；财务对账 | 支付系统可用 |
| **第 25 – 28 周** | 产品服务拆分；通知服务拆分；Elasticsearch 搜索集成；灰度发布 | 微服务架构基本完成 |

**里程碑 M4**：第 16 周 — 文件服务拆分完成
**里程碑 M5**：第 24 周 — 支付系统上线
**里程碑 M6**：第 28 周 — 微服务架构完成

### 14.3 第三阶段：完善与优化（12 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **第 29 – 32 周** | 统计服务；高级后台仪表盘；用户行为分析；业务报表 | 完整的数据分析 |
| **第 33 – 36 周** | 性能优化：缓存 + 读写分离 + CDN 全站加速；监控完善：Prometheus + Grafana + ELK | 性能达标 |
| **第 37 – 40 周** | Kubernetes 容器编排；自动扩缩容；灾备方案；多地域部署准备 | **生产级系统** |

**里程碑 M7**：第 36 周 — 性能优化完成
**里程碑 M8**：第 40 周 — **生产级系统上线**

---

## 十五、风险评估与成本估算

### 15.1 风险评估

| 风险 | 等级 | 影响 | 应对措施 |
|------|------|------|---------|
| 单人开发进度延迟 | 高 | 上线时间推迟 | MVP 功能优先级排序，砍掉非核心功能 |
| 大文件上传/下载稳定性 | 高 | 用户体验差 | 断点续传 + 校验重试 + 充分压测 |
| 第三方支付接入审批周期长 | 中 | 支付功能延迟 | 先上线捐赠模式，并行申请资质 |
| 安全漏洞 | 高 | 数据泄露/攻击 | 安全扫描自动化 + 定期渗透测试 |
| 腾讯云服务故障 | 低 | 服务中断 | 本地备份 + 多可用区部署 |
| 技术栈学习成本 | 中 | 开发效率低 | 选择熟悉的技术，逐步引入新技术 |
| 数据库性能瓶颈 | 中 | 响应变慢 | 读写分离 + 缓存 + 合理索引 |

### 15.2 腾讯云月度成本估算

#### MVP 阶段（最小化部署）

| 资源 | 规格 | 月费用（估算） |
|------|------|---------------|
| CVM 应用服务器 | 标准型 S5，2 核 4G | ¥ 200 |
| CVM 数据库服务器 | 标准型 S5，2 核 4G | ¥ 200 |
| 系统盘 | 50GB SSD × 2 | ¥ 40 |
| 数据盘 | 200GB SSD | ¥ 60 |
| 带宽 | 按流量计费，预估 100GB/月 | ¥ 80 |
| SSL 证书 | 免费型（Let's Encrypt） | ¥ 0 |
| 域名 | .com | ¥ 5 |
| **合计** | | **≈ ¥ 585 / 月** |

#### 生产阶段（扩展部署）

| 资源 | 规格 | 月费用（估算） |
|------|------|---------------|
| CVM 应用服务器 × 2 | 计算型 C6，4 核 8G | ¥ 1200 |
| CVM 数据库服务器 | 内存型 M6，8 核 16G | ¥ 1000 |
| CVM 缓存服务器 | 内存型 M6，4 核 8G | ¥ 600 |
| 系统盘 | 100GB SSD × 4 | ¥ 160 |
| 数据盘 | 1TB SSD | ¥ 300 |
| 负载均衡 CLB | 应用型 | ¥ 50 |
| 带宽 | 固定 10Mbps | ¥ 300 |
| 腾讯云 COS | 标准存储 500GB + 流量 | ¥ 100 |
| CDN | 按流量计费 | ¥ 200 |
| SSL 证书 | 腾讯云免费 DV 证书 | ¥ 0 |
| **合计** | | **≈ ¥ 3910 / 月** |

> 以上价格为估算，实际费用以腾讯云官网定价为准。可通过包年包月、预留实例等方式降低 30% – 50% 成本。

---

## 总结

本技术架构文档为 Qt 产品发布平台提供了完整的技术方案，涵盖以下核心内容：

1. **技术架构**：React + Spring Boot + PostgreSQL，渐进式微服务演进
2. **数据库设计**：18 张核心表，完整索引、约束、分区、触发器
3. **API 设计**：90+ RESTful 接口，覆盖前台、用户、管理后台全部功能
4. **安全设计**：JWT 双 Token + RBAC 权限 + CORS + 限流 + XSS/SQL 注入防护
5. **前端架构**：现代化设计规范 + 完整路由 + 响应式适配 + SEO
6. **缓存策略**：Redis 缓存 Key 规范 + 穿透/雪崩/击穿防护
7. **更新机制**：Qt 客户端自动更新 + 灰度发布 + 增量更新 + 断点续传
8. **部署架构**：Docker 多阶段构建 + Nginx + K8s + GitHub Actions CI/CD
9. **监控运维**：Prometheus 告警 + ELK 日志 + 备份灾备
10. **实施路线**：3 阶段 40 周，8 个里程碑，从 MVP 到生产级系统
