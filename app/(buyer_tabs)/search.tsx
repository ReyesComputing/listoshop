import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Search as SearchIcon, SlidersHorizontal, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';

const CATEGORIES = ['Todos', 'Tenis', 'Perfumes', 'Ropa', 'Accesorios', 'Electrónica'];

const SORT_OPTIONS = [
  { label: 'Recientes', value: 'created_at', ascending: false },
  { label: 'Precio: menor a mayor', value: 'price', ascending: true },
  { label: 'Precio: mayor a menor', value: 'price', ascending: false },
  { label: 'Nombre A-Z', value: 'name', ascending: true },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
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

  // Cargar opciones de filtro al montar
  useEffect(() => {
    const loadFilterOptions = async () => {
      const { data } = await supabase
        .from('products')
        .select('brand, size, color')
        .eq('is_active', true);
      if (data) {
        const brands = [...new Set(data.map((p) => p.brand).filter(Boolean))] as string[];
        const sizes = [...new Set(data.map((p) => p.size).filter(Boolean))] as string[];
        const colors = [...new Set(data.map((p) => p.color).filter(Boolean))] as string[];
        setAvailableBrands(brands.sort());
        setAvailableSizes(sizes.sort());
        setAvailableColors(colors.sort());
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

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (selectedCategory !== 'Todos') {
        query = query.eq('category', selectedCategory);
      }
      if (brandFilter) {
        query = query.eq('brand', brandFilter);
      }
      if (sizeFilter) {
        query = query.eq('size', sizeFilter);
      }
      if (colorFilter) {
        query = query.eq('color', colorFilter);
      }
      if (minPrice) {
        query = query.gte('price', Number(minPrice));
      }
      if (maxPrice) {
        query = query.lte('price', Number(maxPrice));
      }

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

  // Buscar al cambiar categoría o filtros
  useEffect(() => {
    handleSearch();
  }, [selectedCategory, brandFilter, sizeFilter, colorFilter, minPrice, maxPrice, sortIndex]);

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
      {/* Barra de búsqueda */}
      <View className="p-4 pb-2">
        <View className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex-row items-center">
          <SearchIcon size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Busca tenis, perfumes, ropa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="p-2 rounded-lg bg-gray-100 relative"
          >
            <SlidersHorizontal size={20} color="#2563eb" />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearch} className="bg-blue-600 px-4 py-2 rounded-lg ml-2">
            <Text className="text-white font-bold">Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categorías */}
      <View className="px-4 mb-2">
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

      {/* Filtros activos (chips) */}
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
                  {minPrice && maxPrice ? `$${minPrice} - $${maxPrice}` : minPrice ? `Desde $${minPrice}` : `Hasta $${maxPrice}`}
                </Text>
                <X size={14} color="#1d4ed8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={clearFilters} className="flex-row items-center bg-red-100 px-3 py-1 rounded-full">
              <Text className="text-red-600 text-sm font-medium">Limpiar todo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Ordenar + cantidad */}
      <View className="px-4 mb-2 flex-row justify-between items-center">
        <Text className="text-gray-500 text-sm">{products.length} resultados</Text>
        <TouchableOpacity
          onPress={() => setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length)}
          className="flex-row items-center"
        >
          <Text className="text-blue-600 text-sm font-medium">{SORT_OPTIONS[sortIndex].label}</Text>
          <ChevronDown size={16} color="#2563eb" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* Lista de productos */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <ProductCard product={item} />
          </View>
        )}
        numColumns={1}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400">
              {loading ? 'Buscando...' : 'No se encontraron productos'}
            </Text>
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
              {/* Marca */}
              {availableBrands.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Marca</Text>
                  <View className="flex-row flex-wrap">
                    {availableBrands.map((b) => (
                      <FilterChip
                        key={b}
                        label={b}
                        selected={brandFilter === b}
                        onPress={() => setBrandFilter(brandFilter === b ? '' : b)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Talla */}
              {availableSizes.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Talla</Text>
                  <View className="flex-row flex-wrap">
                    {availableSizes.map((s) => (
                      <FilterChip
                        key={s}
                        label={s}
                        selected={sizeFilter === s}
                        onPress={() => setSizeFilter(sizeFilter === s ? '' : s)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Color */}
              {availableColors.length > 0 && (
                <View className="mb-5">
                  <Text className="text-sm font-bold text-gray-700 mb-2">Color</Text>
                  <View className="flex-row flex-wrap">
                    {availableColors.map((c) => (
                      <FilterChip
                        key={c}
                        label={c}
                        selected={colorFilter === c}
                        onPress={() => setColorFilter(colorFilter === c ? '' : c)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Rango de precio */}
              <View className="mb-5">
                <Text className="text-sm font-bold text-gray-700 mb-2">Rango de precio (COP)</Text>
                <View className="flex-row items-center space-x-2">
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    placeholder="Mín"
                    className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-800"
                  />
                  <Text className="text-gray-400 mx-2">—</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholder="Máx"
                    className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-800"
                  />
                </View>
              </View>

              {/* Ordenar */}
              <View className="mb-5">
                <Text className="text-sm font-bold text-gray-700 mb-2">Ordenar por</Text>
                <View className="flex-row flex-wrap">
                  {SORT_OPTIONS.map((opt, idx) => (
                    <FilterChip
                      key={opt.label}
                      label={opt.label}
                      selected={sortIndex === idx}
                      onPress={() => setSortIndex(idx)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Botones */}
            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => { clearFilters(); setShowFilters(false); }}
                className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-bold">Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center ml-3"
              >
                <Text className="text-white font-bold">Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
