-- 添加 Footer 配置项（如果不存在）
-- 备案信息（中文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.beian', '', '网站备案号')
ON CONFLICT (config_key) DO NOTHING;

-- 备案信息（英文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.beian_en', '', 'Website Filing Number')
ON CONFLICT (config_key) DO NOTHING;

-- ICP 信息（中文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.icp', '', 'ICP备案号')
ON CONFLICT (config_key) DO NOTHING;

-- ICP 信息（英文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.icp_en', '', 'ICP Filing Number')
ON CONFLICT (config_key) DO NOTHING;

-- 节假日定制信息（中文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.holiday', '', '节假日定制信息')
ON CONFLICT (config_key) DO NOTHING;

-- 节假日定制信息（英文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.holiday_en', '', 'Holiday Custom Message')
ON CONFLICT (config_key) DO NOTHING;

-- 名人名言（中文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.quote', '', '名人名言')
ON CONFLICT (config_key) DO NOTHING;

-- 名人名言（英文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.quote_en', '', 'Famous Quote')
ON CONFLICT (config_key) DO NOTHING;

-- 名人名言作者（中文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.quote_author', '', '名言作者')
ON CONFLICT (config_key) DO NOTHING;

-- 名人名言作者（英文）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('footer.quote_author_en', '', 'Quote Author')
ON CONFLICT (config_key) DO NOTHING;
