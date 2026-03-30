import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { Search as SearchIcon, SlidersHorizontal, X, ChevronDown } from 'lucide-react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [brandFilter, setBrandFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortIndex, setSortIndex] = useState(0);

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const { data } = await supabase.from('products').select('brand, size, color').eq('is_active', true);
      if (data) {
        setAvailableBrands([...new Set(data.map((p) => p.brand).filter(Boolean))] as string[]);
        setAvailableSizes([...new Set(data.map((p) => p.size).filter(Boolean))] as string[]);
        setAvailableColors([...new Set(data.map((p) => p.color).filter(Boolean))] as string[]);
      }
    };
    loadFilterOptions();
  }, []);

  const activeFilterCount = [brandFilter, sizeFilter, colorFilter, minPrice, maxPrice].filter(Boolean).length;

  const handleSearch = async () => {
    setLoading(true);
    try {
      const sort = SORT_OPTIONS[sortIndex];
      let query = supabase.from('products').select('*').eq('is_active', true);
      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (selectedCategory) query = query.eq('category', selectedCategory);
      if (brandFilter) query = query.eq('brand', brandFilter);
      if (sizeFilter) query = query.eq('size', sizeFilter);
      if (colorFilter) query = query.eq('color', colorFilter);
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      query = query.order(sort.value, { ascending: sort.ascending });
      const { data, error } = await query.limit(50);
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, [selectedCategory, brandFilter, sizeFilter, colorFilter, minPrice, maxPrice, sortIndex]);

  const clearFilters = () => {
    setBrandFilter(''); setSizeFilter(''); setColorFilter('');
    setMinPrice(''); setMaxPrice(''); setSortIndex(0);
  };

  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
    </TouchableOpacity>
  );

  // Pair products into rows for 2-column grid
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item: row }) => (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: CARD_GAP }}>
            {row.map((product) => (
              <View key={product.id} style={{ width: CARD_WIDTH }}>
                <ProductCard product={product} compact />
              </View>
            ))}
            {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* Search bar */}
            <View className="p-4 pb-2">
              <View className="bg-white p-3 rounded-2xl flex-row items-center" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <SearchIcon size={20} color="#64748b" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800 text-base"
                  placeholder="Busca tenis, perfumes, ropa..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={() => setShowFilters(true)} className="p-2 rounded-xl bg-gray-100 relative">
                  <SlidersHorizontal size={18} color="#2563eb" />
                  {activeFilterCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSearch} className="bg-blue-600 px-4 py-2.5 rounded-xl ml-2">
                  <Text className="text-white font-bold text-sm">Buscar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories */}
            <CategoryCarousel selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

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

            {/* Sort + count */}
            <View className="px-4 mb-2 flex-row justify-between items-center">
              <Text className="text-gray-500 text-sm">{products.length} resultados</Text>
              <TouchableOpacity
                onPress={() => setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)}
                className="flex-row items-center"
              >
                <Text className="text-blue-600 text-sm font-medium">{SORT_OPTIONS[sortIndex].label}</Text>
                <ChevronDown size={14} color="#2563eb" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="py-20 items-center px-8">
            <Text className="text-4xl mb-3">🔍</Text>
            <Text className="text-gray-500 text-center">
              {loading ? 'Buscando...' : 'No se encontraron productos'}
            </Text>
            {!loading && activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearFilters} className="mt-3 bg-blue-600 px-6 py-2 rounded-full">
                <Text className="text-white font-semibold">Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
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
                    {availableBrands.map((b) => <FilterChip key={b} label={b} selected={brandFilter === b} onPress={() => setBrandFilter(brandFilter === b ? '' : b)} />)}
                  </View>
                </View>
              )}
              {availableSizes.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Talla</Text>
                  <View className="flex-row flex-wrap">
                    {availableSizes.map((s) => <FilterChip key={s} label={s} selected={sizeFilter === s} onPress={() => setSizeFilter(sizeFilter === s ? '' : s)} />)}
                  </View>
                </View>
              )}
              {availableColors.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Color</Text>
                  <View className="flex-row flex-wrap">
                    {availableColors.map((c) => <FilterChip key={c} label={c} selected={colorFilter === c} onPress={() => setColorFilter(colorFilter === c ? '' : c)} />)}
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
                  {SORT_OPTIONS.map((opt, idx) => <FilterChip key={opt.label} label={opt.label} selected={sortIndex === idx} onPress={() => setSortIndex(idx)} />)}
                </View>
              </View>
            </ScrollView>
            <View className="flex-row mt-4">
              <TouchableOpacity onPress={() => { clearFilters(); setShowFilters(false); }} className="flex-1 bg-gray-200 py-3 rounded-xl items-center">
                <Text className="text-gray-700 font-bold">Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilters(false)} className="flex-1 bg-blue-600 py-3 rounded-xl items-center ml-3">
                <Text className="text-white font-bold">Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
