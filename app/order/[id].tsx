import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, OrderEvent, Product } from '../../types/database';
import { ArrowLeft, Package, Clock, MapPin, CreditCard } from 'lucide-react-native';

type OrderItemWithProduct = OrderItem & { product?: Product };

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItemWithProduct[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [orderRes, itemsRes, eventsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*').eq('order_id', id),
        supabase.from('order_events').select('*').eq('order_id', id).order('created_at', { ascending: true }),
      ]);

      if (orderRes.data) setOrder(orderRes.data as Order);

      const rawItems = (itemsRes.data || []) as OrderItem[];
      // Fetch product details for each item
      const productIds = rawItems.map((i) => i.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        const productMap = new Map((products || []).map((p: Product) => [p.id, p]));
        setItems(rawItems.map((item) => ({ ...item, product: productMap.get(item.product_id) })));
      } else {
        setItems(rawItems);
      }

      setEvents((eventsRes.data || []) as OrderEvent[]);
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_payment: 'Pendiente de pago', paid: 'Pagado',
      ready_for_dispatch: 'Listo para despacho', shipped: 'Enviado',
      delivered: 'Entregado', cancelled: 'Cancelado', failed: 'Fallido',
    };
    return labels[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: '#16a34a', shipped: '#2563eb', delivered: '#059669',
      cancelled: '#dc2626', pending_payment: '#ca8a04', ready_for_dispatch: '#4f46e5', failed: '#6b7280',
    };
    return colors[status] ?? '#6b7280';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Orden no encontrada</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 flex-row items-center shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 flex-1">Orden #{order.id.slice(0, 8)}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Status card */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3">
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getStatusColor(order.status), marginRight: 8 }} />
            <Text className="text-lg font-bold" style={{ color: getStatusColor(order.status) }}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <CreditCard size={16} color="#64748b" />
            <Text className="ml-2 text-gray-600">Total: {formatPrice(order.total_amount)}</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Clock size={16} color="#64748b" />
            <Text className="ml-2 text-gray-600">{formatDateTime(order.created_at)}</Text>
          </View>
          {order.shipping_address && (
            <View className="flex-row items-center">
              <MapPin size={16} color="#64748b" />
              <Text className="ml-2 text-gray-600">{order.shipping_address}</Text>
            </View>
          )}
        </View>

        {/* Products */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Productos</Text>
        {items.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100">
            {item.product?.image_url ? (
              <Image source={{ uri: item.product.image_url }} className="w-16 h-16 rounded-lg bg-gray-100" resizeMode="cover" />
            ) : (
              <View className="w-16 h-16 rounded-lg bg-gray-100 items-center justify-center">
                <Package size={24} color="#d1d5db" />
              </View>
            )}
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-800" numberOfLines={2}>
                {item.product?.name ?? 'Producto'}
              </Text>
              <Text className="text-gray-500 text-sm">
                {item.quantity} × {formatPrice(item.unit_price)}
              </Text>
            </View>
            <Text className="font-bold text-blue-600">{formatPrice(item.quantity * item.unit_price)}</Text>
          </View>
        ))}

        {/* Timeline */}
        {events.length > 0 && (
          <>
            <Text className="text-lg font-bold text-gray-800 mb-3 mt-4">Historial</Text>
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              {events.map((ev, idx) => (
                <View key={ev.id} className="flex-row mb-4">
                  <View className="items-center mr-3">
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getStatusColor(ev.new_status) }} />
                    {idx < events.length - 1 && (
                      <View style={{ width: 2, flex: 1, backgroundColor: '#e5e7eb', marginTop: 4 }} />
                    )}
                  </View>
                  <View className="flex-1 pb-2">
                    <Text className="font-semibold text-gray-800">{getStatusLabel(ev.new_status)}</Text>
                    {ev.note && <Text className="text-gray-500 text-sm">{ev.note}</Text>}
                    <Text className="text-gray-400 text-xs mt-1">{formatDateTime(ev.created_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}
