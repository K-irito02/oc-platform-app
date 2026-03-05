-- Add show_on_detail column to product_versions table
-- This column controls whether a version should be displayed on the product detail page

ALTER TABLE product_versions 
ADD COLUMN IF NOT EXISTS show_on_detail BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment
COMMENT ON COLUMN product_versions.show_on_detail IS 'Whether to show this version on product detail page';
