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
    avatar_url      VARCHAR(500),
    bio             VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'LOCKED')),
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
-- 验证码验证记录表
-- ============================================================
CREATE TABLE captcha_records (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT,
    ip_address    VARCHAR(45) NOT NULL,
    scene         VARCHAR(50) NOT NULL,
    ticket        VARCHAR(200),
    verify_result BOOLEAN NOT NULL,
    evil_level    INTEGER,
    fail_reason   VARCHAR(200),
    verify_service VARCHAR(50) NOT NULL DEFAULT 'cloudflare',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 验证码记录表索引
CREATE INDEX idx_captcha_records_user ON captcha_records(user_id);
CREATE INDEX idx_captcha_records_ip ON captcha_records(ip_address);
CREATE INDEX idx_captcha_records_created ON captcha_records(created_at DESC);
CREATE INDEX idx_captcha_records_scene ON captcha_records(scene);
CREATE INDEX idx_captcha_records_verify_service ON captcha_records(verify_service);

-- 验证码记录表注释
COMMENT ON TABLE captcha_records IS '验证码验证记录表';
COMMENT ON COLUMN captcha_records.id IS '主键ID';
COMMENT ON COLUMN captcha_records.user_id IS '用户ID（可为空，未登录时为空）';
COMMENT ON COLUMN captcha_records.ip_address IS '请求IP地址';
COMMENT ON COLUMN captcha_records.scene IS '验证场景：LOGIN-登录, REGISTER-注册, RESET_PASSWORD-重置密码, CHANGE_PASSWORD-修改密码, CHANGE_EMAIL-修改邮箱, COMMENT-评论, FEEDBACK-反馈';
COMMENT ON COLUMN captcha_records.ticket IS '验证票据';
COMMENT ON COLUMN captcha_records.verify_result IS '验证结果：true-成功, false-失败';
COMMENT ON COLUMN captcha_records.evil_level IS '恶意等级（由验证码服务返回）';
COMMENT ON COLUMN captcha_records.fail_reason IS '失败原因';
COMMENT ON COLUMN captcha_records.verify_service IS '验证服务提供商：cloudflare, tencent 等';
COMMENT ON COLUMN captcha_records.created_at IS '创建时间';

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
    developer_name  VARCHAR(255) NOT NULL DEFAULT 'Official',
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
    rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}',
    experience_rating_average DECIMAL(2,1) DEFAULT 0.0,
    experience_rating_count INTEGER DEFAULT 0,
    experience_rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}',
    latest_version  VARCHAR(50),
    display_versions JSONB,
    view_count      BIGINT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMPTZ,
    CONSTRAINT uk_product_name UNIQUE (name),
    CONSTRAINT uk_product_name_en UNIQUE (name_en)
);

COMMENT ON COLUMN products.developer_name IS '开发者名称';
COMMENT ON COLUMN products.latest_version IS '最新版本号';
COMMENT ON COLUMN products.experience_rating_average IS '体验评分平均值(来自评论)';
COMMENT ON COLUMN products.experience_rating_count IS '体验评分总数(来自评论)';
COMMENT ON COLUMN products.experience_rating_distribution IS '体验评分分布(来自评论)';
COMMENT ON COLUMN products.display_versions IS 'JSON mapping of platform+architecture to version ID for display. Format: {"PLATFORM_arch": versionId}';

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
    platform        VARCHAR(50) NOT NULL,
    architecture    VARCHAR(20) DEFAULT 'x64',
    min_os_version  VARCHAR(50),
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_url        VARCHAR(500),
    checksum_md5    VARCHAR(32),
    checksum_sha256 VARCHAR(64) NOT NULL,
    signature       TEXT,
    file_record_id  BIGINT,
    download_count  BIGINT DEFAULT 0,
    is_mandatory    BOOLEAN DEFAULT FALSE,
    is_latest       BOOLEAN DEFAULT FALSE,
    release_notes   TEXT,
    release_notes_en TEXT,
    status          VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'REVOKED')),
    rollout_percentage INTEGER DEFAULT 100
                    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    show_on_detail  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMPTZ,
    UNIQUE(product_id, version_number, platform, architecture)
);

