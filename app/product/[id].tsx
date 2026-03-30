import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, Package, Store as StoreIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Product, Store } from '../../types/database';
import { useCartStore } from '../../store/useCartStore';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state: any) => state.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setProduct(data);
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', data.store_id)
          .single();
        if (storeData) setStore(storeData);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);

  const handleAdd = () => {
    if (!product || product.stock <= 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text className="text-gray-500">Producto no encontrado</Text>
      </View>
    );
  }

  const inStock = product.stock > 0;

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        {/* Header con botón atrás */}
        <View className="absolute top-12 left-4 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/90 p-2 rounded-full shadow"
          >
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Imagen */}
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/400' }}
          style={{ width: '100%', height: 350 }}
          resizeMode="cover"
        />

        {/* Info */}
        <View className="p-5">
          {/* Categoría */}
          <Text className="text-blue-600 font-semibold text-sm mb-1">
            {product.category}
          </Text>

          {/* Nombre */}
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>

          {/* Precio */}
          <Text className="text-3xl font-bold text-blue-600 mb-4">
            {formatPrice(product.price)}
          </Text>

          {/* Stock */}
          <View className="flex-row items-center mb-4">
            <Package size={16} color={inStock ? '#16a34a' : '#dc2626'} />
            <Text className={`ml-2 font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
              {inStock ? `${product.stock} disponibles` : 'Agotado'}
            </Text>
          </View>

          {/* Descripción */}
          {product.description ? (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Descripción</Text>
              <Text className="text-gray-600 leading-6">{product.description}</Text>
            </View>
          ) : null}

          {/* Tienda */}
          {store ? (
            <View className="bg-gray-50 rounded-xl p-4 flex-row items-center mb-6">
              <View className="bg-blue-100 p-2 rounded-full mr-3">
                <StoreIcon size={20} color="#2563eb" />
              </View>
              <View>
                <Text className="font-semibold text-gray-800">{store.name}</Text>
                {store.description ? (
                  <Text className="text-gray-500 text-sm">{store.description}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Botón fijo de agregar al carrito */}
      <View className="p-4 border-t border-gray-100 bg-white">
        <TouchableOpacity
          onPress={handleAdd}
          disabled={!inStock}
          className={`py-4 rounded-xl items-center flex-row justify-center ${
            !inStock ? 'bg-gray-300' : added ? 'bg-green-500' : 'bg-blue-600'
          }`}
        >
          <ShoppingCart size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            {!inStock ? 'Agotado' : added ? '¡Añadido!' : 'Añadir al carrito'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
