import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { TrendingUp, ShoppingBag, Clock, DollarSign, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function VendorDashboard() {
  const { profile, signOut } = useAuthStore();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Fetch only orders related to this vendor's products
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          unit_price,
          quantity,
          orders (
            id,
            status
          ),
          products!inner (
            store_id,
            stores!inner (
              vendor_id
            )
          )
        `)
        .eq('products.stores.vendor_id', profile.id);

      if (error) throw error;

      const castData = data as any[];

      const totalSales = castData.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
      const uniqueOrders = new Set(castData.map(item => item.orders.id));
      const pendingOrdersCount = new Set(castData.filter(item => item.orders.status === 'pending').map(item => item.orders.id)).size;

      setStats({
        totalSales,
        totalOrders: uniqueOrders.size,
        pendingOrders: pendingOrdersCount,
      });
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500">¡Hola!</Text>
            <Text className="text-2xl font-bold text-gray-800">{profile?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-red-50 p-3 rounded-full">
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] bg-blue-600 p-6 rounded-3xl mb-4 shadow-sm">
            <DollarSign size={24} color="white" />
            <Text className="text-white opacity-80 mt-2 text-xs">Mis Ventas</Text>
            <Text className="text-white text-lg font-bold">{formatPrice(stats.totalSales)}</Text>
          </View>

          <View className="w-[48%] bg-white p-6 rounded-3xl mb-4 shadow-sm border border-gray-100">
            <ShoppingBag size={24} color="#2563eb" />
            <Text className="text-gray-500 mt-2 text-xs">Mis Pedidos</Text>
            <Text className="text-gray-800 text-2xl font-bold">{stats.totalOrders}</Text>
          </View>

          <View className="w-full bg-white p-6 rounded-3xl mb-4 shadow-sm border border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-orange-100 p-3 rounded-full">
                <Clock size={24} color="#f97316" />
              </View>
              <View className="ml-4">
                <Text className="text-gray-500 text-xs">Pedidos Pendientes</Text>
                <Text className="text-gray-800 text-xl font-bold">{stats.pendingOrders}</Text>
              </View>
            </View>
            <TrendingUp size={24} color="#10b981" />
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">Pedidos Recientes</Text>
          <View className="bg-white p-10 rounded-3xl border border-dashed border-gray-300 items-center justify-center">
            <Text className="text-gray-400">Pronto verás aquí tus últimos pedidos.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
