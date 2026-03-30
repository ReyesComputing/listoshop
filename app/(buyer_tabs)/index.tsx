import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';
import { CategoryCarousel } from '../../components/CategoryCarousel';

export default function HomeFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tenis');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('*');

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <CategoryCarousel
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <View className="px-4 py-2">
              <Text className="text-xl font-bold text-gray-800">
                {selectedCategory ? `Productos en ${selectedCategory}` : 'Más vendidos en Cali'}
              </Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">No hay productos en esta categoría.</Text>
          </View>
        }
      />
    </View>
  );
}
