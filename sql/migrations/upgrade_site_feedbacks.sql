-- 升级 site_feedbacks 表，添加点赞、回复、公开显示等功能
-- 执行前请备份数据

-- 1. 添加新字段
ALTER TABLE site_feedbacks 
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES site_feedbacks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. 创建留言点赞表
CREATE TABLE IF NOT EXISTS site_feedback_likes (
    id          BIGSERIAL PRIMARY KEY,
    feedback_id BIGINT NOT NULL REFERENCES site_feedbacks(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feedback_id, user_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_parent_id ON site_feedbacks(parent_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON site_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_public ON site_feedbacks(is_public);
CREATE INDEX IF NOT EXISTS idx_feedback_likes_feedback_id ON site_feedback_likes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_likes_user_id ON site_feedback_likes(user_id);

-- 4. 添加注释
COMMENT ON COLUMN site_feedbacks.parent_id IS '父留言ID，用于回复功能';
COMMENT ON COLUMN site_feedbacks.like_count IS '点赞数';
COMMENT ON COLUMN site_feedbacks.reply_count IS '回复数';
COMMENT ON COLUMN site_feedbacks.is_public IS '是否公开显示在留言板';
COMMENT ON COLUMN site_feedbacks.email IS '用户邮箱（选填，仅管理员可见）';
COMMENT ON TABLE site_feedback_likes IS '留言点赞表';
