import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Product } from '../../types/database';
import { Edit2, Trash2, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function MyProductsScreen() {
  const { profile } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProducts = async () => {
    if (!profile) return;

    try {
      // 1. Get store id for vendor
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('vendor_id', profile.id)
        .single();

      if (storeError) {
        if (storeError.code === 'PGRST116') {
          setProducts([]);
          return;
        }
        throw storeError;
      }

      // 2. Fetch products for that store
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching vendor products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar producto', '¿Estás seguro de que deseas eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setProducts(products.filter((p) => p.id !== id));
            Alert.alert('Éxito', 'Producto eliminado');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar');
          }
        },
      },
    ]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={products}
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
              <Text className="text-gray-500 text-xs">Stock: {item.stock}</Text>
            </View>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => router.push(`/(vendor_tabs)/add-product?id=${item.id}`)}
                className="p-2 rounded-full bg-blue-50"
              >
                <Edit2 size={20} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="p-2 rounded-full bg-red-50"
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">Aún no tienes productos registrados.</Text>
            <TouchableOpacity
              onPress={() => router.push('/(vendor_tabs)/add-product')}
              className="mt-4 bg-blue-600 px-6 py-2 rounded-full"
            >
              <Text className="text-white font-bold">Agregar mi primer producto</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      />
    </View>
  );
}