COMMENT ON COLUMN product_versions.platform IS '操作系统平台，如 WINDOWS, MACOS, LINUX, ANDROID, IOS, WEB, CROSS_PLATFORM 或自定义值';
COMMENT ON COLUMN product_versions.architecture IS 'CPU 架构，如 x86, x64, arm64, universal 或自定义值';
COMMENT ON COLUMN product_versions.show_on_detail IS 'Whether to show this version on product detail page';

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
-- 产品评分表
-- ============================================================
CREATE TABLE product_ratings (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_product_user_rating UNIQUE(product_id, user_id)
);

CREATE INDEX idx_ratings_product ON product_ratings(product_id);
CREATE INDEX idx_ratings_user ON product_ratings(user_id);
CREATE INDEX idx_ratings_created ON product_ratings(created_at DESC);

COMMENT ON TABLE product_ratings IS '产品评分表';
COMMENT ON COLUMN product_ratings.rating IS '评分值(1-5)';

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
-- 网站留言反馈表
-- ============================================================
CREATE TABLE site_feedbacks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    parent_id   BIGINT REFERENCES site_feedbacks(id) ON DELETE CASCADE,
    contact     VARCHAR(100),
    content     TEXT NOT NULL,
    status      VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN')),
    ip_address  INET,
    like_count  INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_public   BOOLEAN DEFAULT true,
    email       VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedbacks_created_at ON site_feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_status ON site_feedbacks(status);
CREATE INDEX idx_feedbacks_parent_id ON site_feedbacks(parent_id);
CREATE INDEX idx_feedbacks_user_id ON site_feedbacks(user_id);
CREATE INDEX idx_feedbacks_is_public ON site_feedbacks(is_public);

-- ============================================================
-- 网站留言点赞表
-- ============================================================
CREATE TABLE site_feedback_likes (
    id          BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES site_feedbacks(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feedback_id, user_id)
);

CREATE INDEX idx_feedback_likes_feedback_id ON site_feedback_likes(feedback_id);
CREATE INDEX idx_feedback_likes_user_id ON site_feedback_likes(user_id);

COMMENT ON COLUMN site_feedbacks.parent_id IS '父留言ID，用于回复功能';
COMMENT ON COLUMN site_feedbacks.like_count IS '点赞数';
COMMENT ON COLUMN site_feedbacks.reply_count IS '回复数';
COMMENT ON COLUMN site_feedbacks.is_public IS '是否公开显示在留言板';
COMMENT ON COLUMN site_feedbacks.email IS '用户邮箱（选填，仅管理员可见）';
COMMENT ON TABLE site_feedback_likes IS '留言点赞表';

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

CREATE TRIGGER trigger_ratings_updated_at
    BEFORE UPDATE ON product_ratings
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
INSERT INTO users (username, email, password_hash, status, email_verified) VALUES
    ('KirLab', '3143285505@qq.com',
     '$2b$12$tH4WN5HN71TGIqpNy/MYj.1jC2UOCQEJcAWt1YNangzAD/xTjGR5K',
     'ACTIVE', TRUE);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'KirLab' AND r.code = 'SUPER_ADMIN';

