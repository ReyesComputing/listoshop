-- Agregar columnas de filtro a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;

-- Actualizar productos existentes con datos de ejemplo
-- Tenis
UPDATE products SET brand = 'Nike', size = '40', color = 'Negro' WHERE name ILIKE '%Air Max%';
UPDATE products SET brand = 'Adidas', size = '42', color = 'Blanco' WHERE name ILIKE '%Ultraboost%';
UPDATE products SET brand = 'Nike', size = '41', color = 'Rojo' WHERE name ILIKE '%Jordan%';

-- Perfumes
UPDATE products SET brand = 'Versace', size = '100ml', color = NULL WHERE name ILIKE '%Versace%';
UPDATE products SET brand = 'Dior', size = '50ml', color = NULL WHERE name ILIKE '%Dior%';

-- Ropa
UPDATE products SET brand = 'Zara', size = 'M', color = 'Azul' WHERE name ILIKE '%Camiseta%';

-- Accesorios
UPDATE products SET brand = 'Casio', size = 'Único', color = 'Plateado' WHERE name ILIKE '%Reloj%';

-- Electrónica
UPDATE products SET brand = 'Apple', size = 'Único', color = 'Blanco' WHERE name ILIKE '%AirPods%';
