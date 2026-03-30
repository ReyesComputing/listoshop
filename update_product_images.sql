-- Actualizar imágenes de productos con fotos reales de Unsplash
-- Ejecutar en el SQL Editor de Supabase: https://supabase.com/dashboard/project/nxcdickzlvhaxrhngesw/sql/new

-- Tenis
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600&h=600&fit=crop'
WHERE id = '5d0c1412-4e55-4cb4-94b5-52e05c828f90'; -- Nike Air Max 90

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop', brand = 'Adidas'
WHERE id = 'd2cacc0a-9bba-48b0-b431-cd31d9e39ef4'; -- Adidas Samba OG

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop', brand = 'New Balance'
WHERE id = '01822705-9650-4865-abcd-90b28f931141'; -- New Balance 550

-- Perfumes
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1594035910387-fea081e21891?w=600&h=600&fit=crop', brand = 'Carolina Herrera'
WHERE id = '37c66d43-7fb3-4892-99a6-ec99d8a775d7'; -- Carolina Herrera 212

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop'
WHERE id = '8dd52899-34f8-4a00-af67-e498e2be27bf'; -- Dior Sauvage

-- Ropa
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop', brand = 'Ralph Lauren'
WHERE id = 'c4735dcd-ee41-471b-b37d-db6cf41ef46f'; -- Camiseta Polo Ralph Lauren

-- Accesorios
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop', brand = 'Ray-Ban'
WHERE id = '79eedb41-6886-45ae-bbc2-90887cf3b1e3'; -- Gafas Ray-Ban Aviator

-- Electrónica
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=600&fit=crop'
WHERE id = '29e94295-61f7-48ab-bd95-2438bf2bde9b'; -- AirPods Pro 2
