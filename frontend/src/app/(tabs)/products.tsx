import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../../hooks/queries/useProducts';
import { COLORS } from '../../constants/theme';
import ScreenBackground from '../../components/ui/ScreenBackground';
import GlassCard from '../../components/ui/GlassCard';

const CATEGORIES = ['All', 'Cleanser', 'Moisturizer', 'Serum', 'Sunscreen', 'Toner'];

export default function ProductsScreen() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const { data: products, isLoading } = useProducts(activeCategory === 'All' ? undefined : activeCategory);

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
        <View className="px-5 mt-2 mb-4">
          <Text className="text-[30px] font-poppins-bold tracking-[-0.4px] text-skin-text">Products</Text>
        </View>

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat || (!activeCategory && cat === 'All');
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive ? COLORS.primary : 'rgba(255,255,255,0.5)',
                  borderWidth: isActive ? 0 : 1,
                  borderColor: 'rgba(255,255,255,0.6)',
                }}
              >
                <Text
                  className="text-[13px] font-poppins-semibold"
                  style={{ color: isActive ? '#fff' : COLORS.textSecondary }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Product grid */}
        <FlatList
          data={products ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={{
                flex: 1,
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
              <Text className="text-[11px] font-poppins-semibold text-skin-text-tertiary uppercase tracking-wide">
                {item.brand}
              </Text>
              <Text className="text-sm font-poppins-bold text-skin-text mt-0.5 leading-[18px]" numberOfLines={2}>
                {item.name}
              </Text>
              <View
                className="mt-2 self-start px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
              >
                <Text className="text-[11px] font-poppins-semibold text-primary">{item.category}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center py-[60px]">
                <Text className="text-[48px] mb-4">🧴</Text>
                <Text className="text-base text-skin-text-secondary text-center">
                  No products found
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}
