-- 添加 site.logo 配置项（如果不存在）
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('site.logo', '', '站点Logo图片URL')
ON CONFLICT (config_key) DO NOTHING;

-- 更新描述使其更清晰
UPDATE system_configs SET description = '站点中文名称' WHERE config_key = 'site.name';
UPDATE system_configs SET description = '站点英文名称' WHERE config_key = 'site.name_en';
