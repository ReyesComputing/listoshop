import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import { Product } from '../types/database';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const inStock = product.stock > 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.8}
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
    >
      <Image
        source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
        className="w-full h-48"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-blue-600 font-semibold mt-1">
          {formatPrice(product.price)}
        </Text>
        <View className="flex-row items-center mt-1">
          <Package size={14} color={inStock ? '#16a34a' : '#dc2626'} />
          <Text className={`ml-1 text-xs ${inStock ? 'text-green-600' : 'text-red-600'}`}>
            {inStock ? `${product.stock} disponibles` : 'Agotado'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { if (inStock) addItem(product); }}
          disabled={!inStock}
          className={`py-2 rounded-lg mt-3 items-center ${inStock ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <Text className="text-white font-bold">
            {inStock ? 'Añadir al carrito' : 'Agotado'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
