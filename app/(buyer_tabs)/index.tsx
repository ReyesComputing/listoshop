import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';
import { CategoryCarousel } from '../../components/CategoryCarousel';

const SORT_OPTIONS = [
  { label: 'Recientes', value: 'created_at', ascending: false },
  { label: 'Precio: menor', value: 'price', ascending: true },
  { label: 'Precio: mayor', value: 'price', ascending: false },
  { label: 'Nombre A-Z', value: 'name', ascending: true },
];

export default function HomeFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tenis');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [brandFilter, setBrandFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortIndex, setSortIndex] = useState(0);

  // Opciones dinámicas
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const { data } = await supabase
        .from('products')
        .select('brand, size, color')
        .eq('is_active', true);
      if (data) {
        setAvailableBrands([...new Set(data.map((p) => p.brand).filter(Boolean))] as string[]);
        setAvailableSizes([...new Set(data.map((p) => p.size).filter(Boolean))] as string[]);
        setAvailableColors([...new Set(data.map((p) => p.color).filter(Boolean))] as string[]);
      }
    };
    loadFilterOptions();
  }, []);

  const activeFilterCount = [brandFilter, sizeFilter, colorFilter, minPrice, maxPrice].filter(Boolean).length;

  const fetchProducts = async () => {
    try {
      const sort = SORT_OPTIONS[sortIndex];
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      if (brandFilter) query = query.eq('brand', brandFilter);
      if (sizeFilter) query = query.eq('size', sizeFilter);
      if (colorFilter) query = query.eq('color', colorFilter);
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));

      query = query.order(sort.value, { ascending: sort.ascending });

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
  }, [selectedCategory, brandFilter, sizeFilter, colorFilter, minPrice, maxPrice, sortIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const clearFilters = () => {
    setBrandFilter('');
    setSizeFilter('');
    setColorFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortIndex(0);
  };

  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${
        selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
    </TouchableOpacity>
  );

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

            {/* Barra filtros + orden */}
            <View className="px-4 flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-gray-800 flex-1">
                {selectedCategory ? `${selectedCategory}` : 'Más vendidos en Cali'}
              </Text>
              <TouchableOpacity
                onPress={() => setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)}
                className="flex-row items-center mr-2"
              >
                <Text className="text-blue-600 text-xs font-medium">{SORT_OPTIONS[sortIndex].label}</Text>
                <ChevronDown size={14} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                className="p-2 rounded-lg bg-white border border-gray-200 relative"
              >
                <SlidersHorizontal size={18} color="#2563eb" />
                {activeFilterCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <View className="px-4 mb-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {brandFilter ? (
                    <TouchableOpacity onPress={() => setBrandFilter('')} className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mr-2">
                      <Text className="text-blue-700 text-sm font-medium">{brandFilter}</Text>
                      <X size={14} color="#1d4ed8" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : null}
                  {sizeFilter ? (
                    <TouchableOpacity onPress={() => setSizeFilter('')} className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mr-2">
                      <Text className="text-blue-700 text-sm font-medium">Talla: {sizeFilter}</Text>
                      <X size={14} color="#1d4ed8" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : null}
                  {colorFilter ? (
                    <TouchableOpacity onPress={() => setColorFilter('')} className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mr-2">
                      <Text className="text-blue-700 text-sm font-medium">{colorFilter}</Text>
                      <X size={14} color="#1d4ed8" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : null}
                  {(minPrice || maxPrice) ? (
                    <TouchableOpacity onPress={() => { setMinPrice(''); setMaxPrice(''); }} className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mr-2">
                      <Text className="text-blue-700 text-sm font-medium">
                        {minPrice && maxPrice ? `$${minPrice}-$${maxPrice}` : minPrice ? `Desde $${minPrice}` : `Hasta $${maxPrice}`}
                      </Text>
                      <X size={14} color="#1d4ed8" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={clearFilters} className="bg-red-100 px-3 py-1 rounded-full">
                    <Text className="text-red-600 text-sm font-medium">Limpiar</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">No hay productos con estos filtros.</Text>
          </View>
        }
      />

      {/* Modal de filtros */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-800">Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} className="p-2">
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableBrands.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Marca</Text>
                  <View className="flex-row flex-wrap">
                    {availableBrands.map((b) => (
                      <FilterChip key={b} label={b} selected={brandFilter === b} onPress={() => setBrandFilter(brandFilter === b ? '' : b)} />
                    ))}
                  </View>
                </View>
              )}

              {availableSizes.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Talla</Text>
                  <View className="flex-row flex-wrap">
                    {availableSizes.map((s) => (
                      <FilterChip key={s} label={s} selected={sizeFilter === s} onPress={() => setSizeFilter(sizeFilter === s ? '' : s)} />
                    ))}
                  </View>
                </View>
              )}

              {availableColors.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Color</Text>
                  <View className="flex-row flex-wrap">
                    {availableColors.map((c) => (
                      <FilterChip key={c} label={c} selected={colorFilter === c} onPress={() => setColorFilter(colorFilter === c ? '' : c)} />
                    ))}
                  </View>
                </View>
              )}

              <View className="mb-5">
                <Text className="text-sm font-bold text-gray-700 mb-2">Rango de precio (COP)</Text>
                <View className="flex-row items-center">
                  <TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder="Mín" className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-800" />
                  <Text className="text-gray-400 mx-2">—</Text>
                  <TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder="Máx" className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-800" />
                </View>
              </View>

              <View className="mb-5">
                <Text className="text-sm font-bold text-gray-700 mb-2">Ordenar por</Text>
                <View className="flex-row flex-wrap">
                  {SORT_OPTIONS.map((opt, idx) => (
                    <FilterChip key={opt.label} label={opt.label} selected={sortIndex === idx} onPress={() => setSortIndex(idx)} />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className="flex-row mt-4">
              <TouchableOpacity onPress={() => { clearFilters(); setShowFilters(false); }} className="flex-1 bg-gray-200 py-3 rounded-xl items-center">
                <Text className="text-gray-700 font-bold">Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilters(false)} className="flex-1 bg-blue-600 py-3 rounded-xl items-center ml-3">
                <Text className="text-white font-bold">Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
