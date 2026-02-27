-- V2: 添加 MinIO 存储支持字段
-- 执行时间: 2026-02-27

-- 修改 file_records 表，添加 MinIO 相关字段
ALTER TABLE file_records 
    DROP CONSTRAINT IF EXISTS file_records_storage_type_check;

ALTER TABLE file_records 
    ADD CONSTRAINT file_records_storage_type_check 
    CHECK (storage_type IN ('LOCAL', 'MINIO', 'COS'));

ALTER TABLE file_records 
    ADD COLUMN IF NOT EXISTS bucket_name VARCHAR(100);

ALTER TABLE file_records 
    ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);

-- 创建 bucket_name 索引
CREATE INDEX IF NOT EXISTS idx_files_bucket ON file_records(bucket_name);
