-- ============================================================
-- 添加 LOCKED 用户状态支持
-- 修复管理员后台用户锁定功能的数据库约束问题
-- ============================================================

-- 更新用户状态约束，添加 LOCKED 状态
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'LOCKED'));

-- 验证约束是否正确添加
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'users_status_check';
