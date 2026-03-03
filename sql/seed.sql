-- ============================================================
-- 产品发布平台 - 种子数据
-- 在 init.sql 执行之后运行，用于填充测试数据
-- ============================================================

-- ============================================================
-- 测试用户（密码统一为: Test@123456）
-- BCrypt hash: $2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC
-- ============================================================
INSERT INTO users (username, email, password_hash, nickname, bio, status, email_verified) VALUES
    ('zhangsan',   'zhangsan@example.com',
     '$2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC',
     '张三', 'Qt 爱好者，擅长跨平台开发', 'ACTIVE', TRUE),
    ('lisi',       'lisi@example.com',
     '$2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC',
     '李四', '独立开发者，专注桌面应用', 'ACTIVE', TRUE),
    ('wangwu',     'wangwu@example.com',
     '$2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC',
     '王五', 'VIP 用户，资深 Qt 开发', 'ACTIVE', TRUE),
    ('dev_chen',   'chen@example.com',
     '$2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC',
     '陈开发', '热爱开源', 'ACTIVE', TRUE),
    ('test_banned','banned@example.com',
     '$2b$12$t9YofVximKdPlmvHnnuquewhr8PJYgZJXLA1AWyahUTMGlZHCr4pC',
     '被封禁用户', '', 'BANNED', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 分配角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'zhangsan' AND r.code = 'USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'lisi' AND r.code = 'USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'wangwu' AND r.code IN ('USER', 'VIP')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'dev_chen' AND r.code = 'USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'test_banned' AND r.code = 'USER'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 产品分类
-- ============================================================
INSERT INTO categories (name, name_en, slug, icon, sort_order) VALUES
    ('开发工具', 'Dev Tools',   'dev-tools',   '🛠️', 1),
    ('图形图像', 'Graphics',    'graphics',    '🎨', 2),
    ('网络通信', 'Network',     'network',     '🌐', 3),
    ('多媒体',   'Multimedia',  'multimedia',  '🎵', 4),
    ('系统工具', 'System',      'system',      '⚙️', 5),
    ('教育学习', 'Education',   'education',   '📚', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 产品数据
-- ============================================================
INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, homepage_url, source_url, published_at)
SELECT
    'QtCreator Pro', 'qtcreator-pro',
    '一款增强版的 Qt 开发环境，支持智能代码补全、实时预览、多项目管理和内置版本控制，为 Qt 开发者提供极致的编码体验。',
    c.id, u.id, 'PUBLISHED', 15680, 4.7, 234, 45230, TRUE, 'GPL-3.0',
    'https://example.com/qtcreator-pro', 'https://github.com/example/qtcreator-pro',
    NOW() - INTERVAL '5 months'
FROM categories c, users u
WHERE c.slug = 'dev-tools' AND u.username = 'zhangsan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, source_url, published_at)
SELECT
    '墨笔绘图', 'ink-draw',
    '基于 Qt 的专业矢量绘图工具，支持水墨风格笔刷、图层管理、SVG 导出，适合数字艺术创作和 UI 设计。',
    c.id, u.id, 'PUBLISHED', 8920, 4.5, 156, 28450, TRUE, 'MIT',
    '', NOW() - INTERVAL '4 months'
FROM categories c, users u
WHERE c.slug = 'graphics' AND u.username = 'lisi'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, source_url, published_at)
SELECT
    'NetMonitor', 'net-monitor',
    '轻量级网络监控工具，实时显示网络流量、连接状态和带宽使用，支持 TCP/UDP/HTTP 协议分析。',
    c.id, u.id, 'PUBLISHED', 6340, 4.2, 89, 19800, TRUE, 'Apache-2.0',
    'https://github.com/example/netmonitor', NOW() - INTERVAL '3 months'
FROM categories c, users u
WHERE c.slug = 'network' AND u.username = 'wangwu'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, homepage_url, published_at)
SELECT
    'MusicBox', 'music-box',
    '跨平台音乐播放器，支持无损音频格式、均衡器调节、歌词同步显示和播放列表管理。',
    c.id, u.id, 'PUBLISHED', 12450, 4.6, 198, 35600, TRUE, 'LGPL-3.0',
    'https://example.com/musicbox', NOW() - INTERVAL '4 months'
FROM categories c, users u
WHERE c.slug = 'multimedia' AND u.username = 'dev_chen'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, published_at)
SELECT
    'SysInfo', 'sys-info',
    '系统信息查看器，展示 CPU、内存、磁盘、GPU 等硬件详情和实时使用率，支持导出报告。',
    c.id, u.id, 'PUBLISHED', 4280, 4.0, 67, 14500, FALSE, 'MIT',
    NOW() - INTERVAL '2 months'
