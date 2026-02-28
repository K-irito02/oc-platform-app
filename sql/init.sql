-- ============================================================
-- Qt 产品发布平台 - 数据库初始化脚本
-- Phase One MVP
-- ============================================================

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    language        VARCHAR(10) DEFAULT 'zh-CN',
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   VARCHAR(45),
    theme_config    TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- 角色表
-- ============================================================
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,
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
    code        VARCHAR(100) UNIQUE NOT NULL,
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
    oauth_provider VARCHAR(50) NOT NULL,
    oauth_id       VARCHAR(200) NOT NULL,
    oauth_username VARCHAR(200),
    oauth_avatar   VARCHAR(500),
    access_token   TEXT,
    refresh_token  TEXT,
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
    type       VARCHAR(30) NOT NULL,
    is_used    BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verify ON email_verifications(email, type);

-- ============================================================
-- 产品分类表
-- ============================================================
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),
    slug        VARCHAR(100) UNIQUE NOT NULL,
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
    name_en         VARCHAR(200),
    slug            VARCHAR(200) UNIQUE NOT NULL,
    description     TEXT,
    description_en  TEXT,
    category_id     BIGINT REFERENCES categories(id),
    developer_id    BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED')),
    icon_url        VARCHAR(500),
    banner_url      VARCHAR(500),
    screenshots     JSONB DEFAULT '[]',
    demo_video_url  VARCHAR(500),
    homepage_url    VARCHAR(500),
    source_url      VARCHAR(500),
    license         VARCHAR(100),
    download_count  BIGINT DEFAULT 0,
    rating_average  DECIMAL(2,1) DEFAULT 0.0,
    rating_count    INTEGER DEFAULT 0,
    view_count      BIGINT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMPTZ,
    CONSTRAINT uk_product_name UNIQUE (name),
    CONSTRAINT uk_product_name_en UNIQUE (name_en)
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
    version_number  VARCHAR(50) NOT NULL,
    version_code    INTEGER,
    version_type    VARCHAR(20) DEFAULT 'RELEASE'
                    CHECK (version_type IN ('ALPHA', 'BETA', 'RC', 'RELEASE')),
    platform        VARCHAR(50) NOT NULL
                    CHECK (platform IN ('WINDOWS', 'LINUX', 'MACOS')),
    architecture    VARCHAR(20) DEFAULT 'x64'
                    CHECK (architecture IN ('x86', 'x64', 'arm64')),
    min_os_version  VARCHAR(50),
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_url        VARCHAR(500),
    checksum_md5    VARCHAR(32),
    checksum_sha256 VARCHAR(64) NOT NULL,
    signature       TEXT,
    download_count  BIGINT DEFAULT 0,
    is_mandatory    BOOLEAN DEFAULT FALSE,
    is_latest       BOOLEAN DEFAULT FALSE,
    release_notes   TEXT,
    release_notes_en TEXT,
    status          VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'REVOKED')),
    rollout_percentage INTEGER DEFAULT 100
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

-- ============================================================
-- 评论表
-- ============================================================
CREATE TABLE product_comments (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    parent_id   BIGINT REFERENCES product_comments(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
    status      VARCHAR(20) DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN')),
    like_count  INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_product ON product_comments(product_id, status);
CREATE INDEX idx_comments_user ON product_comments(user_id);
CREATE INDEX idx_comments_parent ON product_comments(parent_id);

-- ============================================================
-- 评论点赞表
-- ============================================================
CREATE TABLE comment_likes (
    id         BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- ============================================================
-- 系统通知表
-- ============================================================
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    link        VARCHAR(500),
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 下载记录表（按月分区）
-- ============================================================
CREATE TABLE download_records (
    id           BIGSERIAL,
    product_id   BIGINT NOT NULL,
    version_id   BIGINT,
    user_id      BIGINT,
    ip_address   INET,
    user_agent   TEXT,
    country      VARCHAR(10),
    region       VARCHAR(100),
    download_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    file_size    BIGINT,
    PRIMARY KEY (id, download_at)
) PARTITION BY RANGE (download_at);

CREATE TABLE download_records_2026_01 PARTITION OF download_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE download_records_2026_02 PARTITION OF download_records
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE download_records_2026_03 PARTITION OF download_records
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE download_records_2026_04 PARTITION OF download_records
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE download_records_2026_05 PARTITION OF download_records
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE download_records_2026_06 PARTITION OF download_records
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX idx_downloads_product ON download_records(product_id, download_at DESC);
CREATE INDEX idx_downloads_user ON download_records(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 用户访问日志表（按月分区）
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
    response_time   INTEGER,
    country         VARCHAR(10),
    referer         VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

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
                    CHECK (storage_type IN ('LOCAL', 'MINIO', 'COS')),
    bucket_name     VARCHAR(100),
    file_url        VARCHAR(1000),
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
    action       VARCHAR(100) NOT NULL,
    target_type  VARCHAR(50),
    target_id    BIGINT,
    detail       JSONB,
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

-- ============================================================
-- updated_at 自动更新触发器
-- ============================================================
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

-- ============================================================
-- 初始化数据
-- ============================================================

-- 角色
INSERT INTO roles (code, name, description) VALUES
    ('ANONYMOUS',   '匿名用户',   '未登录访客，可浏览和下载'),
    ('USER',        '普通用户',   '已注册用户，可评论和评分'),
    ('VIP',         'VIP 用户',   '付费用户，优先下载和专属内容'),
    ('ADMIN',       '管理员',     '内容审核和用户管理'),
    ('SUPER_ADMIN', '超级管理员', '系统配置和权限管理');

-- 权限
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

-- 超级管理员账号（密码: Admin@123456）
INSERT INTO users (username, email, password_hash, nickname, status, email_verified) VALUES
    ('admin', 'admin@qtplatform.com',
     '$2b$12$tH4WN5HN71TGIqpNy/MYj.1jC2UOCQEJcAWt1YNangzAD/xTjGR5K',
     '超级管理员', 'ACTIVE', TRUE);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.code = 'SUPER_ADMIN';

-- 系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
    ('site.name',           '桐人创研',               '站点中文名称'),
    ('site.name_en',        'KiritoLab',             '站点英文名称'),
    ('site.description',    '免费提供个人开发的工具类应用程序', '站点描述'),
    ('site.logo',           '',                       '站点Logo图片URL'),
    ('upload.max_file_size', '1073741824',            '最大上传文件大小（字节）'),
    ('comment.auto_approve', 'false',                 '评论是否自动通过审核'),
    ('register.enabled',     'true',                  '是否开放注册');
