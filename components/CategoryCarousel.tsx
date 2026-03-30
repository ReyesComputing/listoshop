import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';

const CATEGORIES = [
  { id: '0', name: 'Todos', emoji: '🛍️' },
  { id: '1', name: 'Tenis', emoji: '👟' },
  { id: '2', name: 'Perfumes', emoji: '🧴' },
  { id: '3', name: 'Ropa', emoji: '👕' },
  { id: '4', name: 'Accesorios', emoji: '⌚' },
  { id: '5', name: 'Electrónica', emoji: '🎧' },
];

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export function CategoryCarousel({ onSelectCategory, selectedCategory }: CategoryCarouselProps) {
  return (
    <View className="py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.name || (category.name === 'Todos' && !selectedCategory);
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelectCategory(category.name === 'Todos' ? '' : category.name)}
              className={`mr-2 px-4 py-2 rounded-full border items-center flex-row ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200'
              }`}
              style={!isSelected ? { elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } : undefined}
            >
              <Text className="mr-1.5 text-base">{category.emoji}</Text>
              <Text
                className={`font-semibold text-sm ${
                  isSelected ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