FROM categories c, users u
WHERE c.slug = 'system' AND u.username = 'zhangsan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, source_url, published_at)
SELECT
    'CodeTeach', 'code-teach',
    '编程教学辅助工具，集成代码编辑器、实时运行和互动练习，适合 C++/Qt 入门教学。',
    c.id, u.id, 'PUBLISHED', 3150, 4.3, 45, 11200, FALSE, 'GPL-3.0',
    'https://github.com/example/codeteach', NOW() - INTERVAL '2 months'
FROM categories c, users u
WHERE c.slug = 'education' AND u.username = 'lisi'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, rating_average, rating_count, view_count, is_featured, license, published_at)
SELECT
    'FileSync Pro', 'filesync-pro',
    '高效文件同步工具，支持增量同步、冲突检测、多端协同，基于 Qt 网络库构建。',
    c.id, u.id, 'PUBLISHED', 5670, 4.4, 112, 20100, FALSE, 'MIT',
    NOW() - INTERVAL '1 month'
FROM categories c, users u
WHERE c.slug = 'network' AND u.username = 'wangwu'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, category_id, developer_id, status, download_count, view_count, is_featured, license)
SELECT
    'PixelEditor', 'pixel-editor',
    '像素画编辑器，支持多图层、动画帧编辑、自定义调色板，适合游戏美术和像素艺术创作。',
    c.id, u.id, 'PENDING', 0, 340, FALSE, 'MIT'
FROM categories c, users u
WHERE c.slug = 'graphics' AND u.username = 'dev_chen'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 产品版本
-- ============================================================
INSERT INTO product_versions (product_id, version_number, version_code, version_type, platform, architecture, file_name, file_path, file_size, checksum_sha256, download_count, is_mandatory, is_latest, release_notes, status, rollout_percentage, published_at)
SELECT p.id, '2.1.0', 210, 'RELEASE', 'WINDOWS', 'x64',
    'qtcreator-pro-2.1.0-win-x64.exe', '/uploads/qtcreator-pro/2.1.0/qtcreator-pro-2.1.0-win-x64.exe', 89456000,
    'a1a2a3a4a5a6a7a8a9a0b1b2b3b4b5b6b7b8b9b0c1c2c3c4c5c6c7c8c9c0d1d2', 8900,
    FALSE, TRUE, '新增智能代码补全引擎，修复多项已知问题', 'PUBLISHED', 100, NOW() - INTERVAL '1 month'
FROM products p WHERE p.slug = 'qtcreator-pro'
ON CONFLICT DO NOTHING;

INSERT INTO product_versions (product_id, version_number, version_code, version_type, platform, architecture, file_name, file_path, file_size, checksum_sha256, download_count, is_mandatory, is_latest, release_notes, status, rollout_percentage, published_at)
SELECT p.id, '2.1.0', 210, 'RELEASE', 'LINUX', 'x64',
    'qtcreator-pro-2.1.0-linux-x64.AppImage', '/uploads/qtcreator-pro/2.1.0/qtcreator-pro-2.1.0-linux-x64.AppImage', 76800000,
    'b1b2b3b4b5b6b7b8b9b0c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9d0e1e2', 4200,
    FALSE, TRUE, '新增智能代码补全引擎，修复多项已知问题', 'PUBLISHED', 100, NOW() - INTERVAL '1 month'
FROM products p WHERE p.slug = 'qtcreator-pro'
ON CONFLICT DO NOTHING;

INSERT INTO product_versions (product_id, version_number, version_code, version_type, platform, architecture, file_name, file_path, file_size, checksum_sha256, download_count, is_mandatory, is_latest, release_notes, status, rollout_percentage, published_at)
SELECT p.id, '1.3.0', 130, 'RELEASE', 'WINDOWS', 'x64',
    'inkdraw-1.3.0-win-x64.exe', '/uploads/ink-draw/1.3.0/inkdraw-1.3.0-win-x64.exe', 45600000,
    'c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2', 5600,
    FALSE, TRUE, '新增水墨风格笔刷包，优化图层性能', 'PUBLISHED', 100, NOW() - INTERVAL '2 months'
FROM products p WHERE p.slug = 'ink-draw'
ON CONFLICT DO NOTHING;

