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
     '平台和架构配置');
