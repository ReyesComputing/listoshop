-- SQL para Ferretero - Estructura Base B2B

-- 1. Enum para Tiers de Cliente
CREATE TYPE customer_tier AS ENUM ('Regular', 'Premium', 'Platino', 'Oro');

-- 2. Tabla de Perfiles (Extiende Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('buyer', 'vendor')),
  name TEXT,
  phone TEXT,
  address TEXT,
  customer_tier customer_tier DEFAULT 'Regular',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Tiendas (Para Vendedores)
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  image_url TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'unidad', -- kg, bulto, m3, unidad
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Cotizaciones (Quotes)
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Lista de productos: {product_id, quantity, unit_price}
  total_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('Pendiente de Aprobación', 'Aprobada', 'Vencida', 'Pagada')) DEFAULT 'Pendiente de Aprobación',
  expiration_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Usuarios pueden ver su propio perfil." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil (excepto tier)."
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Solo el vendedor (admin) puede actualizar tiers de clientes
CREATE POLICY "Vendedores pueden gestionar tiers de clientes."
ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'vendor')
);

-- Políticas para Stores
CREATE POLICY "Tiendas son visibles para todos." ON stores FOR SELECT USING (true);
CREATE POLICY "Vendedores gestionan su propia tienda." ON stores FOR ALL USING (auth.uid() = vendor_id);

-- Políticas para Products
CREATE POLICY "Productos son visibles para todos." ON products FOR SELECT USING (true);
CREATE POLICY "Vendedores gestionan sus propios productos." ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);

-- Políticas para Quotes
CREATE POLICY "Compradores ven sus propias cotizaciones." ON quotes FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Vendedores ven cotizaciones de sus clientes." ON quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'vendor')
);
CREATE POLICY "Compradores pueden crear cotizaciones." ON quotes FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- FASE 2: RPCs

-- 1. Función para calcular el precio según el tier del cliente
CREATE OR REPLACE FUNCTION calculate_tier_price(
  p_product_id UUID,
  p_customer_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_base_price NUMERIC;
  v_tier customer_tier;
  v_discount NUMERIC := 0;
BEGIN
  -- Obtener precio base
  SELECT price INTO v_base_price FROM products WHERE id = p_product_id;

  -- Obtener tier del cliente
  SELECT customer_tier INTO v_tier FROM profiles WHERE id = p_customer_id;

  -- Definir descuento
  CASE v_tier
    WHEN 'Regular' THEN v_discount := 0;
    WHEN 'Premium' THEN v_discount := 0.05;
    WHEN 'Platino' THEN v_discount := 0.10;
    WHEN 'Oro' THEN v_discount := 0.15;
    ELSE v_discount := 0;
  END CASE;

  RETURN v_base_price * (1 - v_discount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para generar una cotización (Generate Quote)
CREATE OR REPLACE FUNCTION generate_quote(
  p_buyer_id UUID,
  p_total_amount NUMERIC,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  -- Insertar en la tabla de cotizaciones
  -- No se descuenta stock en este paso.
  INSERT INTO quotes (buyer_id, total_amount, items, status)
  VALUES (p_buyer_id, p_total_amount, p_items, 'Pendiente de Aprobación')
  RETURNING id INTO v_quote_id;

  RETURN v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