-- 系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
    ('site.name',           '桐人创研',               '站点中文名称'),
    ('site.name_en',        'KiritoLab',             '站点英文名称'),
    ('site.description',    '免费提供个人开发的工具类应用程序', '站点描述'),
    ('site.logo',           '',                       '站点Logo图片URL'),
    ('site.favicon',        '',                       '浏览器标签页图标URL'),
    ('site.url',            'https://kiritolab.com',  '官网URL'),
    ('site.url_en',         'https://kiritolab.com',  'Website URL'),
    ('upload.max_file_size', '1073741824',            '最大上传文件大小（字节）'),
    ('comment.auto_approve', 'false',                 '评论是否自动通过审核'),
    ('register.enabled',     'true',                  '是否开放注册'),
    ('footer.beian',         '',                       '公安备案号（如：黔公网安备52010000000000号）'),
    ('footer.police_icon_url', '',                     '公安备案图标URL（留空使用默认图标）'),
    ('footer.icp',          '',                       'ICP备案号（如：黔ICP备12345678号-1）'),
    ('footer.holiday',      '',                       '节假日定制信息'),
    ('footer.holiday_en',   '',                       'Holiday Custom Message'),
    ('footer.quote',        '',                       '名人名言'),
    ('footer.quote_en',     '',                       'Famous Quote'),
    ('footer.quote_author', '',                       '名言作者'),
    ('footer.quote_author_en', '',                    'Quote Author'),
    ('email.sender_name',   '桐人创研',               '邮件发件人名称（中文）'),
    ('email.sender_name_en', 'KiritoLab',             '邮件发件人名称（英文）'),
    ('email.copyright',     '© 2026 桐人创研. 保留所有权利.', '邮件版权信息（中文）'),
    ('email.copyright_en',  '© 2026 KiritoLab. All rights reserved.', '邮件版权信息（英文）'),
    ('email.security_tip',  '如果这不是您本人的操作，请忽略此邮件。您的账户仍然安全。', '邮件安全提示（中文）'),
    ('email.security_tip_en', 'If you did not request this, please ignore this email. Your account is still secure.', '邮件安全提示（英文）'),
    ('social.github',       '',                       'GitHub 链接'),
    ('social.twitter',      '',                       'Twitter/X 链接'),
    ('social.linkedin',     '',                       'LinkedIn 链接'),
    ('social.weibo',        '',                       '微博链接'),
    ('social.wechat',       '',                       '微信公众号'),
    ('social.email',        '',                       '联系邮箱'),
    ('system.maintenance.enabled', 'false',           '系统维护模式开关'),
    ('system.maintenance.title', '系统维护中',         '维护页面标题'),
    ('system.maintenance.title_en', 'Under Maintenance', '维护页面标题（英文）'),
    ('system.maintenance.message', '系统正在进行升级维护，请稍后再试。', '维护说明'),
    ('system.maintenance.message_en', 'The system is under maintenance. Please try again later.', '维护说明（英文）'),
    ('system.maintenance.estimated_time', '',          '预计恢复时间'),
    ('platform_config',
     '{
       "platforms": [
         {"value": "WINDOWS", "label": "Windows", "labelEn": "Windows", "icon": "🪟", "architectures": ["x86", "x64", "arm64"], "enabled": true, "sortOrder": 1},
         {"value": "MACOS", "label": "macOS", "labelEn": "macOS", "icon": "🍎", "architectures": ["x64", "arm64", "universal"], "enabled": true, "sortOrder": 2},
         {"value": "LINUX", "label": "Linux", "labelEn": "Linux", "icon": "🐧", "architectures": ["x86", "x64", "arm64"], "enabled": true, "sortOrder": 3},
         {"value": "ANDROID", "label": "Android", "labelEn": "Android", "icon": "🤖", "architectures": ["arm64", "x86", "x64"], "enabled": true, "sortOrder": 4},
         {"value": "IOS", "label": "iOS", "labelEn": "iOS", "icon": "📱", "architectures": ["arm64", "x64"], "enabled": true, "sortOrder": 5},
         {"value": "WEB", "label": "Web", "labelEn": "Web", "icon": "🌐", "architectures": ["universal"], "enabled": true, "sortOrder": 6},
         {"value": "CROSS_PLATFORM", "label": "跨平台", "labelEn": "Cross Platform", "icon": "🔄", "architectures": ["universal"], "enabled": true, "sortOrder": 7}
       ],
       "architectures": [
         {"value": "x86", "label": "x86 (32位)", "labelEn": "x86 (32-bit)"},
         {"value": "x64", "label": "x64 (64位)", "labelEn": "x64 (64-bit)"},
         {"value": "arm64", "label": "ARM64", "labelEn": "ARM64"},
         {"value": "universal", "label": "通用", "labelEn": "Universal"}
       ],
       "allowCustomPlatform": true,
       "allowCustomArchitecture": true
     }',
     '平台和架构配置'),
    ('captcha.enabled', 'true', '验证码功能开关'),
    ('captcha.cloudflare.site_key', '', 'Cloudflare Turnstile Site Key'),
    ('captcha.cloudflare.secret_key', '', 'Cloudflare Turnstile Secret Key');

-- ============================================================
-- 数据库优化修复（2026-03-07）
-- ============================================================

-- 修复时间戳类型不一致
ALTER TABLE captcha_records 
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- ============================================================
-- 添加缺失的索引
-- ============================================================

