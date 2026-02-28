-- V1.0.3: 删除用户表中的昵称(nickname)字段
-- 昵称功能已移除，统一使用用户名(username)

-- 删除 nickname 列
ALTER TABLE users DROP COLUMN IF EXISTS nickname;
