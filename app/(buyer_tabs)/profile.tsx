import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Order } from '../../types/database';
import { User, LogOut, Package, MapPin, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchOrders = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleLogout = () => {
    signOut();
    router.replace('/(auth)/login');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 mx-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-gray-800">Orden #{item.id.slice(0, 8)}</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                <Text className="text-xs font-bold uppercase">{item.status}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">{formatDate(item.created_at)}</Text>
              <Text className="text-blue-600 font-bold">{formatPrice(item.total_amount)}</Text>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View className="p-6">
            <View className="flex-row items-center space-x-4 mb-6">
              <View className="bg-blue-600 p-4 rounded-full">
                <User size={40} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-gray-800">{profile?.name}</Text>
                <Text className="text-gray-500">{profile?.email}</Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                className="p-3 rounded-full bg-red-50"
              >
                <LogOut size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
              <View className="flex-row items-center">
                <MapPin size={20} color="#64748b" />
                <Text className="ml-3 text-gray-600">{profile?.address || 'Cali, Colombia'}</Text>
              </View>
              <View className="flex-row items-center">
                <Phone size={20} color="#64748b" />
                <Text className="ml-3 text-gray-600">{profile?.phone || '+57 300 000 0000'}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <Package size={24} color="#2563eb" />
              <Text className="ml-2 text-xl font-bold text-gray-800">Mis Pedidos</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-gray-400">Aún no has realizado pedidos.</Text>
          </View>
        }
      />
    </View>
  );
}
