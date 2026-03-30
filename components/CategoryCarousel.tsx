import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

const CATEGORIES = [
  { id: '1', name: 'Tenis' },
  { id: '2', name: 'Perfumes' },
  { id: '3', name: 'Ropa' },
  { id: '4', name: 'Accesorios' },
  { id: '5', name: 'Electrónica' },
];

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export function CategoryCarousel({ onSelectCategory, selectedCategory }: CategoryCarouselProps) {
  return (
    <View className="py-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelectCategory(category.name)}
            className={`mr-3 px-6 py-2 rounded-full border ${
              selectedCategory === category.name
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`font-semibold ${
                selectedCategory === category.name ? 'text-white' : 'text-gray-600'
              }`}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
