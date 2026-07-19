import React from 'react';
import { View, Text, FlatList } from 'react-native';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-poppins-bold text-skin-text mb-3.5 px-1">Recommended for you</Text>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3"
        renderItem={({ item }) => (
          <View
            style={{
              width: 160,
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.6)',
              borderRadius: 18,
              padding: 14,
            }}
          >
            <View
              className="w-full h-[100px] rounded-lg items-center justify-center mb-2.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
            >
              <Text className="text-[32px]">✨</Text>
            </View>
            <Text className="text-[11px] font-poppins-semibold text-skin-text-tertiary uppercase tracking-wide">{item.brand}</Text>
            <Text className="text-sm font-poppins-bold text-skin-text mt-0.5 leading-[18px]" numberOfLines={2}>{item.name}</Text>
            <View className="mt-2 self-start px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <Text className="text-[11px] font-poppins-semibold text-primary">{item.category}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