-- 角色权限索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 邮箱验证码过期索引
CREATE INDEX IF NOT EXISTS idx_email_verify_expires ON email_verifications(expires_at);

-- 分类表索引
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- 权限表索引
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- 产品版本表复合索引
CREATE INDEX IF NOT EXISTS idx_versions_product_number ON product_versions(product_id, version_number);

-- 增量更新表索引
CREATE INDEX IF NOT EXISTS idx_delta_updates_product ON delta_updates(product_id);

-- 网站反馈表优化索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_list ON site_feedbacks(status, is_public, created_at DESC);

-- 产品版本表 is_latest 唯一约束（部分索引）
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_latest_unique ON product_versions(product_id, platform, architecture)
    WHERE is_latest = TRUE;

-- ============================================================
-- 添加缺失的 updated_at 触发器
-- ============================================================

-- 为 user_oauth_bindings 表添加 updated_at 触发器
CREATE TRIGGER trigger_oauth_bindings_updated_at
    BEFORE UPDATE ON user_oauth_bindings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 site_feedbacks 表添加 updated_at 触发器
CREATE TRIGGER trigger_site_feedbacks_updated_at
    BEFORE UPDATE ON site_feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 添加表和字段注释
-- ============================================================

-- 用户表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '主键ID';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.email IS '邮箱地址';
COMMENT ON COLUMN users.password_hash IS '密码哈希值';
COMMENT ON COLUMN users.avatar_url IS '头像URL';
COMMENT ON COLUMN users.bio IS '个人简介';
COMMENT ON COLUMN users.status IS '用户状态：ACTIVE-活跃, INACTIVE-未激活, BANNED-已封禁, LOCKED-已锁定';
COMMENT ON COLUMN users.language IS '语言偏好';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.last_login_ip IS '最后登录IP';
COMMENT ON COLUMN users.theme_config IS '主题配置JSON';

-- 角色表注释
COMMENT ON TABLE roles IS '角色表';
COMMENT ON COLUMN roles.id IS '主键ID';
COMMENT ON COLUMN roles.code IS '角色代码';
COMMENT ON COLUMN roles.name IS '角色名称';
COMMENT ON COLUMN roles.description IS '角色描述';
COMMENT ON COLUMN roles.created_at IS '创建时间';

-- 用户角色关联表注释
COMMENT ON TABLE user_roles IS '用户角色关联表';
COMMENT ON COLUMN user_roles.id IS '主键ID';
COMMENT ON COLUMN user_roles.user_id IS '用户ID';
COMMENT ON COLUMN user_roles.role_id IS '角色ID';

-- 权限表注释
COMMENT ON TABLE permissions IS '权限表';
COMMENT ON COLUMN permissions.id IS '主键ID';
COMMENT ON COLUMN permissions.code IS '权限代码';
COMMENT ON COLUMN permissions.name IS '权限名称';
COMMENT ON COLUMN permissions.description IS '权限描述';

-- 角色权限关联表注释
COMMENT ON TABLE role_permissions IS '角色权限关联表';
COMMENT ON COLUMN role_permissions.id IS '主键ID';
COMMENT ON COLUMN role_permissions.role_id IS '角色ID';
COMMENT ON COLUMN role_permissions.permission_id IS '权限ID';

-- 第三方登录绑定表注释
COMMENT ON TABLE user_oauth_bindings IS '第三方登录绑定表';
COMMENT ON COLUMN user_oauth_bindings.id IS '主键ID';
COMMENT ON COLUMN user_oauth_bindings.user_id IS '用户ID';
COMMENT ON COLUMN user_oauth_bindings.oauth_provider IS 'OAuth提供商：github, google, wechat等';
COMMENT ON COLUMN user_oauth_bindings.oauth_id IS 'OAuth用户ID';
COMMENT ON COLUMN user_oauth_bindings.oauth_username IS 'OAuth用户名';
COMMENT ON COLUMN user_oauth_bindings.oauth_avatar IS 'OAuth头像URL';
COMMENT ON COLUMN user_oauth_bindings.access_token IS '访问令牌';
COMMENT ON COLUMN user_oauth_bindings.refresh_token IS '刷新令牌';
COMMENT ON COLUMN user_oauth_bindings.expires_at IS '令牌过期时间';
COMMENT ON COLUMN user_oauth_bindings.created_at IS '创建时间';
COMMENT ON COLUMN user_oauth_bindings.updated_at IS '更新时间';

