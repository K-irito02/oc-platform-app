-- =====================================================
-- 体验评分迁移脚本
-- 将评论评分与产品评分分离
-- =====================================================

-- 1. 新增体验评分统计字段到 products 表
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS experience_rating_average DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS experience_rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}';

-- 添加注释
COMMENT ON COLUMN products.experience_rating_average IS '体验评分平均值(来自评论)';
COMMENT ON COLUMN products.experience_rating_count IS '体验评分总数(来自评论)';
COMMENT ON COLUMN products.experience_rating_distribution IS '体验评分分布(来自评论)';

-- 2. 迁移现有评论评分到体验评分统计
UPDATE products p
SET 
    experience_rating_average = COALESCE(stats.avg_rating, 0.0),
    experience_rating_count = COALESCE(stats.total_count, 0),
    experience_rating_distribution = COALESCE(stats.distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
FROM (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as total_count,
        jsonb_object_agg(
            rating::text, 
            count
        ) as distribution
    FROM (
        SELECT 
            product_id,
            rating,
            COUNT(*) as count
        FROM product_comments
        WHERE rating IS NOT NULL 
          AND status = 'PUBLISHED' 
          AND parent_id IS NULL
        GROUP BY product_id, rating
    ) sub
    GROUP BY product_id
) stats
WHERE p.id = stats.product_id;

-- 3. 重置产品评分统计（仅来自 product_ratings 表）
UPDATE products p
SET 
    rating_average = COALESCE(ratings.avg_rating, 0.0),
    rating_count = COALESCE(ratings.total_count, 0),
    rating_distribution = COALESCE(ratings.distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
FROM (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as total_count,
        jsonb_object_agg(
            rating::text, 
            count
        ) as distribution
    FROM (
        SELECT 
            product_id,
            rating,
            COUNT(*) as count
        FROM product_ratings
        GROUP BY product_id, rating
    ) sub
    GROUP BY product_id
) ratings
WHERE p.id = ratings.product_id;

-- 4. 为没有评分的产品设置默认值
UPDATE products 
SET 
    experience_rating_average = 0.0,
    experience_rating_count = 0,
    experience_rating_distribution = '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb
WHERE experience_rating_average IS NULL;

UPDATE products 
SET 
    rating_average = 0.0,
    rating_count = 0,
    rating_distribution = '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb
WHERE rating_average IS NULL;
