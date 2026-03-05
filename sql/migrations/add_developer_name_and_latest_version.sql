-- =====================================================
-- 产品表新增开发者名称和最新版本字段
-- =====================================================

-- 1. 新增开发者名称字段
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS developer_name VARCHAR(255) NOT NULL DEFAULT 'Official';

-- 2. 新增最新版本字段
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS latest_version VARCHAR(50);

-- 3. 添加注释
COMMENT ON COLUMN products.developer_name IS '开发者名称';
COMMENT ON COLUMN products.latest_version IS '最新版本号';

-- 4. 更新现有产品的最新版本（从版本表中获取）
UPDATE products p
SET latest_version = v.version_number
FROM (
    SELECT DISTINCT ON (product_id) product_id, version_number
    FROM product_versions
    ORDER BY product_id, created_at DESC
) v
WHERE p.id = v.product_id AND p.latest_version IS NULL;