-- 邮箱验证码表注释
COMMENT ON TABLE email_verifications IS '邮箱验证码表';
COMMENT ON COLUMN email_verifications.id IS '主键ID';
COMMENT ON COLUMN email_verifications.email IS '邮箱地址';
COMMENT ON COLUMN email_verifications.code IS '验证码';
COMMENT ON COLUMN email_verifications.type IS '验证类型：REGISTER-注册, RESET_PASSWORD-重置密码, CHANGE_EMAIL-修改邮箱';
COMMENT ON COLUMN email_verifications.is_used IS '是否已使用';
COMMENT ON COLUMN email_verifications.expires_at IS '过期时间';
COMMENT ON COLUMN email_verifications.created_at IS '创建时间';

-- 产品分类表注释
COMMENT ON TABLE categories IS '产品分类表';
COMMENT ON COLUMN categories.id IS '主键ID';
COMMENT ON COLUMN categories.name IS '分类名称（中文）';
COMMENT ON COLUMN categories.name_en IS '分类名称（英文）';
COMMENT ON COLUMN categories.slug IS 'URL友好标识';
COMMENT ON COLUMN categories.parent_id IS '父分类ID';
COMMENT ON COLUMN categories.sort_order IS '排序序号';
COMMENT ON COLUMN categories.icon IS '分类图标';
COMMENT ON COLUMN categories.created_at IS '创建时间';

-- 产品表注释
COMMENT ON TABLE products IS '产品表';
COMMENT ON COLUMN products.id IS '主键ID';
COMMENT ON COLUMN products.name IS '产品名称（中文）';
COMMENT ON COLUMN products.name_en IS '产品名称（英文）';
COMMENT ON COLUMN products.slug IS 'URL友好标识';
COMMENT ON COLUMN products.description IS '产品描述（中文）';
COMMENT ON COLUMN products.description_en IS '产品描述（英文）';
COMMENT ON COLUMN products.category_id IS '分类ID';
COMMENT ON COLUMN products.developer_id IS '开发者用户ID';
COMMENT ON COLUMN products.status IS '产品状态：DRAFT-草稿, PENDING-待审核, PUBLISHED-已发布, SUSPENDED-已暂停, ARCHIVED-已归档';
COMMENT ON COLUMN products.icon_url IS '产品图标URL';
COMMENT ON COLUMN products.banner_url IS '产品横幅URL';
COMMENT ON COLUMN products.screenshots IS '产品截图JSON数组';
COMMENT ON COLUMN products.demo_video_url IS '演示视频URL';
COMMENT ON COLUMN products.homepage_url IS '主页URL';
COMMENT ON COLUMN products.source_url IS '源码URL';
COMMENT ON COLUMN products.license IS '许可证类型';
COMMENT ON COLUMN products.download_count IS '下载次数';
COMMENT ON COLUMN products.rating_average IS '评分平均值';
COMMENT ON COLUMN products.rating_count IS '评分总数';
COMMENT ON COLUMN products.rating_distribution IS '评分分布JSON';
COMMENT ON COLUMN products.view_count IS '浏览次数';
COMMENT ON COLUMN products.is_featured IS '是否推荐';
COMMENT ON COLUMN products.tags IS '标签数组';
COMMENT ON COLUMN products.created_at IS '创建时间';
COMMENT ON COLUMN products.updated_at IS '更新时间';
COMMENT ON COLUMN products.published_at IS '发布时间';

