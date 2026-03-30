import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Minus, Plus, Trash2, CreditCard } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { simulatePayment } from '../../services/payment';
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
      // 1. Simulate payment with Wompi/ePayco
      const paymentResult = await simulatePayment(total);

      if (paymentResult.success) {
        // 2. Create Order in Supabase
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: profile.id,
            total_amount: total,
            status: 'paid',
          })
          .select('*')
          .single();

        if (orderError) throw orderError;

        // 3. Create Order Items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) throw itemsError;

        Alert.alert('¡Compra exitosa!', `Tu pedido #${order.id.slice(0, 8)} ha sido procesado.`);
        clearCart();
      } else {
        Alert.alert('Error de pago', 'No se pudo completar la transacción.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar el pedido');
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
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center mb-3">
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
              className="w-16 h-16 rounded-lg mr-4"
            />
            <View className="flex-1">
              <Text className="font-bold text-gray-800" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-blue-600 font-semibold">{formatPrice(item.price)}</Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 rounded-full bg-gray-100"
              >
                <Minus size={16} color="#64748b" />
              </TouchableOpacity>
              <Text className="font-bold text-gray-800 w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-full bg-gray-100"
              >
                <Plus size={16} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                className="p-2 rounded-full bg-red-50 ml-2"
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">Tu carrito está vacío.</Text>
          </View>
        }
      />

      <View className="bg-white p-6 rounded-t-3xl shadow-lg border-t border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg text-gray-600">Total a pagar</Text>
          <Text className="text-2xl font-bold text-blue-600">{formatPrice(total)}</Text>
        </View>

        <TouchableOpacity
          disabled={items.length === 0 || loading}
          onPress={handleCheckout}
          className={`bg-green-500 py-4 rounded-xl flex-row justify-center items-center space-x-2 ${
            items.length === 0 || loading ? 'opacity-50' : ''
          }`}
        >
          <CreditCard size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-lg">
            {loading ? 'Procesando...' : 'Proceder al pago'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
