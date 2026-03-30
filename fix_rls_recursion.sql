-- ============================================================
-- FIX: Resolver recursión infinita en políticas RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear funciones helper SECURITY DEFINER (bypasean RLS internamente)

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

-- 2. Eliminar políticas problemáticas (las que causan recursión)

DROP POLICY IF EXISTS "Vendors see buyer names for their orders" ON profiles;
DROP POLICY IF EXISTS "Vendors can view orders with their products" ON orders;
DROP POLICY IF EXISTS "Order status can be updated" ON orders;
DROP POLICY IF EXISTS "Buyers can view their order items" ON order_items;
DROP POLICY IF EXISTS "Buyers can insert order items" ON order_items;
DROP POLICY IF EXISTS "Buyers can view events for their orders" ON order_events;
DROP POLICY IF EXISTS "Vendors can view events for their orders" ON order_events;
DROP POLICY IF EXISTS "Buyers can view delivery evidence" ON delivery_evidence;
DROP POLICY IF EXISTS "Vendors can view delivery evidence" ON delivery_evidence;

-- 3. Recrear políticas usando las funciones helper (sin recursión)

-- profiles: vendors ven nombres de compradores de sus órdenes
CREATE POLICY "Vendors see buyer names for their orders"
  ON profiles FOR SELECT USING (vendor_has_buyer(profiles.id));

-- orders: vendors ven órdenes con sus productos
CREATE POLICY "Vendors can view orders with their products"
  ON orders FOR SELECT USING (is_vendor_of_order(orders.id));

-- orders: actualización por buyer o vendor
CREATE POLICY "Order status can be updated"
  ON orders FOR UPDATE USING (
    auth.uid() = buyer_id OR is_vendor_of_order(orders.id)
  );

-- order_items: buyers ven sus items
CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT USING (is_buyer_of_order(order_items.order_id));

-- order_items: buyers insertan items
CREATE POLICY "Buyers can insert order items"
  ON order_items FOR INSERT WITH CHECK (is_buyer_of_order(order_items.order_id));

-- order_events: buyers ven eventos de sus órdenes
CREATE POLICY "Buyers can view events for their orders"
  ON order_events FOR SELECT USING (is_buyer_of_order(order_events.order_id));

-- order_events: vendors ven eventos de sus órdenes
CREATE POLICY "Vendors can view events for their orders"
  ON order_events FOR SELECT USING (is_vendor_of_order(order_events.order_id));

-- delivery_evidence: buyers ven evidencia
CREATE POLICY "Buyers can view delivery evidence"
  ON delivery_evidence FOR SELECT USING (is_buyer_of_order(delivery_evidence.order_id));

-- delivery_evidence: vendors ven evidencia
CREATE POLICY "Vendors can view delivery evidence"
  ON delivery_evidence FOR SELECT USING (is_vendor_of_order(delivery_evidence.order_id));
