import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Minus, Plus, Trash2, FileText } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();
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

  const handleGenerateQuote = async () => {
    if (items.length === 0) return;
    if (!profile) {
      Alert.alert('Error', 'Debes iniciar sesión para generar una cotización');
      return;
    }

    setLoading(true);
    try {
      const quoteItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        name: item.name,
      }));

      const { data: quoteId, error: quoteError } = await supabase.rpc('generate_quote', {
        p_buyer_id: profile.id,
        p_total_amount: total,
        p_items: quoteItems,
      });

      if (quoteError) throw quoteError;

      Alert.alert(
        'Cotización Generada',
        'Tu cotización ha sido enviada al vendedor y está pendiente de aprobación.',
        [
          {
            text: 'Ver mis cotizaciones',
            onPress: () => {
              clearCart();
              router.push('/(buyer_tabs)/quotes');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al generar la cotización');
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
          onPress={handleGenerateQuote}
          className={`bg-blue-600 py-4 rounded-xl flex-row justify-center items-center space-x-2 ${
            items.length === 0 || loading ? 'opacity-50' : ''
          }`}
        >
          <FileText size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-lg">
            {loading ? 'Procesando...' : 'Generar Cotización'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
