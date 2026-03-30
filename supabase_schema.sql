-- ============================================================
-- ListoShop · Esquema de Producción para Supabase
-- ============================================================

-- 1. Profiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'vendor')),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  brand TEXT,
  size TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders – máquina de estados completa
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment','paid','ready_for_dispatch',
      'shipped','delivered','cancelled','failed'
    )),
  payment_reference TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price > 0)
);

-- 6. Order Events – bitácora de la máquina de estados
CREATE TABLE order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('buyer', 'vendor', 'system')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Delivery Evidence – auditoría de entregas
CREATE TABLE delivery_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'signature', 'note')),
  file_url TEXT,
  note TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_store ON order_items(store_id);
CREATE INDEX idx_order_events_order ON order_events(order_id);
CREATE INDEX idx_delivery_evidence_order ON delivery_evidence(order_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ===================== RLS HELPER FUNCTIONS ========================
-- Funciones SECURITY DEFINER que rompen la recursión circular en RLS

CREATE OR REPLACE FUNCTION is_vendor_of_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN stores s ON s.id = oi.store_id
    WHERE oi.order_id = p_order_id AND s.vendor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_buyer_of_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders WHERE id = p_order_id AND buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION vendor_has_buyer(p_buyer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN stores s ON s.id = oi.store_id
    WHERE o.buyer_id = p_buyer_id AND s.vendor_id = auth.uid()
  );
$$;

-- ===================== RLS ========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_evidence ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile on signup"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Vendors see buyer names for their orders"
  ON profiles FOR SELECT USING (vendor_has_buyer(profiles.id));

-- stores
CREATE POLICY "Stores are viewable by everyone" ON stores FOR SELECT USING (true);
CREATE POLICY "Vendors can insert their own store" ON stores FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update their own store" ON stores FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete their own store" ON stores FOR DELETE USING (auth.uid() = vendor_id);

-- products
CREATE POLICY "Active products are viewable by everyone" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors see all own products" ON products FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);
CREATE POLICY "Vendors can insert own products" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);
CREATE POLICY "Vendors can update own products" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);
CREATE POLICY "Vendors can delete own products" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.vendor_id = auth.uid())
);

-- orders
CREATE POLICY "Buyers can view their orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Vendors can view orders with their products"
  ON orders FOR SELECT USING (is_vendor_of_order(orders.id));
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Order status can be updated" ON orders FOR UPDATE USING (
  auth.uid() = buyer_id OR is_vendor_of_order(orders.id)
);

-- order_items
CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT USING (is_buyer_of_order(order_items.order_id));
CREATE POLICY "Vendors can view items for their store" ON order_items FOR SELECT USING (
  store_id IN (SELECT id FROM stores WHERE vendor_id = auth.uid())
);
CREATE POLICY "Buyers can insert order items"
  ON order_items FOR INSERT WITH CHECK (is_buyer_of_order(order_items.order_id));

-- order_events
CREATE POLICY "Buyers can view events for their orders"
  ON order_events FOR SELECT USING (is_buyer_of_order(order_events.order_id));
CREATE POLICY "Vendors can view events for their orders"
  ON order_events FOR SELECT USING (is_vendor_of_order(order_events.order_id));
CREATE POLICY "Actors can insert events" ON order_events FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- delivery_evidence
CREATE POLICY "Buyers can view delivery evidence"
  ON delivery_evidence FOR SELECT USING (is_buyer_of_order(delivery_evidence.order_id));
CREATE POLICY "Vendors can view delivery evidence"
  ON delivery_evidence FOR SELECT USING (is_vendor_of_order(delivery_evidence.order_id));
CREATE POLICY "Users can insert delivery evidence" ON delivery_evidence FOR INSERT WITH CHECK (auth.uid() = uploaded_by);


-- ===================== RPC FUNCTIONS ========================

