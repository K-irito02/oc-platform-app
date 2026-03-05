-- Add display_version_id column to products table
-- This column stores the version ID to display in the product detail sidebar

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_version_id BIGINT;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_display_version 
FOREIGN KEY (display_version_id) REFERENCES product_versions(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN products.display_version_id IS 'The version ID to display in product detail sidebar';