-- 产品版本表注释
COMMENT ON TABLE product_versions IS '产品版本表';
COMMENT ON COLUMN product_versions.id IS '主键ID';
COMMENT ON COLUMN product_versions.product_id IS '产品ID';
COMMENT ON COLUMN product_versions.version_number IS '版本号';
COMMENT ON COLUMN product_versions.version_code IS '版本代码（数字）';
COMMENT ON COLUMN product_versions.version_type IS '版本类型：ALPHA, BETA, RC, RELEASE';
COMMENT ON COLUMN product_versions.min_os_version IS '最低操作系统版本';
COMMENT ON COLUMN product_versions.file_name IS '文件名';
COMMENT ON COLUMN product_versions.file_size IS '文件大小（字节）';
COMMENT ON COLUMN product_versions.file_path IS '文件存储路径';
COMMENT ON COLUMN product_versions.file_url IS '文件下载URL';
COMMENT ON COLUMN product_versions.checksum_md5 IS 'MD5校验和';
COMMENT ON COLUMN product_versions.checksum_sha256 IS 'SHA256校验和';
COMMENT ON COLUMN product_versions.signature IS '数字签名';
COMMENT ON COLUMN product_versions.file_record_id IS '文件记录ID';
COMMENT ON COLUMN product_versions.download_count IS '下载次数';
COMMENT ON COLUMN product_versions.is_mandatory IS '是否强制更新';
COMMENT ON COLUMN product_versions.is_latest IS '是否最新版本';
COMMENT ON COLUMN product_versions.release_notes IS '发布说明（中文）';
COMMENT ON COLUMN product_versions.release_notes_en IS '发布说明（英文）';
COMMENT ON COLUMN product_versions.status IS '版本状态：DRAFT-草稿, PENDING-待审核, PUBLISHED-已发布, REVOKED-已撤销';
COMMENT ON COLUMN product_versions.rollout_percentage IS '灰度发布百分比（0-100）';
COMMENT ON COLUMN product_versions.created_at IS '创建时间';
COMMENT ON COLUMN product_versions.published_at IS '发布时间';

-- 增量更新包表注释
COMMENT ON TABLE delta_updates IS '增量更新包表';
COMMENT ON COLUMN delta_updates.id IS '主键ID';
COMMENT ON COLUMN delta_updates.product_id IS '产品ID';
COMMENT ON COLUMN delta_updates.from_version_id IS '源版本ID';
COMMENT ON COLUMN delta_updates.to_version_id IS '目标版本ID';
COMMENT ON COLUMN delta_updates.platform IS '操作系统平台';
COMMENT ON COLUMN delta_updates.architecture IS 'CPU架构';
COMMENT ON COLUMN delta_updates.file_name IS '文件名';
COMMENT ON COLUMN delta_updates.file_size IS '文件大小（字节）';
COMMENT ON COLUMN delta_updates.file_path IS '文件存储路径';
COMMENT ON COLUMN delta_updates.checksum_sha256 IS 'SHA256校验和';
COMMENT ON COLUMN delta_updates.created_at IS '创建时间';

-- 评论表注释
COMMENT ON TABLE product_comments IS '产品评论表';
COMMENT ON COLUMN product_comments.id IS '主键ID';
COMMENT ON COLUMN product_comments.product_id IS '产品ID';
COMMENT ON COLUMN product_comments.user_id IS '用户ID';
COMMENT ON COLUMN product_comments.parent_id IS '父评论ID';
COMMENT ON COLUMN product_comments.content IS '评论内容';
COMMENT ON COLUMN product_comments.rating IS '评分（1-5）';
COMMENT ON COLUMN product_comments.status IS '评论状态：PENDING-待审核, PUBLISHED-已发布, REJECTED-已拒绝, HIDDEN-已隐藏';
COMMENT ON COLUMN product_comments.like_count IS '点赞数';
COMMENT ON COLUMN product_comments.reply_count IS '回复数';
COMMENT ON COLUMN product_comments.ip_address IS 'IP地址';
COMMENT ON COLUMN product_comments.created_at IS '创建时间';
COMMENT ON COLUMN product_comments.updated_at IS '更新时间';

-- 评论点赞表注释
COMMENT ON TABLE comment_likes IS '评论点赞表';
COMMENT ON COLUMN comment_likes.id IS '主键ID';
COMMENT ON COLUMN comment_likes.comment_id IS '评论ID';
COMMENT ON COLUMN comment_likes.user_id IS '用户ID';
COMMENT ON COLUMN comment_likes.created_at IS '创建时间';