-- Checkout atómico: valida stock, reserva, crea orden + items
CREATE OR REPLACE FUNCTION checkout_atomic(
  p_buyer_id UUID,
  p_items JSONB,
  p_shipping_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_buyer_id AND role = 'buyer') THEN
    RAISE EXCEPTION 'Usuario no autorizado para comprar';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.*, s.id AS sid INTO v_product
    FROM products p JOIN stores s ON s.id = p.store_id
    WHERE p.id = (v_item->>'product_id')::UUID AND p.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no encontrado o inactivo', v_item->>'product_id';
    END IF;
    IF v_product.stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %',
        v_product.name, v_product.stock, (v_item->>'quantity')::INT;
    END IF;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::INT);
  END LOOP;

  INSERT INTO orders (buyer_id, total_amount, status, shipping_address)
  VALUES (p_buyer_id, v_total, 'pending_payment', p_shipping_address)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.*, s.id AS sid INTO v_product
    FROM products p JOIN stores s ON s.id = p.store_id
    WHERE p.id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, store_id, quantity, unit_price)
    VALUES (v_order_id, v_product.id, v_product.sid, (v_item->>'quantity')::INT, v_product.price);

    UPDATE products SET stock = stock - (v_item->>'quantity')::INT WHERE id = v_product.id;
  END LOOP;

  INSERT INTO order_events (order_id, previous_status, new_status, actor_id, actor_role, note)
  VALUES (v_order_id, NULL, 'pending_payment', p_buyer_id, 'buyer', 'Orden creada');

  RETURN jsonb_build_object(
    'order_id', v_order_id, 'total_amount', v_total, 'status', 'pending_payment'
  );
END;
$$;

-- Avanzar estado de orden con validación de transiciones
CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id UUID, p_new_status TEXT,
  p_actor_id UUID, p_actor_role TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_order RECORD; v_valid BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;

  v_valid := CASE v_order.status
    WHEN 'pending_payment' THEN p_new_status IN ('paid','failed','cancelled')
    WHEN 'paid'            THEN p_new_status IN ('ready_for_dispatch','cancelled')
    WHEN 'ready_for_dispatch' THEN p_new_status IN ('shipped','cancelled')
    WHEN 'shipped'         THEN p_new_status IN ('delivered')
    ELSE FALSE
  END;
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Transición no permitida: % → %', v_order.status, p_new_status;
  END IF;

  IF p_new_status = 'cancelled' THEN
    UPDATE products p SET stock = p.stock + oi.quantity
    FROM order_items oi WHERE oi.order_id = p_order_id AND oi.product_id = p.id;
  END IF;

  UPDATE orders SET status = p_new_status WHERE id = p_order_id;

  INSERT INTO order_events (order_id, previous_status, new_status, actor_id, actor_role, note)
  VALUES (p_order_id, v_order.status, p_new_status, p_actor_id, p_actor_role, p_note);

  RETURN jsonb_build_object('order_id', p_order_id, 'previous_status', v_order.status, 'new_status', p_new_status);
END;
$$;

-- Confirmar pago (llamado por webhook del gateway)
CREATE OR REPLACE FUNCTION confirm_payment(p_order_id UUID, p_payment_reference TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  UPDATE orders SET payment_reference = p_payment_reference
  WHERE id = p_order_id AND status = 'pending_payment';
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no está pendiente de pago'; END IF;

  SELECT advance_order_status(p_order_id, 'paid', NULL, 'system', 'Pago confirmado: ' || p_payment_reference) INTO v_result;
  RETURN v_result;
END;
$$;


-- ===================== MIGRACIÓN (si ya existen las tablas originales) ========================
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check
--   CHECK (status IN ('pending_payment','paid','ready_for_dispatch','shipped','delivered','cancelled','failed'));
-- ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment';
-- UPDATE orders SET status = 'pending_payment' WHERE status = 'pending';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
-- UPDATE order_items oi SET store_id = p.store_id FROM products p WHERE oi.product_id = p.id AND oi.store_id IS NULL;
