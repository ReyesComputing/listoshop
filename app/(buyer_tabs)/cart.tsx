import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Minus, Plus, Trash2, CreditCard, ShoppingBag } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { initiatePayment } from '../../services/payment';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

export default function CartScreen() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCartStore();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!profile) {
      Alert.alert('Error', 'Debes iniciar sesión para comprar');
      return;
    }

    setLoading(true);
    try {
      const cartItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { data, error: checkoutError } = await supabase.rpc('checkout_atomic', {
        p_buyer_id: profile.id,
        p_items: cartItems,
        p_shipping_address: profile.address ?? null,
      });

      if (checkoutError) throw checkoutError;

      const orderId = data.order_id as string;
      const orderTotal = data.total_amount as number;

      const paymentResult = await initiatePayment({
        orderId,
        amount: orderTotal,
        currency: 'COP',
        customerEmail: profile.email,
        customerName: profile.name,
      });

      if (paymentResult.success) {
        Alert.alert(
          '¡Pedido creado!',
          `Orden #${orderId.slice(0, 8)} por ${formatPrice(orderTotal)}. ${paymentResult.message ?? 'Procesando pago...'}`,
        );
        clearCart();
      } else {
        await supabase.rpc('advance_order_status', {
          p_order_id: orderId,
          p_new_status: 'failed',
          p_actor_id: profile.id,
          p_actor_role: 'buyer',
          p_note: paymentResult.error ?? 'Pago rechazado',
        });
        Alert.alert('Error de pago', paymentResult.error ?? 'No se pudo completar la transacción.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar el pedido';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        className="px-4 py-4"
        renderItem={({ item }) => (
          <View
            className="bg-white p-4 rounded-2xl flex-row items-center mb-3"
            style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
          >
            <Image
              source={{ uri: item.image_url || undefined }}
              className="w-16 h-16 rounded-xl mr-3 bg-gray-100"
            />
            <View className="flex-1">
              <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-blue-600 font-semibold text-sm">{formatPrice(item.price)}</Text>
              <Text className="text-xs text-gray-400">
                Subtotal: {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-2 rounded-full bg-gray-100"
              >
                <Minus size={14} color="#64748b" />
              </TouchableOpacity>
              <Text className="font-bold text-gray-800 w-8 text-center">{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-2 rounded-full bg-gray-100"
              >
                <Plus size={14} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                className="p-2 rounded-full bg-red-50 ml-3"
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <ShoppingBag size={48} color="#cbd5e1" />
            <Text className="text-gray-400 mt-4 text-base">Tu carrito está vacío</Text>
            <Text className="text-gray-300 text-sm mt-1">Agrega productos para empezar</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <View className="bg-white px-6 py-5 rounded-t-3xl" style={{ elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } }}>
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-gray-500 text-sm">{items.length} producto{items.length > 1 ? 's' : ''}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg text-gray-600 font-medium">Total</Text>
            <Text className="text-2xl font-bold text-blue-600">{formatPrice(total)}</Text>
          </View>

          <TouchableOpacity
            disabled={loading}
            onPress={handleCheckout}
            className={`bg-blue-600 py-4 rounded-2xl flex-row justify-center items-center ${loading ? 'opacity-50' : ''}`}
            style={{ elevation: 2 }}
          >
            <CreditCard size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">
              {loading ? 'Procesando...' : 'Proceder al pago'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