-- 系统通知表注释
COMMENT ON TABLE notifications IS '系统通知表';
COMMENT ON COLUMN notifications.id IS '主键ID';
COMMENT ON COLUMN notifications.user_id IS '用户ID';
COMMENT ON COLUMN notifications.type IS '通知类型';
COMMENT ON COLUMN notifications.title IS '通知标题';
COMMENT ON COLUMN notifications.content IS '通知内容';
COMMENT ON COLUMN notifications.link IS '相关链接';
COMMENT ON COLUMN notifications.is_read IS '是否已读';
COMMENT ON COLUMN notifications.created_at IS '创建时间';

-- 下载记录表注释
COMMENT ON TABLE download_records IS '下载记录表（按月分区）';
COMMENT ON COLUMN download_records.id IS '主键ID';
COMMENT ON COLUMN download_records.product_id IS '产品ID';
COMMENT ON COLUMN download_records.version_id IS '版本ID';
COMMENT ON COLUMN download_records.user_id IS '用户ID';
COMMENT ON COLUMN download_records.ip_address IS 'IP地址';
COMMENT ON COLUMN download_records.user_agent IS '用户代理';
COMMENT ON COLUMN download_records.country IS '国家代码';
COMMENT ON COLUMN download_records.region IS '地区';
COMMENT ON COLUMN download_records.download_at IS '下载时间';
COMMENT ON COLUMN download_records.is_completed IS '是否完成下载';
COMMENT ON COLUMN download_records.file_size IS '文件大小（字节）';

-- 用户访问日志表注释
COMMENT ON TABLE user_access_logs IS '用户访问日志表（按月分区）';
COMMENT ON COLUMN user_access_logs.id IS '主键ID';
COMMENT ON COLUMN user_access_logs.user_id IS '用户ID';
COMMENT ON COLUMN user_access_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN user_access_logs.user_agent IS '用户代理';
COMMENT ON COLUMN user_access_logs.request_method IS '请求方法';
COMMENT ON COLUMN user_access_logs.request_path IS '请求路径';
COMMENT ON COLUMN user_access_logs.query_string IS '查询字符串';
COMMENT ON COLUMN user_access_logs.response_status IS '响应状态码';
COMMENT ON COLUMN user_access_logs.response_time IS '响应时间（毫秒）';
COMMENT ON COLUMN user_access_logs.country IS '国家代码';
COMMENT ON COLUMN user_access_logs.referer IS '来源页面';
COMMENT ON COLUMN user_access_logs.created_at IS '创建时间';

-- 系统配置表注释
COMMENT ON TABLE system_configs IS '系统配置表';
COMMENT ON COLUMN system_configs.id IS '主键ID';
COMMENT ON COLUMN system_configs.config_key IS '配置键';
COMMENT ON COLUMN system_configs.config_value IS '配置值';
COMMENT ON COLUMN system_configs.description IS '配置描述';
COMMENT ON COLUMN system_configs.updated_by IS '更新者用户ID';
COMMENT ON COLUMN system_configs.updated_at IS '更新时间';

-- 文件管理表注释
COMMENT ON TABLE file_records IS '文件管理表';
COMMENT ON COLUMN file_records.id IS '主键ID';
COMMENT ON COLUMN file_records.original_name IS '原始文件名';
COMMENT ON COLUMN file_records.stored_name IS '存储文件名';
COMMENT ON COLUMN file_records.file_path IS '文件存储路径';
COMMENT ON COLUMN file_records.file_size IS '文件大小（字节）';
COMMENT ON COLUMN file_records.mime_type IS 'MIME类型';
COMMENT ON COLUMN file_records.checksum_sha256 IS 'SHA256校验和';
COMMENT ON COLUMN file_records.storage_type IS '存储类型：LOCAL-本地, MINIO-MinIO, COS-腾讯云COS';
COMMENT ON COLUMN file_records.bucket_name IS '存储桶名称';
COMMENT ON COLUMN file_records.file_url IS '文件访问URL';
COMMENT ON COLUMN file_records.uploaded_by IS '上传者用户ID';
COMMENT ON COLUMN file_records.created_at IS '创建时间';

