import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Users, ChevronRight, Award } from 'lucide-react-native';

const TIERS = ['Regular', 'Premium', 'Platino', 'Oro'];

interface Profile {
  id: string;
  name: string;
  email: string;
  customer_tier: string;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'buyer')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (customerId: string, currentTier: string) => {
    const currentIndex = TIERS.indexOf(currentTier);
    const nextTier = TIERS[(currentIndex + 1) % TIERS.length];

    setUpdating(customerId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ customer_tier: nextTier })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(customers.map(c =>
        c.id === customerId ? { ...c, customer_tier: nextTier } : c
      ));

      Alert.alert('Éxito', `Nivel actualizado a ${nextTier}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el nivel');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800">Mis Compradores</Text>
            <Text className="text-gray-500">Gestiona los niveles de descuento de tus clientes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-100 p-3 rounded-full mr-4">
                <Users size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-800 text-lg">{item.name || 'Sin nombre'}</Text>
                <Text className="text-gray-500">{item.email}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                item.customer_tier === 'Oro' ? 'bg-yellow-100' :
                item.customer_tier === 'Platino' ? 'bg-purple-100' :
                item.customer_tier === 'Premium' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Text className={`font-bold text-xs ${
                  item.customer_tier === 'Oro' ? 'text-yellow-700' :
                  item.customer_tier === 'Platino' ? 'text-purple-700' :
                  item.customer_tier === 'Premium' ? 'text-blue-700' : 'text-gray-700'
                }`}>{item.customer_tier}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => updateTier(item.id, item.customer_tier)}
              disabled={updating === item.id}
              className="bg-gray-50 border border-gray-200 py-3 rounded-xl flex-row justify-center items-center"
            >
              {updating === item.id ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Award size={18} color="#475569" className="mr-2" />
                  <Text className="text-slate-600 font-semibold ml-2">Subir Nivel / Cambiar Tier</Text>
                  <ChevronRight size={18} color="#475569" className="ml-1" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">No hay compradores registrados.</Text>
          </View>
        }
      />
    </View>
  );
}
