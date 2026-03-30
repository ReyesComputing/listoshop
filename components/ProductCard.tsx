import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '../types/database';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const router = useRouter();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(price);

  const inStock = product.stock > 0;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.id}`)}
        activeOpacity={0.85}
        className="bg-white rounded-2xl overflow-hidden mb-3"
        style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
      >
        <View style={{ aspectRatio: 1 }} className="bg-gray-100">
          <Image
            source={{ uri: product.image_url || undefined }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {!inStock && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <Text className="text-white font-bold text-sm">Agotado</Text>
            </View>
          )}
          {product.brand && (
            <View className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-gray-700">{product.brand}</Text>
            </View>
          )}
        </View>
        <View className="p-2.5">
          <Text className="text-xs text-gray-500 mb-0.5" numberOfLines={1}>
            {product.category}
          </Text>
          <Text className="text-sm font-semibold text-gray-800 leading-tight" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="text-base font-bold text-blue-600 mt-1">
            {formatPrice(product.price)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.85}
      className="bg-white rounded-2xl mb-4 overflow-hidden"
      style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
    >
      <View className="flex-row">
        <View className="bg-gray-100" style={{ width: 130, height: 130 }}>
          <Image
            source={{ uri: product.image_url || undefined }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {!inStock && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <Text className="text-white font-bold text-xs">Agotado</Text>
            </View>
          )}
        </View>
        <View className="flex-1 p-3 justify-between">
          <View>
            {product.brand && (
              <Text className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                {product.brand}
              </Text>
            )}
            <Text className="text-base font-semibold text-gray-800 leading-tight" numberOfLines={2}>
              {product.name}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">{product.category}</Text>
          </View>
          <View className="flex-row items-end justify-between">
            <Text className="text-xl font-bold text-blue-600">
              {formatPrice(product.price)}
            </Text>
            {inStock && (
              <Text className="text-[10px] text-green-600 font-medium">{product.stock} disp.</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
