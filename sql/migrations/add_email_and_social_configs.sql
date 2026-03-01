-- ============================================================
-- 添加邮件模板和社交链接配置项
-- ============================================================

-- 官网URL配置
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('site.url', 'https://kiritolab.com', '官网URL')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('site.url_en', 'https://kiritolab.com', 'Website URL')
ON CONFLICT (config_key) DO NOTHING;

-- 邮件发件人名称
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.sender_name', '桐人创研', '邮件发件人名称（中文）')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.sender_name_en', 'KiritoLab', '邮件发件人名称（英文）')
ON CONFLICT (config_key) DO NOTHING;

-- 邮件底部版权信息
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.copyright', '© 2026 桐人创研. 保留所有权利.', '邮件版权信息（中文）')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.copyright_en', '© 2026 KiritoLab. All rights reserved.', '邮件版权信息（英文）')
ON CONFLICT (config_key) DO NOTHING;

-- 邮件安全提示
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.security_tip', '如果这不是您本人的操作，请忽略此邮件。您的账户仍然安全。', '邮件安全提示（中文）')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('email.security_tip_en', 'If you did not request this, please ignore this email. Your account is still secure.', '邮件安全提示（英文）')
ON CONFLICT (config_key) DO NOTHING;

-- 社交媒体链接配置
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.github', '', 'GitHub 链接')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.twitter', '', 'Twitter/X 链接')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.linkedin', '', 'LinkedIn 链接')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.weibo', '', '微博链接')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.wechat', '', '微信公众号')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO system_configs (config_key, config_value, description)
VALUES ('social.email', '', '联系邮箱')
ON CONFLICT (config_key) DO NOTHING;

-- 完成
SELECT '邮件和社交配置项添加完成！' AS result;
