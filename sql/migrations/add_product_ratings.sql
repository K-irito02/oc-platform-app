-- =====================================================
-- 产品评分表迁移脚本
-- 创建时间: 2026-03-04
-- 描述: 创建独立的评分表，支持用户单独评分
-- =====================================================

-- 创建评分表
CREATE TABLE IF NOT EXISTS product_ratings (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- 每个用户每个产品只能评分一次
    CONSTRAINT uk_product_user_rating UNIQUE(product_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ratings_product ON product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON product_ratings(created_at DESC);

-- 添加评分分布字段到产品表（可选，用于缓存）
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}';

-- 迁移现有评论中的评分数据到新表
INSERT INTO product_ratings (product_id, user_id, rating, created_at)
SELECT product_id, user_id, rating, created_at
FROM product_comments
WHERE rating IS NOT NULL 
  AND parent_id IS NULL
  AND status = 'PUBLISHED'
ON CONFLICT (product_id, user_id) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rating_updated_at ON product_ratings;
CREATE TRIGGER trigger_rating_updated_at
    BEFORE UPDATE ON product_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_rating_updated_at();

-- 注释
COMMENT ON TABLE product_ratings IS '产品评分表';
COMMENT ON COLUMN product_ratings.id IS '评分ID';
COMMENT ON COLUMN product_ratings.product_id IS '产品ID';
COMMENT ON COLUMN product_ratings.user_id IS '用户ID';
COMMENT ON COLUMN product_ratings.rating IS '评分值(1-5)';
COMMENT ON COLUMN product_ratings.created_at IS '创建时间';
COMMENT ON COLUMN product_ratings.updated_at IS '更新时间';
