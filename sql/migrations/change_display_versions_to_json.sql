-- Change display_version_id to display_versions (JSON) for platform+arch mapping
-- This allows setting different display versions for different platforms

-- First drop the foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_display_version;

-- Drop the old column
ALTER TABLE products DROP COLUMN IF EXISTS display_version_id;

-- Add new JSON column for display versions mapping
-- Format: {"WINDOWS_x64": 123, "MACOS_arm64": 456, ...}
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_versions JSONB;

-- Add comment
COMMENT ON COLUMN products.display_versions IS 'JSON mapping of platform+architecture to version ID for display. Format: {"PLATFORM_arch": versionId}';