-- 操作审计日志表注释
COMMENT ON TABLE audit_logs IS '操作审计日志表';
COMMENT ON COLUMN audit_logs.id IS '主键ID';
COMMENT ON COLUMN audit_logs.user_id IS '用户ID';
COMMENT ON COLUMN audit_logs.action IS '操作动作';
COMMENT ON COLUMN audit_logs.target_type IS '目标类型';
COMMENT ON COLUMN audit_logs.target_id IS '目标ID';
COMMENT ON COLUMN audit_logs.detail IS '操作详情JSON';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN audit_logs.created_at IS '创建时间';

-- 多语言内容表注释
COMMENT ON TABLE i18n_messages IS '多语言内容表';
COMMENT ON COLUMN i18n_messages.id IS '主键ID';
COMMENT ON COLUMN i18n_messages.language_code IS '语言代码';
COMMENT ON COLUMN i18n_messages.message_key IS '消息键';
COMMENT ON COLUMN i18n_messages.message_value IS '消息值';
COMMENT ON COLUMN i18n_messages.module IS '所属模块';
COMMENT ON COLUMN i18n_messages.created_at IS '创建时间';
COMMENT ON COLUMN i18n_messages.updated_at IS '更新时间';

-- 网站留言反馈表注释
COMMENT ON TABLE site_feedbacks IS '网站留言反馈表';
COMMENT ON COLUMN site_feedbacks.id IS '主键ID';
COMMENT ON COLUMN site_feedbacks.user_id IS '用户ID';
COMMENT ON COLUMN site_feedbacks.contact IS '联系方式';
COMMENT ON COLUMN site_feedbacks.content IS '留言内容';
COMMENT ON COLUMN site_feedbacks.status IS '状态：PENDING-待审核, PUBLISHED-已发布, REJECTED-已拒绝, HIDDEN-已隐藏';
COMMENT ON COLUMN site_feedbacks.ip_address IS 'IP地址';
COMMENT ON COLUMN site_feedbacks.is_public IS '是否公开显示';
COMMENT ON COLUMN site_feedbacks.created_at IS '创建时间';
COMMENT ON COLUMN site_feedbacks.updated_at IS '更新时间';

-- 订单表注释
COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.id IS '主键ID';
COMMENT ON COLUMN orders.order_no IS '订单号';
COMMENT ON COLUMN orders.user_id IS '用户ID';
COMMENT ON COLUMN orders.product_id IS '产品ID';
COMMENT ON COLUMN orders.order_type IS '订单类型：DONATION-捐赠, SUBSCRIPTION-订阅, PURCHASE-购买';
COMMENT ON COLUMN orders.amount IS '订单金额';
COMMENT ON COLUMN orders.currency IS '货币类型';
COMMENT ON COLUMN orders.payment_method IS '支付方式';
COMMENT ON COLUMN orders.payment_status IS '支付状态：PENDING-待支付, PAID-已支付, FAILED-支付失败, REFUNDED-已退款, EXPIRED-已过期';
COMMENT ON COLUMN orders.trade_no IS '交易号';
COMMENT ON COLUMN orders.payment_at IS '支付时间';
COMMENT ON COLUMN orders.expires_at IS '过期时间';
COMMENT ON COLUMN orders.refund_reason IS '退款原因';
COMMENT ON COLUMN orders.remark IS '备注';
COMMENT ON COLUMN orders.created_at IS '创建时间';
COMMENT ON COLUMN orders.updated_at IS '更新时间';

-- VIP会员订阅表注释
COMMENT ON TABLE subscriptions IS 'VIP会员订阅表';
COMMENT ON COLUMN subscriptions.id IS '主键ID';
COMMENT ON COLUMN subscriptions.user_id IS '用户ID';
COMMENT ON COLUMN subscriptions.plan_type IS '订阅类型：MONTHLY-月度, QUARTERLY-季度, YEARLY-年度';
COMMENT ON COLUMN subscriptions.status IS '订阅状态：ACTIVE-有效, EXPIRED-已过期, CANCELLED-已取消';
COMMENT ON COLUMN subscriptions.start_at IS '开始时间';
COMMENT ON COLUMN subscriptions.expire_at IS '过期时间';
COMMENT ON COLUMN subscriptions.auto_renew IS '是否自动续费';
COMMENT ON COLUMN subscriptions.order_id IS '订单ID';
COMMENT ON COLUMN subscriptions.created_at IS '创建时间';
COMMENT ON COLUMN subscriptions.updated_at IS '更新时间';
