import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';

const CATEGORIES = ['Todos', 'Tenis', 'Perfumes', 'Ropa', 'Accesorios', 'Electrónica'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const handleSearch = async () => {
    if (!searchQuery && selectedCategory === 'Todos') return;

    setLoading(true);
    try {
      let query = supabase.from('products').select('*');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory !== 'Todos') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center mb-4">
        <SearchIcon size={20} color="#64748b" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Busca tenis, perfumes, ropa..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} className="bg-blue-600 px-4 py-2 rounded-lg ml-2">
          <Text className="text-white font-bold">Buscar</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`mr-2 px-4 py-2 rounded-lg border ${
                selectedCategory === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-semibold ${selectedCategory === cat ? 'text-white' : 'text-gray-600'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">
              {loading ? 'Buscando...' : 'Encuentra lo que buscas en Cali'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
