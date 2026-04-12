import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { FileText, Clock, CheckCircle, CreditCard } from 'lucide-react-native';

interface Quote {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
}

export default function QuotesScreen() {
  const { profile } = useAuthStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, [profile]);

  const fetchQuotes = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleApproveAndPay = async (quote: Quote) => {
    // Aquí se llamaría a la lógica de pago y descuento de stock
    Alert.alert('Pago', 'Redirigiendo a la pasarela de pago para confirmar stock y finalizar compra...');
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800">Mis Cotizaciones</Text>
            <Text className="text-gray-500">Historial de solicitudes de precios</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-gray-400 text-xs uppercase font-bold mb-1">Cotización #{item.id.slice(0, 8)}</Text>
                <Text className="text-gray-500 text-sm">{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                item.status === 'Aprobada' ? 'bg-green-100' :
                item.status === 'Pagada' ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <Text className={`font-bold text-xs ${
                  item.status === 'Aprobada' ? 'text-green-700' :
                  item.status === 'Pagada' ? 'text-blue-700' : 'text-orange-700'
                }`}>{item.status}</Text>
              </View>
            </View>

            <View className="border-t border-b border-gray-50 py-3 mb-4">
              {item.items.map((prod: any, idx: number) => (
                <View key={idx} className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 flex-1" numberOfLines={1}>{prod.quantity}x {prod.name}</Text>
                  <Text className="text-gray-800 font-medium">{formatPrice(prod.unit_price * prod.quantity)}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-800">Total</Text>
              <Text className="text-xl font-bold text-blue-600">{formatPrice(item.total_amount)}</Text>
            </View>

            {item.status === 'Aprobada' && (
              <TouchableOpacity
                onPress={() => handleApproveAndPay(item)}
                className="bg-green-500 py-4 rounded-xl flex-row justify-center items-center"
              >
                <CreditCard size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">Aprobar y Pagar</Text>
              </TouchableOpacity>
            )}

            {item.status === 'Pendiente de Aprobación' && (
              <View className="bg-gray-50 p-3 rounded-xl flex-row items-center justify-center">
                <Clock size={16} color="#64748b" />
                <Text className="text-gray-500 text-sm font-medium ml-2">Esperando respuesta del vendedor</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <FileText size={64} color="#e2e8f0" />
            <Text className="text-gray-400 mt-4">Aún no tienes cotizaciones.</Text>
          </View>
        }
      />
    </View>
  );
}
