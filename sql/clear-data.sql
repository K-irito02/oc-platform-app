-- ============================================================
-- 数据库清理脚本
-- 用于清空所有业务数据，保留角色、权限、系统配置
-- 执行时间：部署到云服务器前
-- ============================================================

-- 开始事务
BEGIN;

-- 禁用外键约束检查
SET CONSTRAINTS ALL DEFERRED;

-- 清空业务数据表（按依赖关系顺序）
TRUNCATE TABLE site_feedback_likes CASCADE;
TRUNCATE TABLE site_feedbacks CASCADE;
TRUNCATE TABLE comment_likes CASCADE;
TRUNCATE TABLE product_comments CASCADE;
TRUNCATE TABLE product_ratings CASCADE;
TRUNCATE TABLE product_versions CASCADE;
TRUNCATE TABLE delta_updates CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE file_records CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE email_verifications CASCADE;
TRUNCATE TABLE captcha_records CASCADE;
TRUNCATE TABLE user_oauth_bindings CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE orders CASCADE;

-- 清空下载记录分区表
TRUNCATE TABLE download_records_2026_01;
TRUNCATE TABLE download_records_2026_02;
TRUNCATE TABLE download_records_2026_03;
TRUNCATE TABLE download_records_2026_04;
TRUNCATE TABLE download_records_2026_05;
TRUNCATE TABLE download_records_2026_06;

-- 重新创建超级管理员账号
-- 密码: Smg.2026 (BCrypt hash)
INSERT INTO users (username, email, password_hash, status, email_verified) VALUES
    ('KirLab', '3143285505@qq.com',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZG',
     'ACTIVE', TRUE)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    status = EXCLUDED.status,
    email_verified = EXCLUDED.email_verified;

-- 分配超级管理员角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'KirLab' AND r.code = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 提交事务
COMMIT;

-- 验证结果
SELECT 'Users count: ' || COUNT(*) FROM users;
SELECT 'Super admin: ' || username || ' (' || email || ')' FROM users WHERE username = 'KirLab';