INSERT INTO product_versions (product_id, version_number, version_code, version_type, platform, architecture, file_name, file_path, file_size, checksum_sha256, download_count, is_mandatory, is_latest, release_notes, status, rollout_percentage, published_at)
SELECT p.id, '1.0.2', 102, 'RELEASE', 'WINDOWS', 'x64',
    'netmonitor-1.0.2-win-x64.exe', '/uploads/net-monitor/1.0.2/netmonitor-1.0.2-win-x64.exe', 23400000,
    'd1d2d3d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2f3f4f5f6f7f8f9f0a1a2', 6340,
    FALSE, TRUE, '优化 TCP 连接追踪性能', 'PUBLISHED', 100, NOW() - INTERVAL '2 months'
FROM products p WHERE p.slug = 'net-monitor'
ON CONFLICT DO NOTHING;

INSERT INTO product_versions (product_id, version_number, version_code, version_type, platform, architecture, file_name, file_path, file_size, checksum_sha256, download_count, is_mandatory, is_latest, release_notes, status, rollout_percentage, published_at)
SELECT p.id, '3.2.1', 321, 'RELEASE', 'WINDOWS', 'x64',
    'musicbox-3.2.1-win-x64.exe', '/uploads/music-box/3.2.1/musicbox-3.2.1-win-x64.exe', 34500000,
    'e1e2e3e4e5e6e7e8e9e0f1f2f3f4f5f6f7f8f9f0a1a2a3a4a5a6a7a8a9a0b1b2', 12450,
    FALSE, TRUE, '支持 DSD 音频格式，修复歌词同步延迟', 'PUBLISHED', 100, NOW() - INTERVAL '3 weeks'
FROM products p WHERE p.slug = 'music-box'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 评论数据
-- ============================================================
INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '非常好用的开发工具，代码补全功能比原版强大很多！', 5, 'PUBLISHED', 23
FROM products p, users u WHERE p.slug = 'qtcreator-pro' AND u.username = 'zhangsan'
ON CONFLICT DO NOTHING;

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '多项目管理功能节省了我大量的时间，推荐。', 4, 'PUBLISHED', 15
FROM products p, users u WHERE p.slug = 'qtcreator-pro' AND u.username = 'lisi'
ON CONFLICT DO NOTHING;

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '版本控制集成做得不错，但希望能支持更多 Git 操作。', 4, 'PUBLISHED', 8
FROM products p, users u WHERE p.slug = 'qtcreator-pro' AND u.username = 'wangwu'
ON CONFLICT DO NOTHING;

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '在大项目中偶尔有卡顿，希望下个版本能优化内存占用。', 3, 'PUBLISHED', 5
FROM products p, users u WHERE p.slug = 'qtcreator-pro' AND u.username = 'dev_chen'
ON CONFLICT DO NOTHING;

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '水墨笔刷效果令人惊艳，非常适合中国风的设计！', 5, 'PUBLISHED', 31
FROM products p, users u WHERE p.slug = 'ink-draw' AND u.username = 'wangwu'
ON CONFLICT DO NOTHING;

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '图层管理很直觉，SVG导出质量也很好。', 4, 'PUBLISHED', 12
FROM products p, users u WHERE p.slug = 'ink-draw' AND u.username = 'zhangsan'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 通知数据
-- ============================================================
INSERT INTO notifications (user_id, type, title, content, link, is_read)
SELECT u.id, 'SYSTEM', '欢迎加入 Qt 产品发布平台', '感谢注册，请完善个人资料。', '/profile', TRUE
FROM users u WHERE u.username = 'zhangsan'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, type, title, content, link, is_read)
SELECT u.id, 'VERSION_UPDATE', 'QtCreator Pro 发布了新版本 2.1.0', '新增智能代码补全引擎', '/products/qtcreator-pro', FALSE
FROM users u WHERE u.username = 'zhangsan'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 审计日志
-- ============================================================
INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address)
SELECT u.id, 'USER_LOGIN', 'USER', u.id, '{"ip": "127.0.0.1"}', '127.0.0.1'
FROM users u WHERE u.username = 'admin';

INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address)
SELECT u.id, 'PRODUCT_AUDIT', 'PRODUCT', 1, '{"status": "PUBLISHED"}', '127.0.0.1'
FROM users u WHERE u.username = 'admin';

-- 完成
SELECT '种子数据插入完成！' AS result;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS product_count FROM products;
SELECT COUNT(*) AS version_count FROM product_versions;
SELECT COUNT(*) AS comment_count FROM product_comments;
SELECT COUNT(*) AS category_count FROM categories;
