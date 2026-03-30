-- SQL for Supabase Editor

-- 1. Profiles (extends Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('buyer', 'vendor')),
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stores (for Vendors)
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'shipped')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Fix Hallazgo 6: Restrict public access to PII.
-- Only the owner can see their own full profile (PII: email, phone, address).
CREATE POLICY "Users can manage their own profile." ON profiles FOR ALL USING (auth.uid() = id);
-- Others can only see names (Public view for discovery).
-- In Supabase, we can't restrict columns easily via RLS, so we use a policy that allows
-- SELECT only for the owner for the main table, and we'd ideally use a public view for names.
-- To stay within the prompt's scope, I'll allow SELECT for everyone but advise using a View for PII.
-- Actually, a better RLS fix: Only the owner can SELECT the full row.
CREATE POLICY "Users can see their own profile." ON profiles FOR SELECT USING (auth.uid() = id);

-- 2. Stores Policies
CREATE POLICY "Stores are viewable by everyone." ON stores FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own store." ON stores FOR ALL USING (auth.uid() = vendor_id);

-- 3. Products Policies
CREATE POLICY "Products are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own products." ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);

-- 4. Orders Policies
CREATE POLICY "Orders are viewable by respective buyer or vendor." ON orders FOR SELECT USING (
  auth.uid() = buyer_id OR
  EXISTS (
    SELECT 1 FROM order_items
    JOIN products ON order_items.product_id = products.id
    JOIN stores ON products.store_id = stores.id
    WHERE order_items.order_id = orders.id AND stores.vendor_id = auth.uid()
  )
);
CREATE POLICY "Buyers can create orders." ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 5. Order Items Policies (Fix Hallazgo 1: Missing RLS for order_items)
CREATE POLICY "Order items are viewable by order owner or related vendor." ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM products
    JOIN stores ON products.store_id = stores.id
    WHERE products.id = order_items.product_id AND stores.vendor_id = auth.uid()
  )
);
CREATE POLICY "Buyers can insert order items for their own orders." ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);

-- Fix Hallazgo 5: Atomic checkout with stock validation (RPC)
CREATE OR REPLACE FUNCTION place_order(
  p_buyer_id UUID,
  p_total_amount NUMERIC,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
BEGIN
  -- 1. Create the order
  INSERT INTO orders (buyer_id, total_amount, status)
  VALUES (p_buyer_id, p_total_amount, 'pending')
  RETURNING id INTO v_order_id;

  -- 2. Process items and validate stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
  LOOP
    -- Validate and decrement stock
    UPDATE products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id AND stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_item.product_id;
    END IF;

    -- Insert order item
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_item.product_id, v_item.quantity, v_item.unit_price);
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
