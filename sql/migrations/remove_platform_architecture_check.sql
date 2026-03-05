-- 移除 platform 字段的 CHECK 约束
ALTER TABLE product_versions DROP CONSTRAINT IF EXISTS product_versions_platform_check;

-- 移除 architecture 字段的 CHECK 约束
ALTER TABLE product_versions DROP CONSTRAINT IF EXISTS product_versions_architecture_check;

-- 添加注释说明
COMMENT ON COLUMN product_versions.platform IS '操作系统平台，如 WINDOWS, MACOS, LINUX, ANDROID, IOS, WEB, CROSS_PLATFORM 或自定义值';
COMMENT ON COLUMN product_versions.architecture IS 'CPU 架构，如 x86, x64, arm64, universal 或自定义值';
